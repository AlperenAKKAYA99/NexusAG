"use strict";
/**
 * Shared types and constants for the usage stats pipeline.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROVIDER_DISPLAY = exports.OPUS_46_CUTOFF = exports.PLACEHOLDER_MAP = exports.EP = exports.CACHE_SCHEMA_VERSION = exports.FETCH_TIMEOUT_MS = exports.HOT_THRESHOLD_MS = exports.BATCH_CONCURRENCY = void 0;
exports.entryFingerprint = entryFingerprint;
exports.mergePreferredEntry = mergePreferredEntry;
// ─── Constants ───
exports.BATCH_CONCURRENCY = 50; // max parallel API calls per chunk
exports.HOT_THRESHOLD_MS = 48 * 3600 * 1000; // "hot" if modified within 48h
exports.FETCH_TIMEOUT_MS = 6000; // per-call timeout for metadata/steps fetch
exports.CACHE_SCHEMA_VERSION = 2;
exports.EP = {
    TRAJECTORIES: 'GetAllCascadeTrajectories',
    METADATA: 'GetCascadeTrajectoryGeneratorMetadata',
    STEPS: 'GetCascadeTrajectorySteps',
};
// ─── Shared Fingerprint ───
/** Canonical dedup fingerprint.
 *  Prefer responseId: metadata and steps often describe the same model call with
 *  slightly different timestamps. The token/timestamp fallback is only for API drift.
 */
function entryFingerprint(e) {
    if (e.responseId)
        return `rid:${e.responseId}`;
    return `${e.inp}:${e.out}:${e.cache}:${e.cacheWrite}:${e.reasoning}:${e.ts?.substring(0, 23) || ''}`;
}
function mergePreferredEntry(existing, next) {
    if (existing.source === 'metadata')
        return existing;
    if (next.source === 'metadata') {
        return {
            ...next,
            model: next.model || existing.model,
            provider: next.provider || existing.provider,
            ts: next.ts || existing.ts,
        };
    }
    return existing;
}
// ─── Model Placeholder Maps ───
// Placeholder → raw model string mappings
// NOTE: MODEL_PLACEHOLDER_M* are runtime-routed by the server (no static mapping in binary).
// Sources: (1) API responseModel field, (2) ddarkr/antigravity-token-monitor community map
exports.PLACEHOLDER_MAP = {
    // === Verified via our API responseModel field ===
    'MODEL_PLACEHOLDER_M26': 'claude-opus-4-6-thinking',
    'MODEL_PLACEHOLDER_M35': 'claude-sonnet-4-6',
    'MODEL_PLACEHOLDER_M37': 'gemini-3.1-pro-high',
    'MODEL_PLACEHOLDER_M47': 'gemini-3-flash-c',
    'MODEL_PLACEHOLDER_M50': 'gemini-checkpoint',
    // === Community-verified (ddarkr/antigravity-token-monitor) ===
    'MODEL_PLACEHOLDER_M18': 'gemini-3-flash',
    'MODEL_PLACEHOLDER_M36': 'gemini-3.1-pro-low',
    'MODEL_PLACEHOLDER_M7': 'gemini-3-pro-low',
    'MODEL_PLACEHOLDER_M8': 'gemini-3-pro-high',
    'MODEL_PLACEHOLDER_M9': 'gemini-3-pro-image',
    'MODEL_PLACEHOLDER_M12': 'claude-opus-4-5-thinking',
    // === Explicit model identifiers (returned directly by API, not placeholders) ===
    'MODEL_GOOGLE_GEMINI_2_5_FLASH_LITE': 'gemini-2.5-flash-lite',
    'MODEL_GOOGLE_GEMINI_2_5_FLASH': 'gemini-2.5-flash',
    'MODEL_GOOGLE_GEMINI_2_5_PRO': 'gemini-2.5-pro',
    'MODEL_CLAUDE_4_SONNET': 'claude-sonnet-4',
    'MODEL_CLAUDE_4_SONNET_THINKING': 'claude-sonnet-4-thinking',
    'MODEL_CLAUDE_4_OPUS': 'claude-opus-4',
    'MODEL_CLAUDE_4_OPUS_THINKING': 'claude-opus-4-thinking',
    'MODEL_CLAUDE_4_5_SONNET': 'claude-sonnet-4.5',
    'MODEL_CLAUDE_4_5_SONNET_THINKING': 'claude-sonnet-4.5-thinking',
    'MODEL_CLAUDE_4_5_HAIKU': 'claude-haiku-4.5',
    'MODEL_CLAUDE_4_5_HAIKU_THINKING': 'claude-haiku-4.5-thinking',
    'MODEL_OPENAI_GPT_OSS_120B_MEDIUM': 'gpt-oss-120b',
};
// Date-aware placeholder overrides: M26 was Opus 4.5 before Opus 4.6 shipped
// Opus 4.6 released Feb 5, 2026 — arrived in Antigravity same day
exports.OPUS_46_CUTOFF = '2026-02-05';
exports.PROVIDER_DISPLAY = {
    'API_PROVIDER_ANTHROPIC_VERTEX': 'Claude (Vertex)',
    'API_PROVIDER_GOOGLE_GEMINI': 'Gemini',
    'API_PROVIDER_OPENAI': 'OpenAI',
};
//# sourceMappingURL=types.js.map