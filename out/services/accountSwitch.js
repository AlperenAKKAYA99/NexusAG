"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountSwitchService = void 0;
const vscode = __importStar(require("vscode"));
const uss_1 = require("../utils/uss");
const protobuf_1 = require("../shared/protobuf");
const logger_1 = require("../utils/logger");
const db_1 = require("../shared/db");
const lsClient_1 = require("../utils/lsClient");
const constants_1 = require("../constants");
const log = (0, logger_1.createLogger)('AccountSwitch');
/**
 * AccountSwitchService — Programmatic IDE account switching (NO RELOAD)
 *
 * WHY HTTP calls are necessary (reverse-engineered from IDE source):
 *
 *   registerGdmUser (the call that makes LS fetch models + profile from backend)
 *   is ONLY called inside initializeAuthSession(), which runs ONCE during
 *   extension activation. Subsequent token changes (uss-oauth onDidChange)
 *   call handleAuthSessionChange(AuthenticationEvent) which does NOT call
 *   registerGdmUser. Therefore we MUST call it ourselves via HTTP.
 *
 * Token Renewal Strategy (Proactive Token Renewal):
 *   The LS binary caches its session token and does NOT auto-refresh on its own
 *   after our programmatic switch. IDE's main-process 5-min loop refreshes USS
 *   via google-auth-library, but the LS doesn't pick up USS changes.
 *
 *   Solution: schedule a proactive refresh 10 minutes before token expiry.
 *   Each cycle: refreshAccessToken → update USS → registerGdmUser on all LS.
 *   This is the production-standard "Proactive Token Renewal" pattern used by
 *   AWS SDK, Azure SDK, and google-auth-library's eagerRefreshThreshold.
 *
 * Flow:
 *   1. pushSerializedUpdateIPC → instant name/email in USS
 *   2. setOAuthTokenInfo       → uss-oauth topic update (minimal internal handling)
 *   3. handleAuthRefresh       → createSession → _sessionChangeEmitter (profile UI)
 *   4. HTTP registerGdmUser    → LS fetches models + profile from backend
 *   5. HTTP GetUserStatus      → read rich UserStatus from LS memory
 *   6. pushSerializedUpdateIPC → push rich UserStatus to USS → instant model selector + avatar
 *   7. scheduleTokenRenewal    → proactive renewal before expiry (keeps LS alive)
 */
