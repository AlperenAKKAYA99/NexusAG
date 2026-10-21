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
/** Path to Antigravity's local state SQLite DB (conversation index, active account, etc.) */
export declare const STATE_DB_PATH: string;
/** Directory containing conversation .pb protobuf files */
export declare const CONVERSATIONS_DIR: string;
/** Directory containing conversation brain data (transcripts, artifacts) */
export declare const BRAIN_DIR: string;
/** Ordered list of candidate cert paths for the local language server */
export declare const LS_CERT_PATHS: string[];
/** grep pattern to find the LS binary in `ps` output */
export declare const LS_PROCESS_GREP: string;
/**
 * Resolve and cache the @vscode/sqlite3 native module bundled with AG IDE.
 * Tries vscode.env.appRoot first (when called from extension host), then platform defaults.
 * Returns null if the module cannot be found.
 */
export declare function getSqlite3Module(appRoot?: string): any;
