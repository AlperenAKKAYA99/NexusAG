/**
 * Database Access Layer — SSOT for all state.vscdb interactions.
 * ═══════════════════════════════════════════════════════════════
 * ZERO vscode dependency — safe for both extension host AND
 * detached worker processes (ELECTRON_RUN_AS_NODE=1).
 *
 * Strategy: @vscode/sqlite3 native module (primary) → sqlite3 CLI (fallback)
 * The native module is bundled with AG IDE on ALL platforms (macOS, Linux, Windows).
 * CLI fallback exists for edge cases where the native binary isn't found.
 *
 * Consumers:
 * - titleResolver.ts    (read: trajectory summaries)
 * - emailResolver.ts    (read: auth status)
 * - conversationGuard.ts (read: trajectory index)
 * - conversationFix.ts  (read+write: index rebuild)
 * - accountSwitch.ts    (write: account switch)
 */
/**
 * Read a single value from state.vscdb by key.
 * Returns the raw string value or null if not found.
 */
export declare function dbGet(key: string): Promise<string | null>;
/**
 * Read raw buffer/string from a specific SQL query.
 * For advanced queries beyond simple key lookup.
 */
export declare function dbQuery(sql: string): Promise<string | null>;
/**
 * Execute a write SQL statement against state.vscdb.
 * Creates a timestamped backup before writing.
 * Fire-and-forget: errors are logged, never thrown.
 */
export declare function dbExec(sql: string): Promise<boolean>;
/**
 * Execute a write SQL with a pre-escaped value (for large base64 blobs).
 * Used by conversationFix which handles its own SQL construction.
 */
export declare function dbExecRaw(sql: string): Promise<boolean>;
/**
 * Check if any DB backend (native or CLI) is available.
 * Replaces the old `sqlite3 --version` CLI check.
 */
export declare function isDbAvailable(): boolean;
/**
 * Remove stale backups older than maxAgeMs (default: 7 days).
 * Call opportunistically — never throws.
 */
export declare function pruneOldBackups(maxAgeMs?: number): void;
