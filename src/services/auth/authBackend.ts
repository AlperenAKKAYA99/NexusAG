/**
 * AuthBackend — Strategy interface and shared helpers for IDE account switching.
 *
 * Separates Antigravity ≥ 2.27 (`agy --hub`) session management from
 * pre-2.27 (`language_server_*` + USS) token synchronization.
 */

import * as vscode from 'vscode';
import { SwitchAccountOptions, USSApi } from '../../types';
import {
    encodeString,
    encodeVarintField,
    encodeMessage,
    extractField,
    extractStringField,
} from '../../shared/protobuf';
import { dbExec, dbGet } from '../../shared/db';
import { callLSEndpoint, loadLSCert, LsEndpoint } from '../../utils/lsClient';
import { LS_SERVICE_PATH } from '../../constants';
import { createLogger } from '../../utils/logger';

const log = createLogger('AuthBackend');

export type AuthBackendType = 'agy-hub' | 'legacy-uss';

export interface AuthSwitchResult {
    confirmed: boolean;
    backend: AuthBackendType;
    /** Actual active email reported by the backend after the switch attempt */
    activeEmail?: string;
    /** True if confirmation occurred via the guided native sign-in flow */
    guidedSignIn?: boolean;
}

export interface AuthBackend {
    readonly type: AuthBackendType;
    detect(): Promise<boolean>;
    getCurrentEmail(): Promise<string>;
    switchAccount(
        opts: SwitchAccountOptions,
        isCancelled: () => boolean,
    ): Promise<AuthSwitchResult>;
}

// ==================== Shared USS / DB / LS Helpers ====================

export function delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
}

/**
 * Execute IDE auth refresh command — checks registered commands first so
 * Antigravity ≥ 2.27 (where `handleAuthRefresh` was removed) does not throw.
 */
export async function executeAuthRefresh(): Promise<boolean> {
    const candidates = [
        'antigravity.handleAuthRefresh',
        'antigravity.refreshAuth',
        'antigravity.internal.refreshAuth',
    ];
    let registeredCommands: Set<string>;
    try {
        registeredCommands = new Set(await vscode.commands.getCommands(true));
    } catch (e: any) {
        log.warn('executeAuthRefresh: unable to inspect registered commands:', e?.message);
        return false;
    }

    for (const cmd of candidates) {
        if (!registeredCommands.has(cmd)) continue;
        try {
            await vscode.commands.executeCommand(cmd);
            log.info(`executeAuthRefresh: ${cmd} succeeded`);
            return true;
        } catch { /* try next */ }
    }
    log.diag('executeAuthRefresh: no registered auth refresh command available');
    return false;
}

/** Wrap raw UserStatus proto bytes in USS UpdateRequest and push via IPC */
export async function pushUserStatusToUSS(uss: USSApi, userStatus: Buffer): Promise<void> {
    const row = encodeString(1, userStatus.toString('base64'));
    const update = Buffer.concat([
        encodeString(1, 'userStatusSentinelKey'),
        encodeMessage(2, row),
    ]);
    const req = Buffer.concat([
        encodeString(1, 'uss-userStatus'),
        encodeMessage(5, update),
    ]);
    await uss.pushSerializedUpdateIPC(req.toString('base64'));
}

/**
 * Push authStateWithContextSentinelKey to uss-oauth topic.
 * Sets internal authState to "signedIn" to suppress the title bar login nudge.
 */
export async function pushAuthStateToUSS(uss: USSApi): Promise<void> {
    try {
        const authStateJson = JSON.stringify({
            state: 'signedIn',
            context: {
                project: '',
                showProjectError: false,
                errorMessage: '',
                ineligibleMessage: '',
                verificationUrl: '',
                isGcpTos: false,
                browserOpenFailed: false,
                appealUrl: '',
                appealLinkText: '',
            },
        });
        const row = encodeString(1, authStateJson);
        const update = Buffer.concat([
            encodeString(1, 'authStateWithContextSentinelKey'),
            encodeMessage(2, row),
        ]);
        const req = Buffer.concat([
            encodeString(1, 'uss-oauth'),
            encodeMessage(5, update),
        ]);
        await uss.pushSerializedUpdateIPC(req.toString('base64'));
    } catch (e: any) {
        log.warn('pushAuthStateToUSS failed (non-fatal):', e?.message);
    }
}

/** Build raw user status protobuf binary base64 */
export function buildUserStatusProto(name: string, email: string): string {
    const proto = Buffer.concat([
        encodeVarintField(2, 1),
        encodeString(3, name),
        encodeString(7, email),
        encodeString(6, 'g1-pro-tier'),
    ]);
    return proto.toString('base64');
}

/** Write profile picture URL directly to IDE state database for title bar avatar */
export function writeProfileUrlToDb(url: string): void {
    if (!url || url.length < 10) return;
    const hex = Buffer.from(url, 'utf-8').toString('hex');
    const sql = `INSERT OR REPLACE INTO ItemTable (key, value) VALUES ('antigravity.profileUrl', CAST(X'${hex}' AS TEXT));`;
    dbExec(sql).catch(err => log.warn('Profile URL DB write failed:', err?.message));
}

