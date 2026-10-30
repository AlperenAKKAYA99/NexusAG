/**
 * EmailResolver — resolves the active IDE account email.
 * Extracted from QuotaManager to follow Single Responsibility Principle.
 *
 * Strategy (Antigravity ≥ 2.27.0 + Legacy):
 *   1. Local Window Hub / LS `GetUserStatus` (per-window source of truth in ≥ 2.27)
 *   2. USS API `UserStatus.getUserStatus()` (in-memory fallback)
 *   3. `state.vscdb` `antigravityAuthStatus` (disk fallback)
 */
export declare class EmailResolver {
    /** Read active IDE email from the active window's Hub/LS, USS API, or antigravityAuthStatus */
    getActiveEmail(): Promise<string>;
}
