/**
 * PollLock — File-based locking to prevent duplicate refresh
 * across multiple VS Code windows.
 * Uses fs.writeFile with 'wx' (exclusive create) for atomic lock acquisition.
 *
 * Uses PID + instanceId to distinguish between different extension host
 * lifecycles within the same parent process (e.g., Reload Window).
 */
export declare class PollLock {
    private readonly lockPath;
    private acquired;
    constructor(lockName?: string);
    /** Attempt to acquire. Returns true if acquired, false if another instance holds it. */
    tryAcquire(): Promise<boolean>;
    /** Release the lock (only if we own it) */
    release(): Promise<void>;
    private isAlive;
}
