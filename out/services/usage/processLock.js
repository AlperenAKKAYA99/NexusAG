"use strict";
/**
 * Cross-process file lock for UsageStats cache writes.
 * Ensures only ONE extension instance (across multiple windows)
 * actively fetches from the API and writes to disk cache.
 * Other instances operate in read-only mode using the disk cache.
 *
 * Lock file: ~/.gemini/antigravity/brain/.deep_stats_cache.lock
 * Format: { pid: number, ts: number }
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
exports.ProcessLock = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const agPaths_1 = require("../../shared/agPaths");
const logger_1 = require("../../utils/logger");
const log = (0, logger_1.createLogger)('ProcessLock');
const LOCK_FILE = path.join(agPaths_1.BRAIN_DIR, '.deep_stats_cache.lock');
const STALE_THRESHOLD_MS = 60_000; // 60 seconds — lock expires if holder crashes
class ProcessLock {
    held = false;
    /**
     * Try to acquire the writer lock.
     * Returns true if this process is now the exclusive writer.
     * Returns false if another live process already holds the lock.
     */
    acquire() {
        try {
            const existing = this.readLock();
            if (existing && !this.isStale(existing)) {
                // Another process holds a fresh lock — we're a reader
                log.info(`Lock held by PID ${existing.pid} (${Math.round((Date.now() - existing.ts) / 1000)}s ago) — read-only mode`);
                return false;
            }
            // No lock or stale lock — we become the writer
            this.writeLock();
            this.held = true;
            log.info(`Lock acquired (PID ${process.pid})`);
            return true;
        }
        catch (e) {
            log.warn(`Lock acquire failed: ${e?.message} — proceeding as writer`);
            // On error, proceed as writer (fail-open) to avoid data starvation
            this.held = true;
            return true;
        }
    }
    /**
     * Release the lock. Only releases if this process holds it.
     */
    release() {
        if (!this.held)
            return;
        try {
            // Verify we still own the lock before deleting
            const current = this.readLock();
            if (current && current.pid === process.pid) {
                fs.unlinkSync(LOCK_FILE);
            }
            this.held = false;
            log.info('Lock released');
        }
        catch { /* expected: lock file read may fail if deleted */
            this.held = false;
        }
    }
    /**
     * Refresh the lock timestamp (heartbeat) — prevents stale detection
     * during long-running fetches.
     */
    heartbeat() {
        if (!this.held)
            return;
        try {
            this.writeLock();
        }
        catch { /* best-effort */ }
    }
    /** Check if this instance currently holds the lock */
    isHeld() {
        return this.held;
    }
    readLock() {
        try {
            if (!fs.existsSync(LOCK_FILE))
                return null;
            const raw = fs.readFileSync(LOCK_FILE, 'utf-8');
            return JSON.parse(raw);
        }
        catch { /* expected: lock file delete may fail if already removed */
            return null;
        }
    }
    writeLock() {
        const data = { pid: process.pid, ts: Date.now() };
        fs.writeFileSync(LOCK_FILE, JSON.stringify(data), 'utf-8');
    }
    isStale(lock) {
        // Time-based: older than threshold
        if (Date.now() - lock.ts > STALE_THRESHOLD_MS)
            return true;
        // PID-based: process no longer running
        try {
            process.kill(lock.pid, 0); // signal 0 = existence check
            return false;
        }
        catch { /* expected: stale lock cleanup — PID no longer exists */
            return true; // process doesn't exist
        }
    }
}
exports.ProcessLock = ProcessLock;
//# sourceMappingURL=processLock.js.map