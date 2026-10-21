"use strict";
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
exports.dbGet = dbGet;
exports.dbQuery = dbQuery;
exports.dbExec = dbExec;
exports.dbExecRaw = dbExecRaw;
exports.isDbAvailable = isDbAvailable;
exports.pruneOldBackups = pruneOldBackups;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
// ─── Lazy Imports (avoid circular deps) ──────────────────────────────
let _stateDbPath;
function getStateDbPath() {
    if (_stateDbPath !== undefined)
        return _stateDbPath;
    const { STATE_DB_PATH } = require('./agPaths');
    const resolved = STATE_DB_PATH || '';
    _stateDbPath = resolved;
    return resolved;
}
let _sqlite3Module = undefined; // undefined = not tried
function getNativeModule() {
    if (_sqlite3Module !== undefined)
        return _sqlite3Module;
    const { getSqlite3Module } = require('./agPaths');
    _sqlite3Module = getSqlite3Module();
    return _sqlite3Module;
}
// ─── Read: Single Row ────────────────────────────────────────────────
/**
 * Read a single value from state.vscdb by key.
 * Returns the raw string value or null if not found.
 */
async function dbGet(key) {
    const dbPath = getStateDbPath();
    if (!dbPath)
        return null;
    // Primary: native module
    const result = await nativeGet(dbPath, key);
    if (result !== undefined)
        return result;
    // Fallback: CLI
    return cliGet(dbPath, key);
}
/**
 * Read raw buffer/string from a specific SQL query.
 * For advanced queries beyond simple key lookup.
 */
async function dbQuery(sql) {
    const dbPath = getStateDbPath();
    if (!dbPath)
        return null;
    const result = await nativeQuery(dbPath, sql);
    if (result !== undefined)
        return result;
    return cliQuery(dbPath, sql);
}
// ─── Write ───────────────────────────────────────────────────────────
/**
 * Execute a write SQL statement against state.vscdb.
 * Creates a timestamped backup before writing.
 * Fire-and-forget: errors are logged, never thrown.
 */
async function dbExec(sql) {
    const dbPath = getStateDbPath();
    if (!dbPath)
        return false;
    // Backup before write
    createBackup(dbPath);
    // Primary: native module
    const nativeOk = await nativeExec(dbPath, sql);
    if (nativeOk !== undefined)
        return nativeOk;
    // Fallback: CLI
    return cliExec(dbPath, sql);
}
/**
 * Execute a write SQL with a pre-escaped value (for large base64 blobs).
 * Used by conversationFix which handles its own SQL construction.
 */
async function dbExecRaw(sql) {
    const dbPath = getStateDbPath();
    if (!dbPath)
        return false;
    createBackup(dbPath);
    const nativeOk = await nativeExec(dbPath, sql);
    if (nativeOk !== undefined)
        return nativeOk;
    return cliExecViaTmpFile(dbPath, sql);
}
// ─── Availability Check ──────────────────────────────────────────────
/**
 * Check if any DB backend (native or CLI) is available.
 * Replaces the old `sqlite3 --version` CLI check.
 */
function isDbAvailable() {
    if (getNativeModule())
        return true;
    // CLI check
    try {
        const cp = require('child_process');
        cp.execSync('sqlite3 --version', { timeout: 3000, stdio: 'pipe' });
        return true;
    }
    catch {
        return false;
    }
}
// ─── Backup Utilities ────────────────────────────────────────────────
function createBackup(dbPath) {
    try {
        if (fs.existsSync(dbPath)) {
            const backupPath = `${dbPath}.ag-backup-${Date.now()}`;
            fs.copyFileSync(dbPath, backupPath);
        }
    }
    catch { /* best-effort */ }
}
const BACKUP_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
/**
 * Remove stale backups older than maxAgeMs (default: 7 days).
 * Call opportunistically — never throws.
 */
