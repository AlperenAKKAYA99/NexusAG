/**
 * AgyHubBackend — Account switching strategy for Antigravity ≥ 2.27 (`agy --hub`).
 *
 * Architecture in Antigravity IDE 2.27+:
 *   - The built-in `google.google-antigravity` extension (`extensions/agy`) spawns
 *     `agy.exe --hub --hub-port=<PORT> --csrf_token=<TOKEN>` and attaches a stdout
 *     listener (`AntigravityServerManager.attachServerProcessStreams`) that automatically
 *     intercepts `ANTIGRAVITY_OPEN_URL:<url>` and opens it via `vscode.env.openExternal`.
 *   - `agy --hub` stores and reads active session tokens from the OS Keyring
 *     (`gemini:antigravity`) with file fallback to `~/.gemini/gemini-oauth.json` and
 *     `~/.gemini/oauth_creds.json`.
 *   - AntigravityServerManager automatically monitors `agy.exe` and auto-recovers
 *     (restarts) within ~1-2 seconds if the process exits, loading the fresh credentials.
 *
 * Switching strategy:
 *   1. Direct Switch (Primary, Zero-Browser, Instant):
 *      When valid tokens are present in SecretStorage, NexusAG:
 *        a. Formats and writes the target account's OAuth credentials directly into
 *           the OS Keyring (`gemini:antigravity`) and file fallbacks.
 *        b. Pre-synchronizes USS (`uss-oauth`, `uss-userStatus`, `uss-enterprisePreferences`)
 *           and `state.vscdb`.
 *        c. Resolves this window's `agy --hub` PID and terminates it cleanly.
 *        d. AntigravityServerManager auto-restarts `agy --hub`, which loads the newly
 *           injected credentials on startup.
 *        e. NexusAG polls `GetUserStatus` until the Hub confirms the target account,
 *           achieving seamless, instant account switching without browser popups.
 *
 *   2. Guided Native Sign-In (Fallback):
 *      If tokens are missing or direct switch does not confirm, NexusAG gracefully
 *      falls back to guided native browser sign-in via `antigravity.internal.loginWithRedirect`.
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import { SwitchAccountOptions } from '../../types';
import { getUSS } from '../../utils/uss';
import {
    callLsJson,
    findLSEndpoints,
    isAgyHubActive,
    loadLSCert,
    LsEndpoint,
} from '../../utils/lsClient';
import { createLogger } from '../../utils/logger';
import {
    AuthBackend,
    AuthSwitchResult,
    delay,
    executeAuthRefresh,
    pushAuthStateToUSS,
    pushUserStatusToUSS,
    queryEndpointUserStatus,
    suppressTermsNotice,
    writeAuthStatusToDb,
} from './authBackend';

const log = createLogger('AgyHubBackend');
const execAsync = promisify(exec);

export class AgyHubBackend implements AuthBackend {
    readonly type = 'agy-hub' as const;

    private static readonly DIRECT_POLL_TIMEOUT_MS = 15_000;
    private static readonly DIRECT_POLL_INTERVAL_MS = 500;
    private static readonly LOGIN_MAX_WAIT_MS = 120_000;
    private static readonly LOGIN_POLL_INTERVAL_MS = 1_000;

    constructor(private readonly context?: vscode.ExtensionContext) {}

    async detect(): Promise<boolean> {
        return isAgyHubActive();
    }

    async getCurrentEmail(): Promise<string> {
        const endpoints = await findLSEndpoints();
        if (endpoints.length === 0) return '';
        const { email } = await queryEndpointUserStatus(endpoints[0]);
        return email;
    }

    async switchAccount(
        opts: SwitchAccountOptions,
        isCancelled: () => boolean,
    ): Promise<AuthSwitchResult> {
        const { email, accessToken, refreshToken } = opts;
        const targetNorm = email.toLowerCase();
        const ca = loadLSCert();

        const endpoints = await findLSEndpoints();
        if (endpoints.length === 0) {
            vscode.window.showErrorMessage('Antigravity Hub server not found.');
            return { confirmed: false, backend: 'agy-hub' };
        }

        let ls: LsEndpoint = endpoints[0];
        const initialStatus = await queryEndpointUserStatus(ls, ca);
        const initialEmailNorm = initialStatus.email.toLowerCase();

        log.info(`switchAccount: hub port=${ls.port} current=${initialStatus.email || '(none)'} target=${email}`);

        const uss = getUSS();

        // Already signed in to the target account on this window's Hub
        if (initialEmailNorm === targetNorm && initialStatus.userStatus) {
            await this.syncUssAndDb(uss, opts, initialStatus.userStatus);
            return { confirmed: true, backend: 'agy-hub', activeEmail: initialStatus.email };
        }

        if (isCancelled()) {
            return { confirmed: false, backend: 'agy-hub', activeEmail: initialStatus.email };
        }

        // ── Strategy 1: Direct Switch (Zero-Browser, Instant) ──
        if (accessToken && refreshToken) {
            log.info(`switchAccount: attempting direct credential injection for ${email}`);

            const directResult = await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: `NexusAG: Switching directly to ${email}...`,
                    cancellable: true,
                },
                async (_progress, token) => {
                    return this.directSwitch(ls, opts, uss, ca, isCancelled, token);
                },
            );

            if (directResult.confirmed) {
                return directResult;
            }

            if (isCancelled()) {
                return { confirmed: false, backend: 'agy-hub', activeEmail: initialStatus.email };
            }

            log.warn(`Direct switch to ${email} did not confirm; falling back to guided native browser flow`);
        }

        // ── Strategy 2: Guided Native Sign-In (Fallback) ──
        return this.guidedBrowserSwitch(ls, opts, uss, ca, initialStatus, isCancelled);
    }

    /**
     * Perform direct account switch by injecting credentials into OS keyring and file stores,
     * restarting the Hub process for this window, and awaiting verification.
     */
    private async directSwitch(
        initialLs: LsEndpoint,
        opts: SwitchAccountOptions,
        uss: ReturnType<typeof getUSS>,
        ca: Buffer | undefined,
        isCancelled: () => boolean,
        token: vscode.CancellationToken,
    ): Promise<AuthSwitchResult> {
        const { email } = opts;
        const targetNorm = email.toLowerCase();

        // 1. Inject credentials into Keyring and fallback files
        await this.writeCredentialsToAllStores(opts);

        if (isCancelled() || token.isCancellationRequested) {
            return { confirmed: false, backend: 'agy-hub' };
        }

        // 2. Pre-sync USS and SQLite state DB
        if (uss) {
            try {
                await pushAuthStateToUSS(uss);
                await uss.OAuthPreferences.setOAuthTokenInfo({
                    accessToken: opts.accessToken,
                    refreshToken: opts.refreshToken,
                    expiryDateSeconds: opts.expiryTimestamp,
                    tokenType: 'Bearer',
                    isGcpTos: false,
                });
            } catch (e: any) {
                log.warn('directSwitch pre-sync USS warning:', e?.message);
            }
        }
        await writeAuthStatusToDb(opts.name, opts.email, opts.accessToken, this.context);
        await suppressTermsNotice(opts.email, this.context);

        // 3. Resolve and terminate Hub process so AntigravityServerManager auto-recovers it
        const pid = await this.resolveHubPid(initialLs.port);
        log.info(`directSwitch: resolved hub PID=${pid} for port=${initialLs.port}`);

        if (pid) {
            await this.terminateHubProcess(pid);
        } else {
            // Fallback: if PID cannot be found, try AuthLogout RPC
            await this.logoutHub(initialLs);
        }

        // 4. Poll for the restarted Hub to respond with the new account
        const pollStart = Date.now();
        await delay(600); // Give AntigravityServerManager ~600ms to detect exit and launch recovery

        while (Date.now() - pollStart < AgyHubBackend.DIRECT_POLL_TIMEOUT_MS) {
            if (isCancelled() || token.isCancellationRequested) {
                return { confirmed: false, backend: 'agy-hub' };
            }

            try {
                const freshEndpoints = await findLSEndpoints();
                for (const ep of freshEndpoints) {
                    try {
                        const status = await queryEndpointUserStatus(ep, ca);
                        const freshEmailNorm = status.email.toLowerCase();
                        if (freshEmailNorm === targetNorm && status.userStatus) {
                            log.info(`directSwitch: confirmed for ${email} on hub port=${ep.port}`);
                            await this.syncUssAndDb(uss, opts, status.userStatus);
                            return {
                                confirmed: true,
                                backend: 'agy-hub',
                                activeEmail: status.email,
                            };
                        }
                    } catch {
                        // Hub still binding/initializing
                    }
                }
            } catch { /* scan retry */ }

            await delay(AgyHubBackend.DIRECT_POLL_INTERVAL_MS);
        }

        log.warn(`directSwitch: hub did not confirm ${email} within ${AgyHubBackend.DIRECT_POLL_TIMEOUT_MS}ms`);
        return { confirmed: false, backend: 'agy-hub' };
    }

    /**
     * Fallback guided browser sign-in when direct switch is unavailable or fails.
     */
    private async guidedBrowserSwitch(
        initialLs: LsEndpoint,
        opts: SwitchAccountOptions,
        uss: ReturnType<typeof getUSS>,
        ca: Buffer | undefined,
        initialStatus: { userStatus: Buffer | null; email: string },
        isCancelled: () => boolean,
    ): Promise<AuthSwitchResult> {
        const { email } = opts;
        const targetNorm = email.toLowerCase();
        let ls = initialLs;
        const initialEmailNorm = initialStatus.email.toLowerCase();

        // Copy target email to clipboard so user can paste/select it in browser
        await vscode.env.clipboard.writeText(email);
        await suppressTermsNotice(email, this.context);

        return vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `NexusAG: Switching Antigravity Hub to ${email} (email copied — select account in browser)...`,
                cancellable: true,
            },
            async (_progress, token) => {
                await this.logoutHub(ls);

                if (isCancelled() || token.isCancellationRequested) {
                    return {
                        confirmed: false,
                        backend: 'agy-hub',
                        activeEmail: initialStatus.email,
                        guidedSignIn: true,
                    };
                }

                let loginSettled = false;
                let loginSucceeded = false;
                let postLoginChecks = 0;
                const loginSignal = new Promise<void>((resolve) => {
                    this.triggerHubLogin(ls)
                        .then((res) => {
                            loginSucceeded = true;
                            log.info(`Hub loginWithRedirect resolved: ${JSON.stringify(res ?? {})}`);
                        })
                        .catch((err: any) => {
                            log.warn(`Hub loginWithRedirect error: ${err?.message ?? err}`);
                        })
                        .finally(() => {
                            loginSettled = true;
                            resolve();
                        });
                });

                const pollStart = Date.now();
                while (Date.now() - pollStart < AgyHubBackend.LOGIN_MAX_WAIT_MS) {
                    if (isCancelled() || token.isCancellationRequested) {
                        return {
                            confirmed: false,
                            backend: 'agy-hub',
                            activeEmail: initialStatus.email,
                            guidedSignIn: true,
                        };
                    }

                    if (!loginSettled) {
                        await Promise.race([
                            delay(AgyHubBackend.LOGIN_POLL_INTERVAL_MS),
                            loginSignal,
                        ]);
                    } else {
                        await delay(400);
                        postLoginChecks++;
                    }

                    try {
                        const freshEndpoints = await findLSEndpoints();
                        if (freshEndpoints.length > 0) ls = freshEndpoints[0];

                        const status = await queryEndpointUserStatus(ls, ca);
                        const lsEmailNorm = status.email.toLowerCase();

                        if (!lsEmailNorm) continue;

                        if (lsEmailNorm === targetNorm && status.userStatus) {
                            log.info(`Hub switch confirmed for ${email}`);
                            await this.syncUssAndDb(uss, opts, status.userStatus);
                            return {
                                confirmed: true,
                                backend: 'agy-hub',
                                activeEmail: status.email,
                                guidedSignIn: true,
                            };
                        }

                        if (lsEmailNorm === initialEmailNorm && (!loginSucceeded || postLoginChecks < 4)) {
                            continue;
                        }

                        if (status.userStatus) {
                            log.warn(`Hub signed in as ${status.email} (expected ${email})`);
                            if (uss) {
                                await pushUserStatusToUSS(uss, status.userStatus).catch(() => {});
                                await pushAuthStateToUSS(uss);
                            }
                            vscode.window.showWarningMessage(
                                `Antigravity signed in as ${status.email} (expected ${email}).`,
                            );
                            return {
                                confirmed: false,
                                backend: 'agy-hub',
                                activeEmail: status.email,
                                guidedSignIn: true,
                            };
                        }
                    } catch (e: any) {
                        log.diag(`Hub login poll error: ${e?.message}`);
                    }
                }

                vscode.window.showWarningMessage(`Browser sign-in for ${email} timed out.`);
                return {
                    confirmed: false,
                    backend: 'agy-hub',
                    activeEmail: initialStatus.email,
                    guidedSignIn: true,
                };
            },
        );
    }

    /**
     * Write target account credentials to OS keyring (Windows Credential Manager / macOS Keychain / Linux Secret Service)
     * and fallback JSON files (`~/.gemini/gemini-oauth.json`, `~/.gemini/oauth_creds.json`).
     */
    private async writeCredentialsToAllStores(opts: SwitchAccountOptions): Promise<void> {
        const { email, accessToken, refreshToken, expiryTimestamp } = opts;
        const expiryIso = new Date(expiryTimestamp * 1000).toISOString();
        const expiresInSecs = Math.max(0, Math.floor(expiryTimestamp - Date.now() / 1000));
        const writerId = crypto.randomBytes(16).toString('base64url');

        const hubKeyringPayload = JSON.stringify({
            token: {
                access_token: accessToken,
                token_type: 'Bearer',
                refresh_token: refreshToken,
                expiry: expiryIso,
                expires_in: expiresInSecs,
            },
            auth_method: 'consumer',
            id_token_email: email,
            writer_id: writerId,
        });

        // 1. Write to OS Keyring
        try {
            if (process.platform === 'win32') {
                await this.writeWindowsKeyring('gemini:antigravity', 'antigravity', hubKeyringPayload);
                log.info('writeCredentialsToAllStores: Windows Credential Manager updated');
            } else if (process.platform === 'darwin') {
                const escaped = hubKeyringPayload.replace(/"/g, '\\"');
                await execAsync(
                    `security add-generic-password -a "antigravity" -s "gemini" -w "${escaped}" -U`,
                    { timeout: 5000 },
                );
                log.info('writeCredentialsToAllStores: macOS Keychain updated');
            } else {
                try {
                    await execAsync(
                        `echo -n '${hubKeyringPayload.replace(/'/g, "'\\''")}' | secret-tool store --label="Antigravity" service "gemini" username "antigravity"`,
                        { timeout: 5000 },
                    );
                    log.info('writeCredentialsToAllStores: Linux secret-tool updated');
                } catch {
                    log.diag('writeCredentialsToAllStores: Linux secret-tool not available, relying on file fallback');
                }
            }
        } catch (e: any) {
            log.warn('writeCredentialsToAllStores OS keyring write failed (falling back to files):', e?.message);
        }

        // 2. Write file fallback (~/.gemini/gemini-oauth.json & oauth_creds.json)
        try {
            const geminiDir = path.join(os.homedir(), '.gemini');
            await fs.promises.mkdir(geminiDir, { recursive: true });

            const geminiOauth = {
                email,
                updatedAt: new Date().toISOString(),
                projectId: 'aicode-consumers',
                userTier: 'free-tier',
            };

            const oauthCreds = {
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: 'Bearer',
                scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/userinfo.profile openid https://www.googleapis.com/auth/userinfo.email',
                id_token: '',
                expiry_date: expiryTimestamp * 1000,
            };

            await fs.promises.writeFile(
                path.join(geminiDir, 'gemini-oauth.json'),
                JSON.stringify(geminiOauth, null, 2),
                'utf8',
            );
            await fs.promises.writeFile(
                path.join(geminiDir, 'oauth_creds.json'),
                JSON.stringify(oauthCreds, null, 2),
                'utf8',
            );
            log.info('writeCredentialsToAllStores: fallback files written');
        } catch (e: any) {
            log.warn('writeCredentialsToAllStores file fallback write failed:', e?.message);
        }
    }

    /**
     * Write credential to Windows Credential Manager via advapi32.dll CredWriteW.
     */
    private async writeWindowsKeyring(target: string, userName: string, secret: string): Promise<boolean> {
        const base64Secret = Buffer.from(secret, 'utf8').toString('base64');
        const psScript = `
$code = @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public class CredWriter {
    [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern bool CredWrite([In] ref CREDENTIAL userCredential, [In] uint flags);

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public int Flags;
        public int Type;
        public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public int CredentialBlobSize;
        public IntPtr CredentialBlob;
        public int Persist;
        public int AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
    }

    public static bool Write(string target, string userName, string secret) {
        byte[] blob = Encoding.UTF8.GetBytes(secret);
        IntPtr blobPtr = Marshal.AllocHGlobal(blob.Length);
        Marshal.Copy(blob, 0, blobPtr, blob.Length);

        CREDENTIAL cred = new CREDENTIAL();
        cred.Type = 1; // GENERIC
        cred.TargetName = target;
        cred.UserName = userName;
        cred.CredentialBlobSize = blob.Length;
        cred.CredentialBlob = blobPtr;
        cred.Persist = 2; // LOCAL_MACHINE

        try {
            return CredWrite(ref cred, 0);
        } finally {
            Marshal.FreeHGlobal(blobPtr);
        }
    }
}
'@
Add-Type -TypeDefinition $code
$secret = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${base64Secret}'))
[CredWriter]::Write('${target}', '${userName}', $secret)
`;
        const b64Command = Buffer.from(psScript, 'utf16le').toString('base64');
        const { stdout } = await execAsync(
            `powershell -NoProfile -NonInteractive -EncodedCommand ${b64Command}`,
            { timeout: 5000 },
        );
        return stdout.trim() === 'True';
    }

    /**
     * Find the PID of the Hub process listening on the given port.
     */
    private async resolveHubPid(port: number): Promise<number | null> {
        if (process.platform === 'win32') {
            try {
                const { stdout } = await execAsync(
                    `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1"`,
                    { timeout: 3000 },
                );
                const pid = parseInt(stdout.trim(), 10);
                if (!isNaN(pid) && pid > 0) return pid;
            } catch { /* try fallback */ }

            try {
                const { stdout } = await execAsync(
                    `powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name LIKE '%agy%'\\" | Where-Object { $_.CommandLine -like '*--hub-port=${port}*' } | Select-Object -ExpandProperty ProcessId -First 1"`,
                    { timeout: 3000 },
                );
                const pid = parseInt(stdout.trim(), 10);
                if (!isNaN(pid) && pid > 0) return pid;
            } catch { /* ignore */ }
        } else {
            try {
                const { stdout } = await execAsync(`lsof -ti :${port}`, { timeout: 3000 });
                const pid = parseInt(stdout.trim().split('\n')[0], 10);
                if (!isNaN(pid) && pid > 0) return pid;
            } catch { /* try fuser */ }

            try {
                const { stdout } = await execAsync(`fuser ${port}/tcp 2>/dev/null`, { timeout: 3000 });
                const pid = parseInt(stdout.trim().split(/\s+/)[0], 10);
                if (!isNaN(pid) && pid > 0) return pid;
            } catch { /* ignore */ }
        }
        return null;
    }

    /**
     * Terminate the Hub process so AntigravityServerManager automatically auto-recovers it.
     */
    private async terminateHubProcess(pid: number): Promise<void> {
        try {
            if (process.platform === 'win32') {
                await execAsync(`taskkill /PID ${pid} /F`, { timeout: 3000 }).catch(() => {
                    try { process.kill(pid, 'SIGKILL'); } catch { /* ignore */ }
                });
            } else {
                try { process.kill(pid, 'SIGTERM'); } catch { /* ignore */ }
            }
            log.info(`Hub process ${pid} terminated for auto-recovery restart`);
        } catch (e: any) {
            log.warn(`terminateHubProcess ${pid} error: ${e?.message}`);
        }
    }

    /**
     * Clear the current session in `agy --hub` via the built-in `antigravity.internal.logout`
     * command, with direct ConnectRPC fallback (`LanguageServerService/AuthLogout`).
     */
    private async logoutHub(ls: LsEndpoint): Promise<void> {
        try {
            log.info('Calling antigravity.internal.logout...');
            await vscode.commands.executeCommand('antigravity.internal.logout');
            log.info('antigravity.internal.logout succeeded');
            return;
        } catch (e: any) {
            log.warn(`antigravity.internal.logout failed (${e?.message}), falling back to direct AuthLogout RPC`);
        }

        try {
            await callLsJson(
                { port: ls.port, csrfToken: ls.csrf, protocol: 'http' },
                'AuthLogout',
                {},
                5_000,
            );
            log.info('Direct AuthLogout RPC succeeded');
        } catch (e: any) {
            log.warn(`Direct AuthLogout RPC failed: ${e?.message}`);
        }
    }

    /**
     * Trigger `agy --hub`'s native OAuth browser login flow via `antigravity.internal.loginWithRedirect`,
     * with direct ConnectRPC fallback (`LanguageServerService/Login`).
     */
    private async triggerHubLogin(ls: LsEndpoint): Promise<unknown> {
        try {
            log.info('Calling antigravity.internal.loginWithRedirect...');
            return await vscode.commands.executeCommand('antigravity.internal.loginWithRedirect');
        } catch (e: any) {
            log.warn(`antigravity.internal.loginWithRedirect failed (${e?.message}), falling back to direct Login RPC`);
        }

        return callLsJson(
            { port: ls.port, csrfToken: ls.csrf, protocol: 'http' },
            'Login',
            {},
            AgyHubBackend.LOGIN_MAX_WAIT_MS,
        );
    }

    /**
     * Synchronize USS (`uss-oauth`, `uss-userStatus`, `uss-enterprisePreferences`) and
     * `state.vscdb` after `agy --hub` has confirmed the new account so that
     * `AntigravityAuthMainService` (Electron main process) and `agy --hub` stay in sync.
     */
    private async syncUssAndDb(
        uss: ReturnType<typeof getUSS>,
        opts: SwitchAccountOptions,
        userStatus: Buffer,
    ): Promise<void> {
        const { email, name, accessToken, refreshToken, expiryTimestamp } = opts;
        if (uss) {
            try {
                await pushAuthStateToUSS(uss);
                if (accessToken && refreshToken) {
                    await uss.OAuthPreferences.setOAuthTokenInfo({
                        accessToken,
                        refreshToken,
                        expiryDateSeconds: expiryTimestamp,
                        tokenType: 'Bearer',
                        isGcpTos: false,
                    });
                }
                await pushUserStatusToUSS(uss, userStatus);
            } catch (e: any) {
                log.warn('syncUssAndDb USS push failed (non-fatal):', e?.message);
            }
        }
        await executeAuthRefresh();
        await writeAuthStatusToDb(name, email, accessToken, this.context);
        await suppressTermsNotice(email, this.context);
    }
}
