"use strict";
/**
 * AG Platform Paths — SSOT for Antigravity filesystem locations.
 * ═══════════════════════════════════════════════════════════════
 * ZERO vscode dependency — safe for both extension host AND
 * detached worker processes (ELECTRON_RUN_AS_NODE=1).
 *
 * All other modules should import paths from here, not re-define them.
 */
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
exports.LS_PROCESS_GREP = exports.LS_CERT_PATHS = exports.BRAIN_DIR = exports.CONVERSATIONS_DIR = exports.STATE_DB_PATH = exports.isWindows = exports.isLinux = exports.isMac = void 0;
exports.getSqlite3Module = getSqlite3Module;
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
// ─── Platform Flags ──────────────────────────────────────────────────
exports.isMac = process.platform === 'darwin';
exports.isLinux = process.platform === 'linux';
exports.isWindows = process.platform === 'win32';
function findFirstExisting(...candidates) {
    for (const c of candidates) {
        if (c && fs.existsSync(c))
            return c;
    }
    return candidates[0] || '';
}
// ─── Antigravity Application Paths ───────────────────────────────────
/** Path to Antigravity's local state SQLite DB (conversation index, active account, etc.) */
exports.STATE_DB_PATH = exports.isMac
    ? findFirstExisting(path.join(os.homedir(), 'Library', 'Application Support', 'Antigravity IDE', 'User', 'globalStorage', 'state.vscdb'), path.join(os.homedir(), 'Library', 'Application Support', 'Antigravity', 'User', 'globalStorage', 'state.vscdb'))
    : exports.isLinux
        ? findFirstExisting(path.join(os.homedir(), '.config', 'Antigravity IDE', 'User', 'globalStorage', 'state.vscdb'), path.join(os.homedir(), '.config', 'Antigravity', 'User', 'globalStorage', 'state.vscdb'))
        : exports.isWindows
            ? findFirstExisting(path.join(process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'), 'Antigravity IDE', 'User', 'globalStorage', 'state.vscdb'), path.join(process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'), 'Antigravity', 'User', 'globalStorage', 'state.vscdb'))
            : '';
/** Directory containing conversation .pb protobuf files */
exports.CONVERSATIONS_DIR = findFirstExisting(path.join(os.homedir(), '.gemini', 'antigravity-ide', 'conversations'), path.join(os.homedir(), '.gemini', 'antigravity', 'conversations'));
/** Directory containing conversation brain data (transcripts, artifacts) */
exports.BRAIN_DIR = findFirstExisting(path.join(os.homedir(), '.gemini', 'antigravity-ide', 'brain'), path.join(os.homedir(), '.gemini', 'antigravity', 'brain'));
/** Ordered list of candidate cert paths for the local language server */
exports.LS_CERT_PATHS = exports.isMac
    ? [
        '/Applications/Antigravity IDE.app/Contents/Resources/app/extensions/antigravity/dist/languageServer/cert.pem',
        '/Applications/Antigravity.app/Contents/Resources/app/extensions/antigravity/dist/languageServer/cert.pem',
    ]
    : exports.isLinux
        ? [
            '/opt/antigravity-ide/resources/app/extensions/antigravity/dist/languageServer/cert.pem',
            '/opt/antigravity/resources/app/extensions/antigravity/dist/languageServer/cert.pem',
            path.join(os.homedir(), '.local', 'share', 'antigravity', 'resources', 'app', 'extensions', 'antigravity', 'dist', 'languageServer', 'cert.pem'),
        ]
        : exports.isWindows
            ? [
                path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local'), 'Programs', 'Antigravity IDE', 'resources', 'app', 'extensions', 'antigravity', 'dist', 'languageServer', 'cert.pem'),
                path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local'), 'Programs', 'Antigravity', 'resources', 'app', 'extensions', 'antigravity', 'dist', 'languageServer', 'cert.pem'),
            ]
            : [];
/** grep pattern to find the LS binary in `ps` output */
exports.LS_PROCESS_GREP = exports.isMac
    ? 'language_server_macos'
    : exports.isLinux
        ? 'language_server_linux'
        : exports.isWindows
            ? 'language_server_win'
            : 'language_server';
// ─── @vscode/sqlite3 Native Module Resolution ───────────────────────
/**
 * Candidate app root paths for locating @vscode/sqlite3.
 * Tried in order: vscode.env.appRoot (injected at runtime), then platform defaults.
 */
const AG_APP_ROOT_CANDIDATES = exports.isMac
    ? [
        '/Applications/Antigravity IDE.app/Contents/Resources/app',
        '/Applications/Antigravity.app/Contents/Resources/app',
    ]
    : exports.isLinux
        ? [
            '/opt/antigravity-ide/resources/app',
            '/opt/antigravity/resources/app',
            path.join(os.homedir(), '.local', 'share', 'antigravity', 'resources', 'app'),
        ]
        : exports.isWindows
            ? [
                path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local'), 'Programs', 'Antigravity IDE', 'resources', 'app'),
                path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local'), 'Programs', 'Antigravity', 'resources', 'app'),
            ]
            : [];
let _sqlite3Cache = undefined; // undefined = not tried, null = failed, object = module
/**
 * Resolve and cache the @vscode/sqlite3 native module bundled with AG IDE.
 * Tries vscode.env.appRoot first (when called from extension host), then platform defaults.
 * Returns null if the module cannot be found.
 */
function getSqlite3Module(appRoot) {
    if (_sqlite3Cache !== undefined)
        return _sqlite3Cache;
    const candidates = appRoot
        ? [appRoot, ...AG_APP_ROOT_CANDIDATES]
        : AG_APP_ROOT_CANDIDATES;
    for (const root of candidates) {
        try {
            _sqlite3Cache = require(path.join(root, 'node_modules', '@vscode', 'sqlite3'));
            return _sqlite3Cache;
        }
        catch { /* try next */ }
    }
    _sqlite3Cache = null;
    return null;
}
//# sourceMappingURL=agPaths.js.map