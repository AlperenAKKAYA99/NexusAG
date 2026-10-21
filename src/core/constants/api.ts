// Antigravity Cloud API endpoints (with fallback order)
export const QUOTA_API_ENDPOINTS = [
    'https://daily-cloudcode-pa.googleapis.com/v1internal:retrieveUserQuota',
    'https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuota',
];

export const LOAD_CODE_ASSIST_ENDPOINTS = [
    'https://cloudcode-pa.googleapis.com/v1internal:loadCodeAssist',
    'https://daily-cloudcode-pa.googleapis.com/v1internal:loadCodeAssist',
];

// Optional display name overrides for known model slugs.
// Models NOT in this map are still shown — their ID is auto-humanized.
export const MODEL_DISPLAY_NAMES: Record<string, string> = {
    'claude-opus-4-6-thinking': 'Claude Opus 4.6 (Thinking)',
    'claude-sonnet-4-6': 'Claude Sonnet 4.6',
    'gemini-3-flash': 'Gemini 3 Flash',
    'gemini-3.1-pro-high': 'Gemini 3.1 Pro (High)',
    'gemini-3.1-pro-low': 'Gemini 3.1 Pro (Low)',
    'gpt-oss-120b-medium': 'GPT-OSS 120B (Medium)',
};

// User-Agent for API requests
export const USER_AGENT = 'Antigravity/4.1.29 Chrome/132.0.6834.160 Electron/39.2.3';

/** Minimum UI refresh polling interval */
export const POLL_INTERVAL_MS = 60 * 1000;
/** Token renewal retry delay on transient failure */
export const RENEWAL_RETRY_DELAY_MS = 2 * 60_000;
