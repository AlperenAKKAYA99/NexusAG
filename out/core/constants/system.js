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
exports.CSRF_TOKEN_RE = exports.LS_SERVICE_PATH = exports.FILE_HEADER_READ_BYTES = exports.CASCADE_PROBE_TIMEOUT_MS = exports.LSOF_EXEC_TIMEOUT_MS = exports.WMIC_EXEC_TIMEOUT_MS = exports.PROCESS_EXEC_TIMEOUT_MS = exports.DEFAULT_LS_TIMEOUT_MS = exports.LS_REQUEST_TIMEOUT_MS = void 0;
exports.isDiagEnabled = isDiagEnabled;
const vscode = __importStar(require("vscode"));
// ─── Timeouts ───
/** Language Server endpoint request timeout */
exports.LS_REQUEST_TIMEOUT_MS = 10_000;
/** Default timeout for LS JSON/proto calls */
exports.DEFAULT_LS_TIMEOUT_MS = 8_000;
/** Timeout for process listing (ps/lsof) exec calls */
exports.PROCESS_EXEC_TIMEOUT_MS = 8_000;
/** Timeout for Windows WMIC exec calls */
exports.WMIC_EXEC_TIMEOUT_MS = 5_000;
/** Timeout for lsof port discovery */
exports.LSOF_EXEC_TIMEOUT_MS = 5_000;
/** Timeout for cascade probe during server discovery */
exports.CASCADE_PROBE_TIMEOUT_MS = 3_000;
// ─── Thresholds ───
/** Bytes to read from file header for binary detection */
exports.FILE_HEADER_READ_BYTES = 256;
/** gRPC service path for all Language Server endpoints — SSOT */
exports.LS_SERVICE_PATH = '/exa.language_server_pb.LanguageServerService';
/** Unified CSRF token extraction regex — SSOT for process discovery */
exports.CSRF_TOKEN_RE = /--csrf_token[\s=]+([\w-]+)/;
/**
 * Configuration-gated diagnostic file logging.
 * When false (default), diag() functions are no-ops → zero disk I/O overhead.
 * Enable via: Settings → ag-switchboard.diagnosticMode → true
 *
 * Cached per-check to avoid repeated configuration reads.
 */
const DIAG_CACHE_TTL_MS = 5_000;
let _diagCached = null;
let _diagCacheTs = 0;
function isDiagEnabled() {
    const now = Date.now();
    if (_diagCached !== null && now - _diagCacheTs < DIAG_CACHE_TTL_MS)
        return _diagCached;
    try {
        _diagCached = vscode.workspace.getConfiguration('ag-switchboard')
            .get('diagnosticMode', false);
    }
    catch { /* expected: env parse failure — use fallback */
        _diagCached = false;
    }
    _diagCacheTs = now;
    return _diagCached;
}
//# sourceMappingURL=system.js.map