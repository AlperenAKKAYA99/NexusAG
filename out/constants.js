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
exports.CSRF_TOKEN_RE = exports.LS_PROCESS_GREP_LEGACY = exports.LS_PROCESS_GREP = exports.LS_CERT_PATHS = exports.STATE_DB_PATH = exports.isWindows = exports.isLinux = exports.isMac = exports.LS_SERVICE_PATH = exports.HOURS_IN_DAY = exports.CASCADE_ENRICHED_TITLE_MAX_LEN = exports.CASCADE_ENRICHED_LIMIT = exports.CASCADE_TITLE_MAX_LEN = exports.CASCADE_LIST_LIMIT = exports.USAGE_MEDIUM_PCT = exports.USAGE_HIGH_PCT = exports.QUOTA_WARN_PCT = exports.QUOTA_HEALTHY_PCT = exports.CTX_CRITICAL_PCT = exports.CTX_WARNING_PCT = exports.FILE_HEADER_READ_BYTES = exports.RENEWAL_RETRY_DELAY_MS = exports.CASCADE_PROBE_TIMEOUT_MS = exports.LSOF_EXEC_TIMEOUT_MS = exports.WMIC_EXEC_TIMEOUT_MS = exports.PROCESS_EXEC_TIMEOUT_MS = exports.DEFAULT_LS_TIMEOUT_MS = exports.LS_REQUEST_TIMEOUT_MS = exports.OAUTH_CALLBACK_TIMEOUT_MS = exports.TOKEN_REFRESH_BUFFER_SECS = exports.POLL_INTERVAL_MS = exports.USER_AGENT = exports.CHAT_INTERNAL_RE = exports.ACCOUNT_LABELS_KEY = exports.ACCOUNTS_LIST_KEY = exports.SECRETS_PREFIX = exports.MODEL_DISPLAY_NAMES = exports.LOAD_CODE_ASSIST_ENDPOINTS = exports.QUOTA_API_ENDPOINTS = exports.OAUTH_SCOPES = exports.USERINFO_URL = exports.AUTH_URL = exports.TOKEN_URL = exports.CLIENT_SECRET = exports.CLIENT_ID = void 0;
exports.isDiagEnabled = isDiagEnabled;
// ─── OAuth Client Credentials (SUSP-04 / Informational) ───────────────
// Antigravity's public desktop OAuth client credentials (RFC 8252 — OAuth 2.0 for Native Apps).
// Note: Desktop/native clients cannot securely conceal client secrets; these match the open-source
// Antigravity IDE distribution and redirect solely to local loopback (127.0.0.1).
// User access/refresh tokens are stored in encrypted OS SecretStorage, never hardcoded.
exports.CLIENT_ID = '1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com';
exports.CLIENT_SECRET = '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';
// Google OAuth endpoints
exports.TOKEN_URL = 'https://oauth2.googleapis.com/token';
exports.AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
exports.USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
exports.OAUTH_SCOPES = [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/cclog',
    'https://www.googleapis.com/auth/experimentsandconfigs',
];
// Antigravity Cloud API endpoints (with fallback order)
exports.QUOTA_API_ENDPOINTS = [
    'https://daily-cloudcode-pa.googleapis.com/v1internal:retrieveUserQuota',
    'https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuota',
];
exports.LOAD_CODE_ASSIST_ENDPOINTS = [
    'https://cloudcode-pa.googleapis.com/v1internal:loadCodeAssist',
    'https://daily-cloudcode-pa.googleapis.com/v1internal:loadCodeAssist',
];
// Optional display name overrides for known model slugs.
// Models NOT in this map are still shown — their ID is auto-humanized.
exports.MODEL_DISPLAY_NAMES = {
    'claude-opus-4-6-thinking': 'Claude Opus 4.6 (Thinking)',
    'claude-sonnet-4-6': 'Claude Sonnet 4.6',
    'gemini-3-flash': 'Gemini 3 Flash',
    'gemini-3.1-pro-high': 'Gemini 3.1 Pro (High)',
    'gemini-3.1-pro-low': 'Gemini 3.1 Pro (Low)',
    'gemini-3.8-flash-high': 'Gemini 3.8 Flash (High)',
    'gemini-3.8-flash-medium': 'Gemini 3.8 Flash (Medium)',
    'gemini-3.8-flash-low': 'Gemini 3.8 Flash (Low)',
    'gpt-oss-120b-medium': 'GPT-OSS 120B (Medium)',
};
// Secrets storage key prefix
exports.SECRETS_PREFIX = 'ag.account.';
exports.ACCOUNTS_LIST_KEY = 'ag.trackedAccounts';
exports.ACCOUNT_LABELS_KEY = 'ag.accountLabels';
/** Regex to filter out Google Cloud Pa internal test/routing buckets (e.g. Chat_20706, Chat_23310) */
exports.CHAT_INTERNAL_RE = /^chat[_-]?\d+/i;
// User-Agent for API requests
exports.USER_AGENT = 'Antigravity/4.1.29 Chrome/132.0.6834.160 Electron/39.2.3';
/** Minimum UI refresh polling interval */
exports.POLL_INTERVAL_MS = 60 * 1000;
exports.TOKEN_REFRESH_BUFFER_SECS = 300; // refresh 5 min before expiry
exports.OAUTH_CALLBACK_TIMEOUT_MS = 120_000; // 2 min
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
/** Token renewal retry delay on transient failure */
exports.RENEWAL_RETRY_DELAY_MS = 2 * 60_000;
// ─── Thresholds ───
/** Bytes to read from file header for binary detection */
exports.FILE_HEADER_READ_BYTES = 256;
// ─── UI Constants (re-exported from shared/uiConstants for backward compat) ───
var uiConstants_1 = require("./shared/uiConstants");
Object.defineProperty(exports, "CTX_WARNING_PCT", { enumerable: true, get: function () { return uiConstants_1.CTX_WARNING_PCT; } });
Object.defineProperty(exports, "CTX_CRITICAL_PCT", { enumerable: true, get: function () { return uiConstants_1.CTX_CRITICAL_PCT; } });
Object.defineProperty(exports, "QUOTA_HEALTHY_PCT", { enumerable: true, get: function () { return uiConstants_1.QUOTA_HEALTHY_PCT; } });
Object.defineProperty(exports, "QUOTA_WARN_PCT", { enumerable: true, get: function () { return uiConstants_1.QUOTA_WARN_PCT; } });
Object.defineProperty(exports, "USAGE_HIGH_PCT", { enumerable: true, get: function () { return uiConstants_1.USAGE_HIGH_PCT; } });
Object.defineProperty(exports, "USAGE_MEDIUM_PCT", { enumerable: true, get: function () { return uiConstants_1.USAGE_MEDIUM_PCT; } });
Object.defineProperty(exports, "CASCADE_LIST_LIMIT", { enumerable: true, get: function () { return uiConstants_1.CASCADE_LIST_LIMIT; } });
Object.defineProperty(exports, "CASCADE_TITLE_MAX_LEN", { enumerable: true, get: function () { return uiConstants_1.CASCADE_TITLE_MAX_LEN; } });
Object.defineProperty(exports, "CASCADE_ENRICHED_LIMIT", { enumerable: true, get: function () { return uiConstants_1.CASCADE_ENRICHED_LIMIT; } });
Object.defineProperty(exports, "CASCADE_ENRICHED_TITLE_MAX_LEN", { enumerable: true, get: function () { return uiConstants_1.CASCADE_ENRICHED_TITLE_MAX_LEN; } });
Object.defineProperty(exports, "HOURS_IN_DAY", { enumerable: true, get: function () { return uiConstants_1.HOURS_IN_DAY; } });
/** gRPC service path for all Language Server endpoints — SSOT */
exports.LS_SERVICE_PATH = '/exa.language_server_pb.LanguageServerService';
const vscode = __importStar(require("vscode"));
// Platform-aware paths — re-exported from shared SSOT (vscode-free)
var agPaths_1 = require("./shared/agPaths");
Object.defineProperty(exports, "isMac", { enumerable: true, get: function () { return agPaths_1.isMac; } });
Object.defineProperty(exports, "isLinux", { enumerable: true, get: function () { return agPaths_1.isLinux; } });
Object.defineProperty(exports, "isWindows", { enumerable: true, get: function () { return agPaths_1.isWindows; } });
Object.defineProperty(exports, "STATE_DB_PATH", { enumerable: true, get: function () { return agPaths_1.STATE_DB_PATH; } });
Object.defineProperty(exports, "LS_CERT_PATHS", { enumerable: true, get: function () { return agPaths_1.LS_CERT_PATHS; } });
Object.defineProperty(exports, "LS_PROCESS_GREP", { enumerable: true, get: function () { return agPaths_1.LS_PROCESS_GREP; } });
Object.defineProperty(exports, "LS_PROCESS_GREP_LEGACY", { enumerable: true, get: function () { return agPaths_1.LS_PROCESS_GREP_LEGACY; } });
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
//# sourceMappingURL=constants.js.map