import * as vscode from 'vscode';
/** Log levels ordered by severity */
export declare enum LogLevel {
    DIAG = -1,// diagnostic mode only — gated by isDiagEnabled()
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
/**
 * Initialize the shared OutputChannel.
 * Call once during extension activation.
 */
export declare function initLogger(context: vscode.ExtensionContext, level?: LogLevel): void;
/**
 * Set file sink path — all subsequent log lines are also appended to this file.
 * Pass null to disable. Truncates on first set (fresh per session).
 */
export declare function setFileSink(path: string | null): void;
/**
 * Set diagnostic file sink — DIAG-level lines are appended here when isDiagEnabled() is true.
 * Pass null to disable. Truncates on first set (fresh per session).
 */
export declare function setDiagSink(path: string | null): void;
/**
 * Create a scoped logger for a specific module.
 *
 * Usage:
 * ```ts
 * const log = createLogger('AccountSwitch');
 * log.info('Token renewed');        // → [INFO] [AccountSwitch] Token renewed
 * log.warn('No LS found');          // → [WARN] [AccountSwitch] No LS found
 * log.error('Renewal failed', err); // → [ERROR] [AccountSwitch] Renewal failed ...
 * log.diag('offset=42 total=100');  // → [DIAG] [AccountSwitch] offset=42 total=100  (only when diagnostic mode enabled)
 * ```
 */
export declare function createLogger(module: string): {
    /** Diagnostic — only writes when isDiagEnabled() is true. Zero overhead when off. */
    diag: (msg: string, ...args: unknown[]) => void;
    debug: (msg: string, ...args: unknown[]) => void;
    info: (msg: string, ...args: unknown[]) => void;
    warn: (msg: string, ...args: unknown[]) => void;
    error: (msg: string, ...args: unknown[]) => void;
};