class AccountSwitchService {
    authService;
    // Proactive Token Renewal state
    renewalTimer = null;
    activeRefreshToken = null;
    activeEmail = null;
    // Race condition guard: monotonically increasing counter per switch call.
    // Polling loops check this to abort if a newer switch has started.
    switchGeneration = 0;
    /** Buffer before expiry to trigger refresh (10 minutes in seconds) */
    static RENEWAL_BUFFER_SECS = 10 * 60;
    /** Minimum delay to prevent tight loops on clock skew (30 seconds) */
    static MIN_RENEWAL_DELAY_MS = 30_000;
    /** Maximum safe setTimeout delay — Node.js caps at 2^31-1 ms (~24.8 days) */
    static MAX_TIMEOUT_MS = 2_147_483_647;
    // ── LS Readiness Gate timing ──
    static LS_READY_MAX_WAIT_MS = 15_000;
    static LS_READY_POLL_INTERVAL_MS = 500;
    // ── Email Confirmation Polling timing ──
    static POLL_MAX_WAIT_MS = 30_000;
    static POLL_INTERVAL_MS = 1_000;
    static POLL_INITIAL_DELAY_MS = 500;
    /** How often to retry registerGdmUser during polling when email doesn't match */
    static REGISTER_RETRY_INTERVAL_MS = 5_000;
    /** Settling delay after registerGdmUser — gives LS time to fetch profile from backend */
    static POST_REGISTER_SETTLE_MS = 2_000;
    constructor(_context, authService) {
        this.authService = authService;
    }
    /** Clean up the renewal timer on extension deactivation */
    dispose() {
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
    getActiveRefreshToken() {
        return this.activeRefreshToken;
    }
    async switchAccount(opts) {
        const { email, name, accessToken, refreshToken, expiryTimestamp } = opts;
        // Bump generation FIRST — aborts any in-flight polling from previous switch
        this.switchGeneration++;
        const generation = this.switchGeneration;
        try {
            const uss = (0, uss_1.getUSS)();
            if (!uss) {
                vscode.window.showErrorMessage('antigravityUnifiedStateSync API not available.');
                return { confirmed: false };
            }
            // 1. Instant name/email/tier display via USS
            await uss.pushSerializedUpdateIPC(this.buildUserStatusUpdate(name, email));
            // 2. Dual-Key Sync: Push signedIn auth state to uss-oauth IMMEDIATELY.
            //    This sets Dwr._authState to "signedIn", which directly suppresses the
            //    blue "Log in ->" nudge button in the IDE title bar.
            await this.pushAuthStateToUSS(uss);
            // 3. Legacy auth status JSON (safe — no SQL injection, async to not block)
            await this.writeAuthStatusToDb(name, email, accessToken);
            // 4. Set OAuth token — triggers internal uss-oauth subscriber
            //    CRITICAL: use the REAL expiry timestamp, not a hardcoded +3600.
            await uss.OAuthPreferences.setOAuthTokenInfo({
                accessToken,
                refreshToken,
                expiryDateSeconds: expiryTimestamp,
                tokenType: 'Bearer',
                isGcpTos: false,
            });
            // 5. IPC Settling delay — give USS process socket time to commit the token
            //    and userStatus into memory BEFORE handleAuthRefresh fires.
            //    Without this, ExternalAuthProvider.createSession() reads empty userStatus
            //    and throws "No auth token found", causing the session to drop.
            await delay(350);
            // 6. handleAuthRefresh — fires IDE's createSession + sessionChangeEmitter.
            //    This propagates the new token context to LS via USS IPC notification,
            //    ensuring LS is aware of the new session BEFORE we call registerGdmUser.
            try {
                await vscode.commands.executeCommand('antigravity.handleAuthRefresh');
                log.info('handleAuthRefresh completed — session context propagated to LS');
            }
            catch (e) {
                log.warn('handleAuthRefresh failed (non-fatal):', e?.message);
            }
            // 6b. Re-assert signedIn state in uss-oauth after handleAuthRefresh
            //     (in case handleAuthRefresh reset the auth state)
            await this.pushAuthStateToUSS(uss);
            // 7. Readiness Gate — wait for LS to confirm its USS IPC reconnect.
            //    Returns discovered endpoints so downstream functions don't need
            //    to re-discover (Gate-Once-Pass-Down pattern).
            const { ready, endpoints } = await this.awaitLSReadiness();
            // 8. registerGdmUser — uses gate-provided endpoints (no independent discovery)
            await this.callRegisterGdmUser(endpoints);
            // 8b. Settling delay — give LS time to fetch profile from Google backend.
            await delay(AccountSwitchService.POST_REGISTER_SETTLE_MS);
            // 8c. Second registerGdmUser with freshly discovered endpoints.
            const freshEndpoints = await (0, lsClient_1.findLSEndpoints)();
            if (freshEndpoints.length > 0) {
                await this.callRegisterGdmUser(freshEndpoints);
                log.info(`registerGdmUser retry: called on ${freshEndpoints.length} fresh endpoint(s)`);
            }
            // 9. Await email confirmation from LS (with periodic registerGdmUser retry)
            const result = await this.pollRichUserStatus(uss, generation, email, freshEndpoints.length > 0 ? freshEndpoints : endpoints);
            if (!result.confirmed) {
                log.warn('Email confirmation timed out — LS may not have adopted the new email yet');
            }
            // 10. Schedule proactive token renewal ONLY for confirmed switches.
            if (result.confirmed) {
                this.scheduleTokenRenewal(refreshToken, expiryTimestamp, email);
            }
            else {
                log.info('Token renewal NOT scheduled (switch unconfirmed)');
            }
            // 11. Toast reflects actual state + provides optional one-click Reload Window
            //     to immediately clean stale sessions from the top Accounts menu if desired.
            if (result.confirmed) {
                vscode.window.showInformationMessage(`✅ Switched to ${email}`, 'Reload Window')
                    .then(sel => {
                    if (sel === 'Reload Window') {
                        vscode.commands.executeCommand('workbench.action.reloadWindow');
                    }
                });
            }
            else {
                vscode.window.showWarningMessage(`⚠️ Switching to ${email} — model update may take a moment`, 'Reload Window')
                    .then(sel => {
                    if (sel === 'Reload Window') {
                        vscode.commands.executeCommand('workbench.action.reloadWindow');
                    }
                });
            }
            return result;
        }
        catch (err) {
            vscode.window.showErrorMessage(`Failed to switch account: ${err?.message || err}`);
            log.error('Switch failed:', err);
            return { confirmed: false };
        }
    }
    // ==================== Proactive Token Renewal ====================
    /**
     * Schedule next token refresh based on ACTUAL expiry.
     * Fires (expiryTimestamp - BUFFER) from now — much better than fixed interval.
     * After each renewal, re-schedules based on the new token's expiry (adaptive chain).
     */
    scheduleTokenRenewal(refreshToken, expiryTimestamp, email) {
        if (this.renewalTimer) {
            clearTimeout(this.renewalTimer);
            this.renewalTimer = null;
        }
        this.activeRefreshToken = refreshToken;
        this.activeEmail = email;
        const nowSecs = Math.floor(Date.now() / 1000);
        const renewAtSecs = expiryTimestamp - AccountSwitchService.RENEWAL_BUFFER_SECS;
        const delayMs = Math.min(Math.max((renewAtSecs - nowSecs) * 1000, AccountSwitchService.MIN_RENEWAL_DELAY_MS), AccountSwitchService.MAX_TIMEOUT_MS);
        const delayMins = Math.round(delayMs / 60_000);
        log.info(`Token renewal scheduled in ${delayMins}m for ${email} (expiry in ${Math.round((expiryTimestamp - nowSecs) / 60)}m)`);
        this.renewalTimer = setTimeout(() => this.executeRenewal(), delayMs);
    }
    /**
     * Execute a single renewal cycle:
     *   1. Refresh the access_token via Google OAuth2
     *   2. Push new token to USS (so main process picks it up)
     *   3. Call registerGdmUser on all LS (so LS gets fresh credentials)
     *   4. Re-schedule for the new token's expiry
     */
    async executeRenewal() {
        if (!this.activeRefreshToken || !this.activeEmail)
            return;
        try {
            const refreshed = await this.authService.refreshAccessToken(this.activeRefreshToken);
            const newExpiry = Math.floor(Date.now() / 1000) + (refreshed.expires_in || 3600);
            // Capture rotated refresh_token if Google returns one
            if (refreshed.refresh_token) {
                this.activeRefreshToken = refreshed.refresh_token;
            }
            const uss = (0, uss_1.getUSS)();
            if (uss) {
                await uss.OAuthPreferences.setOAuthTokenInfo({
                    accessToken: refreshed.access_token,
                    refreshToken: this.activeRefreshToken,
                    expiryDateSeconds: newExpiry,
                    tokenType: 'Bearer',
                    isGcpTos: false,
                });
            }
            await this.callRegisterGdmUser(await (0, lsClient_1.findLSEndpoints)());
            log.info(`✅ Token renewed for ${this.activeEmail}, next in ~${Math.round((refreshed.expires_in || 3600) / 60) - 10}m`);
            this.scheduleTokenRenewal(this.activeRefreshToken, newExpiry, this.activeEmail);
        }
        catch (err) {
            log.error(`❌ Token renewal failed for ${this.activeEmail}:`, err?.message || err);
            // Retry in 2 minutes on transient failure
            this.renewalTimer = setTimeout(() => this.executeRenewal(), constants_1.RENEWAL_RETRY_DELAY_MS);
        }
    }
    // ==================== LS Readiness Gate ====================
    /**
     * Readiness Gate — confirms LS has a working USS IPC channel.
     *
     * After IDE reload, the LS process reconnects to the new extension_server_port
     * asynchronously. Until this reconnect completes, registerGdmUser calls are
     * accepted (HTTP 200) but INEFFECTIVE — LS can't fetch the new token from USS,
     * so it silently uses stale credentials.
     *
     * This gate polls GetUserStatus; a non-empty response with an email field
     * proves the IPC channel is live. This is the Kubernetes Readiness Probe
     * pattern — don't send traffic until the target is ready.
     *
     * Gate-Once-Pass-Down: returns discovered endpoints so downstream functions
     * (registerGdmUser, pollRichUserStatus) don't need independent discovery.
     * Endpoint discovery is INSIDE the retry loop — handles LS temporarily
     * going down after handleAuthRefresh.
     */
    async awaitLSReadiness(maxWaitMs = AccountSwitchService.LS_READY_MAX_WAIT_MS, intervalMs = AccountSwitchService.LS_READY_POLL_INTERVAL_MS) {
        const ca = (0, lsClient_1.loadLSCert)();
        const start = Date.now();
        while (Date.now() - start < maxWaitMs) {
            const endpoints = await (0, lsClient_1.findLSEndpoints)();
            if (endpoints.length === 0) {
                log.info(`LS readiness gate: no endpoints yet (${Date.now() - start}ms), retrying...`);
                await delay(intervalMs);
                continue;
            }
            const ls = endpoints[0];
            try {
                const body = await (0, lsClient_1.callLSEndpoint)(ls, `${constants_1.LS_SERVICE_PATH}/GetUserStatus`, ca);
                const userStatus = body ? (0, protobuf_1.extractField)(body, 1) : null;
                if (!userStatus || userStatus.length <= 5) {
                    await delay(intervalMs);
                    continue;
                }
                const email = (0, protobuf_1.extractStringField)(userStatus, 7);
                if (!email) {
                    await delay(intervalMs);
                    continue;
                }
                log.info(`LS readiness gate: READY (email=${email}, ${Date.now() - start}ms, ${endpoints.length} LS)`);
                return { ready: true, endpoints };
            }
            catch (e) {
                log.info(`LS readiness gate: probe failed (${e?.message}), waiting...`);
            }
            await delay(intervalMs);
        }
        log.warn(`LS readiness gate: TIMEOUT after ${maxWaitMs}ms — proceeding best-effort`);
        return { ready: false, endpoints: [] };
    }
    // ==================== LS HTTP Communication ====================
    /**
     * Call RegisterGdmUser on provided LS endpoints.
     * Falls back to independent discovery if no endpoints are provided
     * (e.g., readiness gate timed out).
     */
    async callRegisterGdmUser(lsEndpoints) {
        let endpoints = lsEndpoints;
        if (endpoints.length === 0) {
            log.warn('registerGdmUser: no endpoints provided — trying independent discovery');
            endpoints = await (0, lsClient_1.findLSEndpoints)();
            if (endpoints.length === 0) {
                log.warn('registerGdmUser: independent discovery also returned empty');
                return;
            }
        }
        const ca = (0, lsClient_1.loadLSCert)();
        const results = await Promise.allSettled(endpoints.map(ls => (0, lsClient_1.callLSEndpoint)(ls, `${constants_1.LS_SERVICE_PATH}/RegisterGdmUser`, ca)));
        results.forEach((r, i) => {
            const ls = endpoints[i];
            log.info(`registerGdmUser on port=${ls.port}: ${r.status === 'fulfilled' ? 'OK' : r.reason}`);
        });
    }
    /**
     * Adaptive poll: call GetUserStatus every INTERVAL, push to USS whenever
     * new data arrives (response grows), stop when email matches target AND
     * 2 consecutive stable reads, or MAX_WAIT is reached.
     *
     * When the target email is detected in LS response, fires onSwitchSettled
     * so quotaManager can trigger a refresh with real LS data.
     *
     * @param generation - Switch generation counter. If a newer switch starts,
     *   this.switchGeneration will increment and this loop will abort.
     * @param targetEmail - Expected email after switch. Used for early exit.
     */
    /**
     * @param initialEndpoints - Endpoints from awaitLSReadiness gate.
     *   Falls back to independent discovery if these go stale (CSRF rotation).
     */
    async pollRichUserStatus(uss, generation, targetEmail, initialEndpoints, maxWaitMs = AccountSwitchService.POLL_MAX_WAIT_MS, intervalMs = AccountSwitchService.POLL_INTERVAL_MS) {
        let lsProcesses = initialEndpoints.length > 0 ? initialEndpoints : await (0, lsClient_1.findLSEndpoints)();
        if (lsProcesses.length === 0)
            return { confirmed: false };
        const ca = (0, lsClient_1.loadLSCert)();
        let ls = lsProcesses[0];
        let emailMatched = false;
        const targetNorm = targetEmail.toLowerCase();
        const start = Date.now();
        let pollCount = 0;
        let lastRegisterRetry = Date.now();
        await delay(AccountSwitchService.POLL_INITIAL_DELAY_MS);
        while (Date.now() - start < maxWaitMs) {
            if (generation !== this.switchGeneration) {
                log.info('Polling aborted — newer switch detected');
                return { confirmed: false };
            }
            // ── Periodic registerGdmUser retry — LS may need multiple kicks ──
            // If email hasn't matched and enough time has passed, retry registration
            // with freshly discovered endpoints (handles CSRF rotation too).
            if (!emailMatched && Date.now() - lastRegisterRetry > AccountSwitchService.REGISTER_RETRY_INTERVAL_MS) {
                log.info('Poll: retrying registerGdmUser (LS email still stale)');
                const retryEndpoints = await (0, lsClient_1.findLSEndpoints)();
                if (retryEndpoints.length > 0) {
                    await this.callRegisterGdmUser(retryEndpoints);
                    ls = retryEndpoints[0]; // Use freshest CSRF token
                }
                // Also re-fire handleAuthRefresh to re-propagate session context
                try {
                    await vscode.commands.executeCommand('antigravity.handleAuthRefresh');
                }
                catch { /* non-fatal */ }
                lastRegisterRetry = Date.now();
            }
            pollCount++;
            try {
                const body = await (0, lsClient_1.callLSEndpoint)(ls, `${constants_1.LS_SERVICE_PATH}/GetUserStatus`, ca);
                const userStatus = body ? (0, protobuf_1.extractField)(body, 1) : null;
                // ── Log poll progress (every 5th iteration to reduce noise) ──
                const elapsed = Date.now() - start;
                const lsEmail = userStatus ? (0, protobuf_1.extractStringField)(userStatus, 7) : '';
                if (pollCount <= 3 || pollCount % 5 === 0) {
                    log.info(`poll#${pollCount} @${elapsed}ms: email=${lsEmail || '(empty)'} target=${targetEmail}`);
                }
                // Guard: skip if no useful status or already matched
                if (!userStatus || userStatus.length <= 5 || emailMatched) {
                    await delay(intervalMs);
                    continue;
                }
                if (!lsEmail || lsEmail.toLowerCase() !== targetNorm) {
                    await delay(intervalMs);
                    continue;
                }
                emailMatched = true;
                log.info(`EMAIL_MATCH @${elapsed}ms poll#${pollCount}: statusLen=${userStatus.length}B — pushing to USS`);
                await this.pushUserStatusToUSS(uss, userStatus);
                await this.pushAuthStateToUSS(uss);
                await vscode.commands.executeCommand('antigravity.handleAuthRefresh');
                // Continue USS stabilization in background (profile pic, data growth)
                this.stabilizeUSS(uss, ls, ca, generation, userStatus.length, intervalMs, maxWaitMs - (Date.now() - start))
                    .catch(err => log.warn('USS stabilization error:', err?.message));
                return { confirmed: true };
            }
            catch (e) {
                const msg = e?.message || '';
                log.info(`poll#${pollCount} ERROR: ${msg}`);
                // CSRF token regenerated after registerGdmUser — re-discover endpoints
                if (msg.includes('401') || msg.includes('CSRF') || msg.includes('unauthenticated')) {
                    log.info('Poll: CSRF invalid, re-discovering LS endpoints');
                    lsProcesses = await (0, lsClient_1.findLSEndpoints)();
                    if (lsProcesses.length > 0)
                        ls = lsProcesses[0];
                }
                else {
                    log.warn('UserStatus poll iteration failed:', msg);
                }
            }
            await delay(intervalMs);
        }
        log.info(`Polling timed out after ${maxWaitMs}ms, ${pollCount} polls (emailMatched=${emailMatched})`);
        return { confirmed: emailMatched };
    }
    /**
     * Background USS stabilization — pushes incremental UserStatus updates
     * (profile pic, growing data) AFTER email is already confirmed.
     * Detached from the main switch flow.
     */
    async stabilizeUSS(uss, ls, ca, generation, initialSize, intervalMs, remainingMs) {
        let lastSize = initialSize;
        let stableCount = 0;
        const start = Date.now();
        while (Date.now() - start < remainingMs) {
            if (generation !== this.switchGeneration)
                return;
            await delay(intervalMs);
            try {
                const body = await (0, lsClient_1.callLSEndpoint)(ls, `${constants_1.LS_SERVICE_PATH}/GetUserStatus`, ca);
                let userStatus = body ? (0, protobuf_1.extractField)(body, 1) : null;
                if (!userStatus || userStatus.length <= 5)
                    continue;
                // Append profile picture URL if available
                const profilePicUrl = await this.fetchProfilePicUrl(ls, ca);
                if (profilePicUrl) {
                    userStatus = Buffer.concat([userStatus, (0, protobuf_1.encodeString)(38, profilePicUrl)]);
                    this.writeProfileUrlToDb(profilePicUrl);
                }
                if (userStatus.length <= lastSize) {
                    stableCount++;
                    if (stableCount >= 2) {
                        log.info(`USS stabilized at ${lastSize}B`);
                        return;
                    }
                    continue;
                }
                await this.pushUserStatusToUSS(uss, userStatus);
                await vscode.commands.executeCommand('antigravity.handleAuthRefresh');
                log.info(`USS stabilize: grew ${lastSize} → ${userStatus.length}B`);
                lastSize = userStatus.length;
                stableCount = 0;
            }
            catch (e) {
                log.warn('USS stabilize iteration failed:', e?.message);
            }
        }
    }
    async fetchProfilePicUrl(ls, ca) {
        try {
            const body = await (0, lsClient_1.callLSEndpoint)(ls, `${constants_1.LS_SERVICE_PATH}/GetProfileData`, ca);
            const url = body ? (0, protobuf_1.extractStringField)(body, 1) : '';
            return url.length > 10 ? url : '';
        }
        catch { /* expected: profile endpoint may not be available */
            return '';
        }
    }
    // ==================== USS IPC ====================
    /** Wrap raw UserStatus proto bytes in USS UpdateRequest and push via IPC */
    async pushUserStatusToUSS(uss, userStatus) {
        const row = (0, protobuf_1.encodeString)(1, userStatus.toString('base64'));
        const update = Buffer.concat([
            (0, protobuf_1.encodeString)(1, 'userStatusSentinelKey'),
            (0, protobuf_1.encodeMessage)(2, row),
        ]);
        const req = Buffer.concat([
            (0, protobuf_1.encodeString)(1, 'uss-userStatus'),
            (0, protobuf_1.encodeMessage)(5, update),
        ]);
        await uss.pushSerializedUpdateIPC(req.toString('base64'));
    }
    /**
     * Push authStateWithContextSentinelKey to uss-oauth topic.
     * This sets Dwr._authState to "signedIn", which IMMEDIATELY hides the
     * blue "Log in ->" nudge button in the IDE title bar.
     */
    async pushAuthStateToUSS(uss) {
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
            const row = (0, protobuf_1.encodeString)(1, authStateJson);
            const update = Buffer.concat([
                (0, protobuf_1.encodeString)(1, 'authStateWithContextSentinelKey'),
                (0, protobuf_1.encodeMessage)(2, row),
            ]);
            const req = Buffer.concat([
                (0, protobuf_1.encodeString)(1, 'uss-oauth'),
                (0, protobuf_1.encodeMessage)(5, update),
            ]);
            await uss.pushSerializedUpdateIPC(req.toString('base64'));
            log.info('pushAuthStateToUSS: set authStateWithContext to signedIn');
        }
        catch (e) {
            log.warn('pushAuthStateToUSS failed (non-fatal):', e?.message);
        }
    }
    /**
     * Build raw user status protobuf binary base64.
     */
    buildUserStatusProto(name, email) {
        const proto = Buffer.concat([
            (0, protobuf_1.encodeVarintField)(2, 1),
            (0, protobuf_1.encodeString)(3, name),
            (0, protobuf_1.encodeString)(7, email),
            (0, protobuf_1.encodeString)(6, 'g1-pro-tier'),
        ]);
        return proto.toString('base64');
    }
    /**
     * Build rich initial UserStatus update so the IDE immediately sees
     * valid user info, Pro tier, and account identity before LS finishes its roundtrip.
     */
    buildUserStatusUpdate(name, email) {
        const protoB64 = this.buildUserStatusProto(name, email);
        const row = (0, protobuf_1.encodeString)(1, protoB64);
        const update = Buffer.concat([(0, protobuf_1.encodeString)(1, 'userStatusSentinelKey'), (0, protobuf_1.encodeMessage)(2, row)]);
        return Buffer.concat([(0, protobuf_1.encodeString)(1, 'uss-userStatus'), (0, protobuf_1.encodeMessage)(5, update)]).toString('base64');
    }
    /**
     * Apply credentials to USS and DB before a restart/fix transition.
     * Pushes user status, auth state, DB row, and OAuth tokens to USS,
     * fires handleAuthRefresh, and lets USS socket commit the data.
     */
    async applyAccountCredentials(opts) {
        const { email, name, accessToken, refreshToken, expiryTimestamp } = opts;
        const uss = (0, uss_1.getUSS)();
        if (!uss) {
            vscode.window.showErrorMessage('antigravityUnifiedStateSync API not available.');
            return;
        }
        // 1. Instant name/email/tier display via USS
        await uss.pushSerializedUpdateIPC(this.buildUserStatusUpdate(name, email));
        // 2. Dual-Key Sync: Push signedIn auth state to uss-oauth IMMEDIATELY
        await this.pushAuthStateToUSS(uss);
        // 3. Write auth status JSON to DB (INSERT OR REPLACE)
        await this.writeAuthStatusToDb(name, email, accessToken);
        // 4. Set OAuth token — triggers internal uss-oauth subscriber
        await uss.OAuthPreferences.setOAuthTokenInfo({
            accessToken,
            refreshToken,
            expiryDateSeconds: expiryTimestamp,
            tokenType: 'Bearer',
            isGcpTos: false,
        });
        // 5. IPC Settling delay — give USS process socket time to commit the token
        await delay(350);
        // 6. handleAuthRefresh — propagates to IDE session
        try {
            await vscode.commands.executeCommand('antigravity.handleAuthRefresh');
            log.info('handleAuthRefresh completed — session context propagated');
        }
        catch (e) {
            log.warn('handleAuthRefresh failed (non-fatal):', e?.message);
        }
        // 6b. Re-assert signedIn state in uss-oauth after handleAuthRefresh
        await this.pushAuthStateToUSS(uss);
        await delay(200);
    }
    /** Write profile picture URL directly to IDE state database for title bar avatar */
    writeProfileUrlToDb(url) {
        if (!url || url.length < 10)
            return;
        const hex = Buffer.from(url, 'utf-8').toString('hex');
        const sql = `INSERT OR REPLACE INTO ItemTable (key, value) VALUES ('antigravity.profileUrl', CAST(X'${hex}' AS TEXT));`;
        (0, db_1.dbExec)(sql).catch(err => log.warn('Profile URL DB write failed:', err?.message));
    }
    // ==================== Legacy ====================
    /**
     * Write auth status to the IDE's state database.
     * Uses hex-encoded JSON as SQLite X'...' blob to prevent SQL injection.
     * Uses INSERT OR REPLACE to guarantee persistence even if the row didn't exist yet.
     */
    async writeAuthStatusToDb(name, email, apiKey) {
        const proto = Buffer.concat([(0, protobuf_1.encodeVarintField)(2, 1), (0, protobuf_1.encodeString)(3, name), (0, protobuf_1.encodeString)(7, email)]);
        const json = JSON.stringify({ name, apiKey, email, userStatusProtoBinaryBase64: proto.toString('base64') });
        const hexValue = Buffer.from(json, 'utf-8').toString('hex');
        const sql = `INSERT OR REPLACE INTO ItemTable (key, value) VALUES ('antigravityAuthStatus', CAST(X'${hexValue}' AS TEXT));`;
        return (0, db_1.dbExec)(sql).catch(err => {
            log.warn('Auth status DB write failed:', err?.message);
            return false;
        });
    }
    async testApiAccess() {
        try {
            const uss = (0, uss_1.getUSS)();
            if (!uss)
                return false;
            await uss.OAuthPreferences.getOAuthTokenInfo();
            return true;
        }
        catch { /* expected: process scan may fail during LS restart */
            return false;
        }
    }
}
exports.AccountSwitchService = AccountSwitchService;
// ==================== Standalone Helpers ====================
// These are pure functions / stateless utilities extracted from the class
// to reduce class size and improve testability.
function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}
// findActiveLanguageServers, loadLSCert, callLSEndpoint → moved to src/utils/lsClient.ts
//# sourceMappingURL=accountSwitch.js.map