/**
 * EmailResolver — resolves the active IDE account email.
 * Extracted from QuotaManager to follow Single Responsibility Principle.
 *
 * Strategy: USS API (in-memory) → state.vscdb fallback → empty string.
 */
export declare class EmailResolver {
    /** Read active IDE email from USS API or antigravityAuthStatus */
    getActiveEmail(): Promise<string>;
}