function pruneOldBackups(maxAgeMs = BACKUP_MAX_AGE_MS) {
    const dbPath = getStateDbPath();
    if (!dbPath)
        return;
    const dir = path.dirname(dbPath);
    try {
        const now = Date.now();
        fs.readdirSync(dir)
            .filter(f => f.startsWith(path.basename(dbPath) + '.ag-backup-'))
            .forEach(f => {
            const full = path.join(dir, f);
            const ts = parseInt(f.split('.ag-backup-')[1], 10);
            if (!isNaN(ts) && now - ts > maxAgeMs) {
                fs.unlinkSync(full);
            }
        });
    }
    catch { /* best-effort */ }
}
// ═══════════════════════════════════════════════════════════════
// Native Module Implementation (@vscode/sqlite3)
// ═══════════════════════════════════════════════════════════════
function nativeGet(dbPath, key) {
    return new Promise((resolve) => {
        const sqlite3 = getNativeModule();
        if (!sqlite3) {
            resolve(undefined);
            return;
        }
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                resolve(undefined);
                return;
            }
            db.get('SELECT value FROM ItemTable WHERE key = ?', [key], (err, row) => {
                db.close();
                if (err) {
                    resolve(undefined);
                    return;
                }
                resolve(row?.value ?? null);
            });
        });
    });
}
function nativeQuery(dbPath, sql) {
    return new Promise((resolve) => {
        const sqlite3 = getNativeModule();
        if (!sqlite3) {
            resolve(undefined);
            return;
        }
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                resolve(undefined);
                return;
            }
            db.get(sql, (err, row) => {
                db.close();
                if (err) {
                    resolve(undefined);
                    return;
                }
                if (!row) {
                    resolve(null);
                    return;
                }
                // Return first column value
                const keys = Object.keys(row);
                resolve(keys.length > 0 ? row[keys[0]] : null);
            });
        });
    });
}
function nativeExec(dbPath, sql) {
    return new Promise((resolve) => {
        const sqlite3 = getNativeModule();
        if (!sqlite3) {
            resolve(undefined);
            return;
        }
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                resolve(undefined);
                return;
            }
            db.run(sql, (err) => {
                db.close();
                resolve(err ? false : true);
            });
        });
    });
}
// ═══════════════════════════════════════════════════════════════
// CLI Fallback Implementation (sqlite3 binary via cp.execFile — VULN-02 remediation)
// ═══════════════════════════════════════════════════════════════
const TIMEOUT = 5000;
const MAX_BUFFER = 10 * 1024 * 1024;
function cliGet(dbPath, key) {
    const sql = `SELECT value FROM ItemTable WHERE key='${key.replace(/'/g, "''")}'`;
    return cliQuery(dbPath, sql);
}
function cliQuery(dbPath, sql) {
    return new Promise((resolve) => {
        try {
            const cp = require('child_process');
            // Safe: execFile passes parameters as array directly without shell interpolation
            cp.execFile('sqlite3', [dbPath, sql], { timeout: TIMEOUT, maxBuffer: MAX_BUFFER }, (err, stdout) => {
                if (err || !stdout || !stdout.trim()) {
                    resolve(null);
                    return;
                }
                resolve(stdout.trim());
            });
        }
        catch {
            resolve(null);
        }
    });
}
function cliExec(dbPath, sql) {
    return new Promise((resolve) => {
        try {
            const cp = require('child_process');
            // Safe: execFile passes parameters as array directly without shell interpolation
            cp.execFile('sqlite3', [dbPath, sql], { timeout: TIMEOUT }, (err) => resolve(!err));
        }
        catch {
            resolve(false);
        }
    });
}
function cliExecViaTmpFile(dbPath, sql) {
    return new Promise((resolve) => {
        try {
            const cp = require('child_process');
            // Safe: stream SQL to sqlite3 stdin via execFile without invoking shell or creating unlinked temp files
            const child = cp.execFile('sqlite3', [dbPath], { timeout: 30000, maxBuffer: 50 * 1024 * 1024 }, (err) => resolve(!err));
            child.stdin.on('error', () => { });
            child.stdin.write(sql, 'utf8', () => {
                child.stdin.end();
            });
        }
        catch {
            resolve(false);
        }
    });
}
//# sourceMappingURL=db.js.map