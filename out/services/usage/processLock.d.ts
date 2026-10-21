/**
 * Cross-process file lock for UsageStats cache writes.
 * Ensures only ONE extension instance (across multiple windows)
 * actively fetches from the API and writes to disk cache.
 * Other instances operate in read-only mode using the disk cache.
 *
 * Lock file: ~/.gemini/antigravity/brain/.deep_stats_cache.lock
 * Format: { pid: number, ts: number }
 */
export declare class ProcessLock {
    private held;
    /**
     * Try to acquire the writer lock.
     * Returns true if this process is now the exclusive writer.
     * Returns false if another live process already holds the lock.
     */
    acquire(): boolean;
    /**
     * Release the lock. Only releases if this process holds it.
     */
    release(): void;
    /**
     * Refresh the lock timestamp (heartbeat) — prevents stale detection
     * during long-running fetches.
     */
    heartbeat(): void;
    /** Check if this instance currently holds the lock */
    isHeld(): boolean;
    private readLock;
    private writeLock;
    private isStale;
}
