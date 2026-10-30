/**
 * AG Platform Paths — SSOT for Antigravity filesystem locations.
 * ═══════════════════════════════════════════════════════════════
 * ZERO vscode dependency — safe for both extension host AND
 * detached worker processes (ELECTRON_RUN_AS_NODE=1).
 *
 * All other modules should import paths from here, not re-define them.
 */
export declare const isMac: boolean;
export declare const isLinux: boolean;
export declare const isWindows: boolean;
/**
 * Returns true if a conversations directory has `.done` migration markers or
 * zero `.pb` files, indicating Antigravity ≥ 2.27 migrated away from it.
 */
export declare function isMigratedConversationsDir(dir: string): boolean;
/**
 * Returns true when Antigravity ≥ 2.27 Hub SQLite conversation storage is active
 * (`conversation_summaries.db` exists or conversations are stored as `.db` with no `.pb` files).
 */
export declare function isAgyHubStorage(convDir?: string): boolean;
/** Path to Antigravity's local state SQLite DB (conversation index, active account, etc.) */
export declare const STATE_DB_PATH: string;
/** Directory containing conversation files (.db in ≥ 2.27, .pb in < 2.27) */
export declare const CONVERSATIONS_DIR: string;
/** All existing conversation directories (new `antigravity` + legacy `antigravity-ide`) */
export declare const ALL_CONVERSATIONS_DIRS: string[];
/** Directory containing conversation brain data (transcripts, artifacts) */
export declare const BRAIN_DIR: string;
/** All existing brain directories (new `antigravity` + legacy `antigravity-ide`) */
export declare const ALL_BRAIN_DIRS: string[];
/** Ordered list of candidate cert paths for the local language server */
export declare const LS_CERT_PATHS: string[];
/**
 * grep pattern to find the LS binary in `ps` output.
 *
 * Antigravity ≥ 2.27.0 replaced the standalone `language_server_*` binary with
 * `agy.exe --hub`.  We search for the NEW binary first; legacy fallback is
 * handled separately in serverDiscovery.ts.
 */
export declare const LS_PROCESS_GREP = "agy";
/** Legacy process name for Antigravity < 2.27.0 fallback */
export declare const LS_PROCESS_GREP_LEGACY: string;
/**
 * Resolve and cache the @vscode/sqlite3 native module bundled with AG IDE.
 * Tries vscode.env.appRoot first (when called from extension host), then platform defaults.
 * Returns null if the module cannot be found.
 */
export declare function getSqlite3Module(appRoot?: string): any;