/** Write auth status JSON to the IDE's state database (`antigravityAuthStatus`) */
export async function writeAuthStatusToDb(
    name: string,
    email: string,
    apiKey: string,
    context?: vscode.ExtensionContext,
): Promise<boolean> {
    const proto = Buffer.concat([encodeVarintField(2, 1), encodeString(3, name), encodeString(7, email)]);
    const json = JSON.stringify({ name, apiKey, email, userStatusProtoBinaryBase64: proto.toString('base64') });

    const hexValue = Buffer.from(json, 'utf-8').toString('hex');
    const sql = `INSERT OR REPLACE INTO ItemTable (key, value) VALUES ('antigravityAuthStatus', CAST(X'${hexValue}' AS TEXT));`;

    const ok = await dbExec(sql).catch(err => {
        log.warn('Auth status DB write failed:', err?.message);
        return false;
    });

    // Also suppress recurring terms/telemetry modals for this email
    await suppressTermsNotice(email, context).catch(err => {
        log.warn('suppressTermsNotice background warning:', err?.message);
    });

    return ok;
}

/**
 * Suppress the recurring "Security Notice & Data Use" / terms & telemetry consent prompt.
 *
 * In Antigravity IDE (jetskiAgent / workbench), whenever an account's email does not match
 * the onboarding record `agy.onboarding.lastLoginUsername` / `jetski.onboarding.lastLoginUsername`,
 * the IDE opens Screen 7 ("Security Notice & Data Use") asking the user to accept terms
 * and interaction telemetry.
 *
 * This function ensures both the live in-memory storage (via ExtHostStorage bridge) and
 * persistent SQLite state (ItemTable in state.vscdb) record the target account as having
 * already consented to terms and telemetry.
 */
export async function suppressTermsNotice(
    email: string,
    context?: vscode.ExtensionContext,
): Promise<boolean> {
    if (!email) return false;
    const targetEmail = email.trim();
    let memorySynced = false;

    // 1. Live in-memory ExtHostStorage update (broadcasts to VS Code workbench & webview)
    if (context?.globalState) {
        try {
            const extStorage = (context.globalState as any)?._storage;
            if (extStorage && typeof extStorage.initializeExtensionStorage === 'function' && typeof extStorage.setValue === 'function') {
                const currentData = await extStorage.initializeExtensionStorage(true, 'google.google-antigravity', {});
                const updated = { ...(currentData || {}) };
                updated['antigravity.accountTelemetryEnabled'] = true;
                if (!updated['antigravity-storage'] || typeof updated['antigravity-storage'] !== 'object') {
                    updated['antigravity-storage'] = {};
                }
                updated['antigravity-storage']['agy.onboarding.lastLoginUsername'] = targetEmail;
                updated['antigravity-storage']['agy.onboarding.lastLoginIsGcpTos'] = 'false';
                updated['antigravity-storage']['jetski.onboarding.lastLoginUsername'] = targetEmail;
                updated['antigravity-storage']['jetski.onboarding.lastLoginIsGcpTos'] = 'false';

                await extStorage.setValue(true, 'google.google-antigravity', updated);
                memorySynced = true;
                log.info(`suppressTermsNotice: in-memory live storage synced for ${targetEmail}`);
            }
        } catch (e: any) {
            log.warn('suppressTermsNotice: in-memory storage sync warning:', e?.message);
        }
    }

    // 2. Direct SQLite state.vscdb persistence (ensures persistence across window reloads/restarts)
    try {
        const rawJson = await dbGet('google.google-antigravity');
        let parsed: Record<string, any> = {};
        if (rawJson) {
            try {
                parsed = JSON.parse(rawJson);
            } catch {
                parsed = {};
            }
        }

        parsed['antigravity.accountTelemetryEnabled'] = true;
        if (!parsed['antigravity-storage'] || typeof parsed['antigravity-storage'] !== 'object') {
            parsed['antigravity-storage'] = {};
        }

        parsed['antigravity-storage']['agy.onboarding.lastLoginUsername'] = targetEmail;
        parsed['antigravity-storage']['agy.onboarding.lastLoginIsGcpTos'] = 'false';
        parsed['antigravity-storage']['jetski.onboarding.lastLoginUsername'] = targetEmail;
        parsed['antigravity-storage']['jetski.onboarding.lastLoginIsGcpTos'] = 'false';

        const updatedJson = JSON.stringify(parsed);
        const hexVal = Buffer.from(updatedJson, 'utf-8').toString('hex');
        const sql1 = `INSERT OR REPLACE INTO ItemTable (key, value) VALUES ('google.google-antigravity', CAST(X'${hexVal}' AS TEXT));`;
        await dbExec(sql1);

        const sql2 = `INSERT OR REPLACE INTO ItemTable (key, value) VALUES ('antigravityOnboarding', 'true');`;
        await dbExec(sql2);

        log.info(`suppressTermsNotice: state.vscdb on-disk write confirmed for ${targetEmail}`);
        return true;
    } catch (err: any) {
        log.warn(`suppressTermsNotice failed for ${targetEmail}:`, err?.message);
        return memorySynced;
    }
}

/** Read current userStatus proto and email from a Language Server / Hub endpoint */
export async function queryEndpointUserStatus(
    ls: LsEndpoint,
    ca = loadLSCert(),
): Promise<{ userStatus: Buffer | null; email: string }> {
    const body = await callLSEndpoint(ls, `${LS_SERVICE_PATH}/GetUserStatus`, ca);
    const userStatus = body ? extractField(body, 1) : null;
    if (!userStatus || userStatus.length <= 5) {
        return { userStatus: null, email: '' };
    }
    const email = extractStringField(userStatus, 7) || '';
    return { userStatus, email };
}

