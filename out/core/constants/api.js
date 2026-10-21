"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RENEWAL_RETRY_DELAY_MS = exports.POLL_INTERVAL_MS = exports.USER_AGENT = exports.MODEL_DISPLAY_NAMES = exports.LOAD_CODE_ASSIST_ENDPOINTS = exports.QUOTA_API_ENDPOINTS = void 0;
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
    'gpt-oss-120b-medium': 'GPT-OSS 120B (Medium)',
};
// User-Agent for API requests
exports.USER_AGENT = 'Antigravity/4.1.29 Chrome/132.0.6834.160 Electron/39.2.3';
/** Minimum UI refresh polling interval */
exports.POLL_INTERVAL_MS = 60 * 1000;
/** Token renewal retry delay on transient failure */
exports.RENEWAL_RETRY_DELAY_MS = 2 * 60_000;
//# sourceMappingURL=api.js.map