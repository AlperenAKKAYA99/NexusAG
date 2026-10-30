/**
 * LegacyUssBackend — Pre-2.27 Antigravity account switching strategy.
 *
 * Uses IDE UnifiedStateSync (USS) `uss-oauth` + `RegisterGdmUser` on
 * `language_server_*` processes to switch accounts without reloading the window.
 */

import * as vscode from 'vscode';
import { SwitchAccountOptions, USSApi } from '../../types';
import { getUSS } from '../../utils/uss';
import { encodeString, extractField, extractStringField } from '../../shared/protobuf';
import { findLSEndpoints, loadLSCert, callLSEndpoint, LsEndpoint } from '../../utils/lsClient';
import { LS_SERVICE_PATH } from '../../constants';
import { createLogger } from '../../utils/logger';
import {
    AuthBackend,
    AuthSwitchResult,
    delay,
    executeAuthRefresh,
    pushAuthStateToUSS,
    pushUserStatusToUSS,
    writeAuthStatusToDb,
    writeProfileUrlToDb,
    queryEndpointUserStatus,
    suppressTermsNotice,
} from './authBackend';

const log = createLogger('LegacyUssBackend');

export class LegacyUssBackend implements AuthBackend {
    readonly type = 'legacy-uss' as const;

    constructor(private readonly context?: vscode.ExtensionContext) {}

    private static readonly LS_READY_MAX_WAIT_MS = 15_000;
    private static readonly LS_READY_POLL_INTERVAL_MS = 500;
    private static readonly POLL_MAX_WAIT_MS = 30_000;
    private static readonly POLL_INTERVAL_MS = 1_000;
    private static readonly POLL_INITIAL_DELAY_MS = 500;
    private static readonly REGISTER_RETRY_INTERVAL_MS = 5_000;
    private static readonly POST_REGISTER_SETTLE_MS = 2_000;

    async detect(): Promise<boolean> {
        const endpoints = await findLSEndpoints();
        return endpoints.some(e => !e.isHub);
    }

    async getCurrentEmail(): Promise<string> {
        const endpoints = await findLSEndpoints();
        if (endpoints.length > 0) {
            try {
                const { email } = await queryEndpointUserStatus(endpoints[0]);
                if (email) return email;
            } catch { /* ignore */ }
        }
        return '';
    }

    async switchAccount(
        opts: SwitchAccountOptions,
        isCancelled: () => boolean,
    ): Promise<AuthSwitchResult> {
        const { email, name, accessToken, refreshToken, expiryTimestamp } = opts;

        const uss = getUSS();
        if (!uss) {
            vscode.window.showErrorMessage('antigravityUnifiedStateSync API not available.');
            return { confirmed: false, backend: this.type };
        }

        // 1. Push signedIn auth state to uss-oauth
        await pushAuthStateToUSS(uss);
        await suppressTermsNotice(email, this.context);

        // 2. Set OAuth token in USS
        await uss.OAuthPreferences.setOAuthTokenInfo({
            accessToken,
            refreshToken,
            expiryDateSeconds: expiryTimestamp,
            tokenType: 'Bearer',
            isGcpTos: false,
        });

        // 3. IPC settling delay
        await delay(350);

        // 4. Auth refresh command (available on pre-2.27)
        try {
            await executeAuthRefresh();
        } catch (e: any) {
            log.warn('Auth refresh failed (non-fatal):', e?.message);
        }

        // 4b. Re-assert signedIn state in uss-oauth
        await pushAuthStateToUSS(uss);

        // 5. Readiness Gate
        const { endpoints } = await this.awaitLSReadiness(isCancelled);

        // 6. RegisterGdmUser + settle + retry
        await this.callRegisterGdmUser(endpoints);
        await delay(LegacyUssBackend.POST_REGISTER_SETTLE_MS);

        const freshEndpoints = await findLSEndpoints();
        if (freshEndpoints.length > 0) {
            await this.callRegisterGdmUser(freshEndpoints);
            log.info(`registerGdmUser retry: called on ${freshEndpoints.length} fresh endpoint(s)`);
        }

        // 7. Await email confirmation from LS
        const result = await this.pollRichUserStatus(
            uss,
            isCancelled,
            email,
            freshEndpoints.length > 0 ? freshEndpoints : endpoints,
        );

        if (result.confirmed) {
            await writeAuthStatusToDb(name, email, accessToken, this.context);
            await suppressTermsNotice(email, this.context);
            return { confirmed: true, backend: this.type, activeEmail: email };
        }

        log.warn('Email confirmation timed out — LS may not have adopted the new email yet');
        return { confirmed: false, backend: this.type, activeEmail: await this.getCurrentEmail() };
    }

