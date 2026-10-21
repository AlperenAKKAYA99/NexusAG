"use strict";
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
exports.LogLevel = void 0;
exports.initLogger = initLogger;
exports.setFileSink = setFileSink;
exports.setDiagSink = setDiagSink;
exports.createLogger = createLogger;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const constants_1 = require("../constants");
/** Log levels ordered by severity */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DIAG"] = -1] = "DIAG";
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
const LEVEL_LABELS = {
    [LogLevel.DIAG]: 'DIAG',
    [LogLevel.DEBUG]: 'DEBUG',
    [LogLevel.INFO]: 'INFO',
    [LogLevel.WARN]: 'WARN',
    [LogLevel.ERROR]: 'ERROR',
};
let outputChannel = null;
let minLevel = LogLevel.DEBUG;
/** Physical file path — when set, every log line is also appended here. */
let fileSinkPath = null;
/** Diagnostic-specific file sink — gated by isDiagEnabled(), independent from fileSinkPath. */
let diagSinkPath = null;
/**
 * Initialize the shared OutputChannel.
 * Call once during extension activation.
 */
function initLogger(context, level = LogLevel.DEBUG) {
    outputChannel = vscode.window.createOutputChannel('AG Panel', { log: true });
    context.subscriptions.push(outputChannel);
    minLevel = level;
}
/**
 * Set file sink path — all subsequent log lines are also appended to this file.
 * Pass null to disable. Truncates on first set (fresh per session).
 */
function setFileSink(path) {
    fileSinkPath = path;
    if (path) {
        try {
            fs.writeFileSync(path, '');
        }
        catch { /* non-fatal */ }
    }
}
/**
 * Set diagnostic file sink — DIAG-level lines are appended here when isDiagEnabled() is true.
 * Pass null to disable. Truncates on first set (fresh per session).
 */
function setDiagSink(path) {
    diagSinkPath = path;
    if (path) {
        try {
            fs.writeFileSync(path, '');
        }
        catch { /* non-fatal */ }
    }
}
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
function createLogger(module) {
    const write = (level, msg, ...args) => {
        if (level !== LogLevel.DIAG && level < minLevel)
            return;
        const timestamp = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
        const label = LEVEL_LABELS[level];
        const suffix = args.length > 0 ? ' ' + args.map(a => a instanceof Error ? a.message : String(a)).join(' ') : '';
        const line = `[${timestamp}] [${label}] [${module}] ${msg}${suffix}`;
        outputChannel?.appendLine(line);
        // DIAG level → write to diagnostic sink (separate from normal file sink)
        if (level === LogLevel.DIAG && diagSinkPath) {
            try {
                fs.appendFileSync(diagSinkPath, line + '\n');
            }
            catch { /* non-fatal */ }
        }
        if (fileSinkPath) {
            try {
                fs.appendFileSync(fileSinkPath, line + '\n');
            }
            catch { /* non-fatal */ }
        }
        switch (level) {
            case LogLevel.DIAG:
                console.debug(line);
                break;
            case LogLevel.DEBUG:
                console.debug(line);
                break;
            case LogLevel.INFO:
                console.log(line);
                break;
            case LogLevel.WARN:
                console.warn(line);
                break;
            case LogLevel.ERROR:
                console.error(line);
                break;
        }
    };
    return {
        /** Diagnostic — only writes when isDiagEnabled() is true. Zero overhead when off. */
        diag: (msg, ...args) => { if ((0, constants_1.isDiagEnabled)())
            write(LogLevel.DIAG, msg, ...args); },
        debug: (msg, ...args) => write(LogLevel.DEBUG, msg, ...args),
        info: (msg, ...args) => write(LogLevel.INFO, msg, ...args),
        warn: (msg, ...args) => write(LogLevel.WARN, msg, ...args),
        error: (msg, ...args) => write(LogLevel.ERROR, msg, ...args),
    };
}
//# sourceMappingURL=logger.js.map