/**
 * Worker Logger — Lightweight file-based logger for detached workers.
 * ════════════════════════════════════════════════════════════════════
 * ZERO vscode dependency — safe for ELECTRON_RUN_AS_NODE=1 processes
 * where the full `createLogger` (which depends on vscode.OutputChannel)
 * is unavailable.
 *
 * Mirrors the same scoped-module pattern as utils/logger.ts but writes
 * exclusively to a physical file (no OutputChannel).
 */
export declare function createWorkerLogger(filePath: string, module: string): {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
};