    async callRegisterGdmUser(lsEndpoints: LsEndpoint[]): Promise<void> {
        let endpoints = lsEndpoints;
        if (endpoints.length === 0) {
            endpoints = await findLSEndpoints();
            if (endpoints.length === 0) return;
        }
        const ca = loadLSCert();
        const results = await Promise.allSettled(
            endpoints.map(ls => callLSEndpoint(ls, `${LS_SERVICE_PATH}/RegisterGdmUser`, ca)),
        );
        results.forEach((r, i) => {
            const ls = endpoints[i];
            log.info(`registerGdmUser on port=${ls.port}: ${r.status === 'fulfilled' ? 'OK' : (r as PromiseRejectedResult).reason}`);
        });
    }

    private async awaitLSReadiness(
        isCancelled: () => boolean,
        maxWaitMs = LegacyUssBackend.LS_READY_MAX_WAIT_MS,
        intervalMs = LegacyUssBackend.LS_READY_POLL_INTERVAL_MS,
    ): Promise<{ ready: boolean; endpoints: LsEndpoint[] }> {
        const ca = loadLSCert();
        const start = Date.now();

        while (Date.now() - start < maxWaitMs) {
            if (isCancelled()) return { ready: false, endpoints: [] };
            const endpoints = await findLSEndpoints();
            if (endpoints.length === 0) {
                await delay(intervalMs);
                continue;
            }
            const ls = endpoints[0];
            try {
                const { userStatus, email } = await queryEndpointUserStatus(ls, ca);
                if (userStatus && email) {
                    log.info(`LS readiness gate: READY (email=${email}, ${Date.now() - start}ms, ${endpoints.length} LS)`);
                    return { ready: true, endpoints };
                }
            } catch (e: any) {
                log.info(`LS readiness gate: probe failed (${e?.message}), waiting...`);
            }
            await delay(intervalMs);
        }
        return { ready: false, endpoints: [] };
    }

