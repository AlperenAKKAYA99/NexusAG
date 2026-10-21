"use strict";
/**
 * Shared helpers — SSOT for both extension host and webview.
 * Pure functions only: no DOM, no Node APIs, no side effects.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fillClass = void 0;
exports.dotClass = dotClass;
exports.pctClass = pctClass;
exports.timeLeft = timeLeft;
exports.formatDurationMs = formatDurationMs;
exports.shortModelName = shortModelName;
exports.normalizeModelKey = normalizeModelKey;
exports.shortTierName = shortTierName;
exports.fmtNum = fmtNum;
exports.fmtBig = fmtBig;
exports.fmtShortDate = fmtShortDate;
exports.escHtml = escHtml;
exports.getNonce = getNonce;
const uiConstants_1 = require("./uiConstants");
// ─── CSS class helpers ───
function dotClass(pct) {
    return pct >= uiConstants_1.QUOTA_HEALTHY_PCT ? 'g' : pct >= uiConstants_1.QUOTA_WARN_PCT ? 'y' : 'r';
}
exports.fillClass = dotClass;
function pctClass(pct) {
    return pct >= uiConstants_1.USAGE_HIGH_PCT ? 'r' : pct >= uiConstants_1.USAGE_MEDIUM_PCT ? 'y' : 'g';
}
// ─── Time helpers ───
function timeLeft(resetTimeStr) {
    if (!resetTimeStr)
        return '';
    const reset = new Date(resetTimeStr);
    if (isNaN(reset.getTime()))
        return '';
    const diff = reset.getTime() - Date.now();
    if (diff <= 0)
        return 'Reset';
    return formatDurationMs(diff);
}
/** Duration in ms → compact string: "5h 23m", "42m", "2d 3h" */
function formatDurationMs(ms) {
    if (ms <= 0)
        return '';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h >= uiConstants_1.HOURS_IN_DAY) {
        const d = Math.floor(h / uiConstants_1.HOURS_IN_DAY);
        const rh = h % uiConstants_1.HOURS_IN_DAY;
        return rh > 0 ? d + 'd ' + rh + 'h' : d + 'd';
    }
    return h > 0 ? h + 'h ' + m + 'm' : m + 'm';
}
// ─── Model/Tier name helpers ───
function shortModelName(name) {
    if (!name)
        return '?';
    return name.split('/').pop().replace(/^models-/, '').replace(/^models_/, '');
}
/**
 * Normalize any model identifier (LS enum, API key, or label) to a canonical
 * lowercase alphanumeric string for cross-source pin matching.
 *
 * "Claude Opus 4.6 (Thinking)" → "claudeopus46thinking"
 * "claude-opus-4-6-thinking"   → "claudeopus46thinking"
 * "MODEL_PLACEHOLDER_M26"      → "modelplaceholderm26"
 */
function normalizeModelKey(s) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}
function shortTierName(name) {
    if (!name)
        return '';
    const parts = name.split(' ');
    return parts[parts.length - 1] || name;
}
// ─── Number formatters ───
/** Number → locale string with separators (28,921) */
function fmtNum(n) {
    return n.toLocaleString();
}
/** Large number → compact string (1.2M, 489.7K) */
function fmtBig(n) {
    if (n >= 1_000_000_000)
        return (n / 1_000_000_000).toFixed(2) + 'B';
    if (n >= 1_000_000)
        return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)
        return (n / 1_000).toFixed(1) + 'K';
    return String(n);
}
/** ISO date → short display (Apr 19) */
function fmtShortDate(iso) {
    if (!iso || iso.length < 10)
        return iso;
    const parts = iso.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[parseInt(parts[1], 10) - 1] + ' ' + parseInt(parts[2], 10);
}
// ─── HTML/Security helpers ───
/** HTML entity escape (escapes &, <, >, \", and ') */
function escHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
/** CSP nonce generator */
function getNonce() {
    let text = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++)
        text += chars.charAt(Math.floor(Math.random() * chars.length));
    return text;
}
//# sourceMappingURL=helpers.js.map