import * as vscode from 'vscode';
import { GoogleAuthService } from './googleAuth';
import { SwitchAccountOptions } from '../types';
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
export declare class AccountSwitchService {
    private readonly authService;
    private renewalTimer;
    private activeRefreshToken;
    private activeEmail;
    private switchGeneration;
    /** Buffer before expiry to trigger refresh (10 minutes in seconds) */
    private static readonly RENEWAL_BUFFER_SECS;
    /** Minimum delay to prevent tight loops on clock skew (30 seconds) */
    private static readonly MIN_RENEWAL_DELAY_MS;
    /** Maximum safe setTimeout delay — Node.js caps at 2^31-1 ms (~24.8 days) */
    private static readonly MAX_TIMEOUT_MS;
    private static readonly LS_READY_MAX_WAIT_MS;
    private static readonly LS_READY_POLL_INTERVAL_MS;
    private static readonly POLL_MAX_WAIT_MS;
    private static readonly POLL_INTERVAL_MS;
    private static readonly POLL_INITIAL_DELAY_MS;
    /** How often to retry registerGdmUser during polling when email doesn't match */
    private static readonly REGISTER_RETRY_INTERVAL_MS;
    /** Settling delay after registerGdmUser — gives LS time to fetch profile from backend */
    private static readonly POST_REGISTER_SETTLE_MS;
    constructor(_context: vscode.ExtensionContext, authService: GoogleAuthService);
    /** Clean up the renewal timer on extension deactivation */
    dispose(): void;
    /** Returns the active refresh token in memory if known */
    getActiveRefreshToken(): string | null;
    switchAccount(opts: SwitchAccountOptions): Promise<{
        confirmed: boolean;
    }>;
    /**
     * Schedule next token refresh based on ACTUAL expiry.
     * Fires (expiryTimestamp - BUFFER) from now — much better than fixed interval.
     * After each renewal, re-schedules based on the new token's expiry (adaptive chain).
     */
    private scheduleTokenRenewal;
    /**
     * Execute a single renewal cycle:
     *   1. Refresh the access_token via Google OAuth2
     *   2. Push new token to USS (so main process picks it up)
     *   3. Call registerGdmUser on all LS (so LS gets fresh credentials)
     *   4. Re-schedule for the new token's expiry
     */
    private executeRenewal;
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
    private awaitLSReadiness;
    /**
     * Call RegisterGdmUser on provided LS endpoints.
     * Falls back to independent discovery if no endpoints are provided
     * (e.g., readiness gate timed out).
     */
    private callRegisterGdmUser;
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
    private pollRichUserStatus;
    /**
     * Background USS stabilization — pushes incremental UserStatus updates
     * (profile pic, growing data) AFTER email is already confirmed.
     * Detached from the main switch flow.
     */
    private stabilizeUSS;
    private fetchProfilePicUrl;
    /** Wrap raw UserStatus proto bytes in USS UpdateRequest and push via IPC */
    private pushUserStatusToUSS;
    /**
     * Push authStateWithContextSentinelKey to uss-oauth topic.
     * This sets Dwr._authState to "signedIn", which IMMEDIATELY hides the
     * blue "Log in ->" nudge button in the IDE title bar.
     */
    private pushAuthStateToUSS;
    /**
     * Build raw user status protobuf binary base64.
     */
    buildUserStatusProto(name: string, email: string): string;
    /**
     * Build rich initial UserStatus update so the IDE immediately sees
     * valid user info, Pro tier, and account identity before LS finishes its roundtrip.
     */
    private buildUserStatusUpdate;
    /**
     * Apply credentials to USS and DB before a restart/fix transition.
     * Pushes user status, auth state, DB row, and OAuth tokens to USS,
     * fires handleAuthRefresh, and lets USS socket commit the data.
     */
    applyAccountCredentials(opts: SwitchAccountOptions): Promise<void>;
    /** Write profile picture URL directly to IDE state database for title bar avatar */
    private writeProfileUrlToDb;
    /**
     * Write auth status to the IDE's state database.
     * Uses hex-encoded JSON as SQLite X'...' blob to prevent SQL injection.
     * Uses INSERT OR REPLACE to guarantee persistence even if the row didn't exist yet.
     */
    writeAuthStatusToDb(name: string, email: string, apiKey: string): Promise<boolean>;
    testApiAccess(): Promise<boolean>;
}