    private async pollRichUserStatus(
        uss: USSApi,
        isCancelled: () => boolean,
        targetEmail: string,
        initialEndpoints: LsEndpoint[],
        maxWaitMs = LegacyUssBackend.POLL_MAX_WAIT_MS,
        intervalMs = LegacyUssBackend.POLL_INTERVAL_MS,
    ): Promise<{ confirmed: boolean }> {
        let lsProcesses = initialEndpoints.length > 0 ? initialEndpoints : await findLSEndpoints();
        if (lsProcesses.length === 0) return { confirmed: false };
        const ca = loadLSCert();
        let ls = lsProcesses[0];

        let emailMatched = false;
        const targetNorm = targetEmail.toLowerCase();
        const start = Date.now();
        let pollCount = 0;
        let lastRegisterRetry = Date.now();

        await delay(LegacyUssBackend.POLL_INITIAL_DELAY_MS);

        while (Date.now() - start < maxWaitMs) {
            if (isCancelled()) {
                log.info('Polling aborted — newer switch detected');
                return { confirmed: false };
            }

            if (!emailMatched && Date.now() - lastRegisterRetry > LegacyUssBackend.REGISTER_RETRY_INTERVAL_MS) {
                log.info('Poll: retrying registerGdmUser (LS email still stale)');
                const retryEndpoints = await findLSEndpoints();
                if (retryEndpoints.length > 0) {
                    await this.callRegisterGdmUser(retryEndpoints);
                    ls = retryEndpoints[0];
                }
                try {
                    await executeAuthRefresh();
                } catch { /* non-fatal */ }
                lastRegisterRetry = Date.now();
            }

            pollCount++;
            try {
                const { userStatus, email: lsEmail } = await queryEndpointUserStatus(ls, ca);
                const elapsed = Date.now() - start;
                if (pollCount <= 3 || pollCount % 5 === 0) {
                    log.info(`poll#${pollCount} @${elapsed}ms: email=${lsEmail || '(empty)'} target=${targetEmail}`);
                }

                if (!userStatus || emailMatched) {
                    await delay(intervalMs);
                    continue;
                }
                if (!lsEmail || lsEmail.toLowerCase() !== targetNorm) {
                    await delay(intervalMs);
                    continue;
                }

                emailMatched = true;
                log.info(`EMAIL_MATCH @${elapsed}ms poll#${pollCount}: statusLen=${userStatus.length}B — pushing to USS`);

                await pushUserStatusToUSS(uss, userStatus);
                await pushAuthStateToUSS(uss);
                await executeAuthRefresh();

                this.stabilizeUSS(uss, ls, ca, isCancelled, userStatus.length, intervalMs, maxWaitMs - (Date.now() - start))
                    .catch(err => log.warn('USS stabilization error:', err?.message));

                return { confirmed: true };
            } catch (e: any) {
                const msg = e?.message || '';
                if (msg.includes('401') || msg.includes('CSRF') || msg.includes('unauthenticated')) {
                    lsProcesses = await findLSEndpoints();
                    if (lsProcesses.length > 0) ls = lsProcesses[0];
                } else {
                    log.warn('UserStatus poll iteration failed:', msg);
                }
            }

            await delay(intervalMs);
        }
        return { confirmed: emailMatched };
    }

    private async stabilizeUSS(
        uss: USSApi,
        ls: LsEndpoint,
        ca: Buffer | undefined,
        isCancelled: () => boolean,
        initialSize: number,
        intervalMs: number,
        remainingMs: number,
    ): Promise<void> {
        let lastSize = initialSize;
        let stableCount = 0;
        const start = Date.now();

        while (Date.now() - start < remainingMs) {
            if (isCancelled()) return;
            await delay(intervalMs);

            try {
                const body = await callLSEndpoint(ls, `${LS_SERVICE_PATH}/GetUserStatus`, ca);
                let userStatus = body ? extractField(body, 1) : null;
                if (!userStatus || userStatus.length <= 5) continue;

                const profilePicUrl = await this.fetchProfilePicUrl(ls, ca);
                if (profilePicUrl) {
                    userStatus = Buffer.concat([userStatus, encodeString(38, profilePicUrl)]);
                    writeProfileUrlToDb(profilePicUrl);
                }

                if (userStatus.length <= lastSize) {
                    stableCount++;
                    if (stableCount >= 2) return;
                    continue;
                }

                await pushUserStatusToUSS(uss, userStatus);
                await executeAuthRefresh();
                lastSize = userStatus.length;
                stableCount = 0;
            } catch (e: any) {
                log.warn('USS stabilize iteration failed:', e?.message);
            }
        }
    }

    private async fetchProfilePicUrl(ls: LsEndpoint, ca: Buffer | undefined): Promise<string> {
        try {
            const body = await callLSEndpoint(ls, `${LS_SERVICE_PATH}/GetProfileData`, ca);
            const url = body ? extractStringField(body, 1) : '';
            return url.length > 10 ? url : '';
        } catch {
            return '';
        }
    }
}

