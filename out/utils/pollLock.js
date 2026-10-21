"use strict";
/**
 * PollLock — File-based locking to prevent duplicate refresh
 * across multiple VS Code windows.
 * Uses fs.writeFile with 'wx' (exclusive create) for atomic lock acquisition.
 *
 * Uses PID + instanceId to distinguish between different extension host
 * lifecycles within the same parent process (e.g., Reload Window).
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
exports.PollLock = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const crypto = __importStar(require("crypto"));
const LOCK_DIR = path.join(os.homedir(), '.gemini', 'antigravity');
const MAX_LOCK_AGE_MS = 30 * 1000; // 30 seconds (down from 5 min — refresh should never take this long)
// Unique per extension host lifecycle — changes on Reload Window
const INSTANCE_ID = crypto.randomUUID();
class PollLock {
    lockPath;
    acquired = false;
    constructor(lockName = '.ag-panel-refresh.lock') {
        this.lockPath = path.join(LOCK_DIR, lockName);
    }
    /** Attempt to acquire. Returns true if acquired, false if another instance holds it. */
    async tryAcquire() {
        try {
            fs.mkdirSync(LOCK_DIR, { recursive: true });
            if (fs.existsSync(this.lockPath)) {
                try {
                    const { pid, instanceId, acquiredAt } = JSON.parse(fs.readFileSync(this.lockPath, 'utf8'));
                    const age = Date.now() - acquiredAt;
                    // Same instance — we already hold it (re-entrant)
                    if (instanceId === INSTANCE_ID) {
                        this.acquired = true;
                        return true;
                    }
                    // Different instance but same PID (Reload Window) or dead PID → stale
                    if (age >= MAX_LOCK_AGE_MS || !this.isAlive(pid)) {
                        // Stale lock — remove it
                    }
                    else if (instanceId && instanceId !== INSTANCE_ID) {
                        // Active lock held by different extension host instance
                        return false;
                    }
                    else {
                        // Legacy lock without instanceId — check PID only
                        if (this.isAlive(pid) && age < MAX_LOCK_AGE_MS)
                            return false;
                    }
                }
                catch { /* corrupt lock — overwrite */ }
                try {
                    fs.unlinkSync(this.lockPath);
                }
                catch { /* ok */ }
            }
            fs.writeFileSync(this.lockPath, JSON.stringify({
                pid: process.pid,
                instanceId: INSTANCE_ID,
                acquiredAt: Date.now(),
            }), { flag: 'wx' });
            this.acquired = true;
            return true;
        }
        catch (err) {
            // EEXIST = lost the race; other errors = fail-open
            return err.code !== 'EEXIST';
        }
    }
    /** Release the lock (only if we own it) */
    async release() {
        if (!this.acquired)
            return;
        try {
            const data = JSON.parse(fs.readFileSync(this.lockPath, 'utf8'));
            if (data.instanceId === INSTANCE_ID || data.pid === process.pid) {
                fs.unlinkSync(this.lockPath);
            }
        }
        catch { /* already released */ }
        this.acquired = false;
    }
    isAlive(pid) {
        try {
            process.kill(pid, 0);
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.PollLock = PollLock;
//# sourceMappingURL=pollLock.js.map