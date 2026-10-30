import * as vscode from 'vscode';
import { GoogleAuthService } from './googleAuth';
import { SwitchAccountOptions } from '../types';
import { getUSS } from '../utils/uss';
import { createLogger } from '../utils/logger';
import { findLSEndpoints, loadLSCert, callLSEndpoint, isAgyHubActive } from '../utils/lsClient';
import { LS_SERVICE_PATH, RENEWAL_RETRY_DELAY_MS } from '../constants';
import {
    AuthSwitchResult,
    buildUserStatusProto,
    resolveAuthBackend,
    suppressTermsNotice,
    writeAuthStatusToDb,
} from './auth';

const log = createLogger('AccountSwitch');

/**
 * AccountSwitchService — Coordinates IDE account switching across both
 * Antigravity ≥ 2.27 (`AgyHubBackend`) and pre-2.27 (`LegacyUssBackend`).
 */
export class AccountSwitchService {

    private readonly context: vscode.ExtensionContext;
    private readonly authService: GoogleAuthService;

    // Proactive Token Renewal state (used only on LegacyUssBackend)
    private renewalTimer: ReturnType<typeof setTimeout> | null = null;
    private activeRefreshToken: string | null = null;
    private activeEmail: string | null = null;

    // Monotonically increasing counter per switch call to abort stale polls.
    private switchGeneration = 0;

    /** Buffer before expiry to trigger refresh (10 minutes in seconds) */
    private static readonly RENEWAL_BUFFER_SECS = 10 * 60;
    /** Minimum delay to prevent tight loops on clock skew (30 seconds) */
    private static readonly MIN_RENEWAL_DELAY_MS = 30_000;
    /** Maximum safe setTimeout delay — Node.js caps at 2^31-1 ms (~24.8 days) */
    private static readonly MAX_TIMEOUT_MS = 2_147_483_647;

    constructor(context: vscode.ExtensionContext, authService: GoogleAuthService) {
        this.context = context;
        this.authService = authService;
    }

    /** Clean up the renewal timer on extension deactivation */
    dispose(): void {
        if (this.renewalTimer) {
            clearTimeout(this.renewalTimer);
            this.renewalTimer = null;
        }
        this.switchGeneration++; // Abort any running polls
        this.activeRefreshToken = null;
        this.activeEmail = null;
        log.info('Token renewal stopped');
    }

    /** Returns the active refresh token in memory if known */
    getActiveRefreshToken(): string | null {
        return this.activeRefreshToken;
    }

    async switchAccount(opts: SwitchAccountOptions): Promise<AuthSwitchResult> {
        const { email, refreshToken, expiryTimestamp } = opts;

        // Bump generation FIRST — aborts any in-flight polling from previous switch
        this.switchGeneration++;
        const generation = this.switchGeneration;
        const isCancelled = () => generation !== this.switchGeneration;

        try {
            await suppressTermsNotice(email, this.context);
            const backend = await resolveAuthBackend(this.context);
            log.info(`switchAccount: using backend=${backend.type} for ${email}`);

            const result = await backend.switchAccount(opts, isCancelled);

            // Schedule proactive token renewal ONLY for confirmed legacy-uss switches.
            // In Antigravity ≥ 2.27 (`agy-hub`), the Hub manages its own token lifecycle.
            if (result.confirmed && result.backend === 'legacy-uss') {
                this.scheduleTokenRenewal(refreshToken, expiryTimestamp, email);
            } else {
                if (this.renewalTimer) {
                    clearTimeout(this.renewalTimer);
                    this.renewalTimer = null;
                }
                if (result.confirmed) {
                    this.activeRefreshToken = refreshToken;
                    this.activeEmail = email;
                }
                log.info(`Token renewal skipped (confirmed=${result.confirmed}, backend=${result.backend})`);
            }

            if (result.confirmed) {
                vscode.window.showInformationMessage(`✅ Switched to ${email}`);
            }
            return result;
        } catch (err: any) {
            vscode.window.showErrorMessage(`Failed to switch account: ${err?.message || err}`);
            log.error('Switch failed:', err);
            return { confirmed: false, backend: (await isAgyHubActive()) ? 'agy-hub' : 'legacy-uss' };
        }
    }

    // ==================== Proactive Token Renewal (Legacy USS Only) ====================

    private scheduleTokenRenewal(refreshToken: string, expiryTimestamp: number, email: string): void {
        if (this.renewalTimer) {
            clearTimeout(this.renewalTimer);
            this.renewalTimer = null;
        }

        this.activeRefreshToken = refreshToken;
        this.activeEmail = email;

        const nowSecs = Math.floor(Date.now() / 1000);
        const renewAtSecs = expiryTimestamp - AccountSwitchService.RENEWAL_BUFFER_SECS;
        const delayMs = Math.min(
            Math.max((renewAtSecs - nowSecs) * 1000, AccountSwitchService.MIN_RENEWAL_DELAY_MS),
            AccountSwitchService.MAX_TIMEOUT_MS,
        );

        const delayMins = Math.round(delayMs / 60_000);
        log.info(`Token renewal scheduled in ${delayMins}m for ${email} (expiry in ${Math.round((expiryTimestamp - nowSecs) / 60)}m)`);

        this.renewalTimer = setTimeout(() => this.executeRenewal(), delayMs);
    }

    private async executeRenewal(): Promise<void> {
        if (!this.activeRefreshToken || !this.activeEmail) return;

        // If IDE upgraded or switched to agy --hub, stop legacy renewal loop
        if (await isAgyHubActive()) {
            log.info('agy --hub detected; stopping legacy USS token renewal');
            return;
        }

        try {
            const refreshed = await this.authService.refreshAccessToken(this.activeRefreshToken);
            const newExpiry = Math.floor(Date.now() / 1000) + (refreshed.expires_in || 3600);

            if (refreshed.refresh_token) {
                this.activeRefreshToken = refreshed.refresh_token;
            }

            const uss = getUSS();
            if (uss) {
                await uss.OAuthPreferences.setOAuthTokenInfo({
                    accessToken: refreshed.access_token,
                    refreshToken: this.activeRefreshToken,
                    expiryDateSeconds: newExpiry,
                    tokenType: 'Bearer',
                    isGcpTos: false,
                });
            }

            const endpoints = await findLSEndpoints();
            if (endpoints.length > 0) {
                const ca = loadLSCert();
                await Promise.allSettled(
                    endpoints.map(ls => callLSEndpoint(ls, `${LS_SERVICE_PATH}/RegisterGdmUser`, ca)),
                );
            }

            log.info(`✅ Token renewed for ${this.activeEmail}, next in ~${Math.round((refreshed.expires_in || 3600) / 60) - 10}m`);

            this.scheduleTokenRenewal(this.activeRefreshToken, newExpiry, this.activeEmail);
        } catch (err: any) {
            log.error(`❌ Token renewal failed for ${this.activeEmail}:`, err?.message || err);
            this.renewalTimer = setTimeout(() => this.executeRenewal(), RENEWAL_RETRY_DELAY_MS);
        }
    }

    // ==================== Shared Public Helpers ====================

    buildUserStatusProto(name: string, email: string): string {
        return buildUserStatusProto(name, email);
    }

    async writeAuthStatusToDb(name: string, email: string, apiKey: string): Promise<boolean> {
        return writeAuthStatusToDb(name, email, apiKey);
    }

    async testApiAccess(): Promise<boolean> {
        try {
            if (await isAgyHubActive()) return true;
            const uss = getUSS();
            if (!uss) return false;
            await uss.OAuthPreferences.getOAuthTokenInfo();
            return true;
        } catch {
            return false;
        }
    }
}
