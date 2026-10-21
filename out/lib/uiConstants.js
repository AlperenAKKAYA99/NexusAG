"use strict";
/**
 * UI Constants — Pure values safe for both extension host AND webview bundles.
 * NO Node APIs, NO vscode imports. This file is the SSOT for values
 * shared across the webview ↔ extension boundary.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HOURS_IN_DAY = exports.CASCADE_ENRICHED_TITLE_MAX_LEN = exports.CASCADE_ENRICHED_LIMIT = exports.CASCADE_TITLE_MAX_LEN = exports.CASCADE_LIST_LIMIT = exports.CTX_CRITICAL_PCT = exports.CTX_WARNING_PCT = exports.USAGE_MEDIUM_PCT = exports.USAGE_HIGH_PCT = exports.QUOTA_WARN_PCT = exports.QUOTA_HEALTHY_PCT = void 0;
// ─── UI Percentage Thresholds ───
/** Quota remaining: green ≥ this, yellow below */
exports.QUOTA_HEALTHY_PCT = 50;
/** Quota remaining: yellow ≥ this, red below */
exports.QUOTA_WARN_PCT = 20;
/** Usage: red ≥ this */
exports.USAGE_HIGH_PCT = 80;
/** Usage: yellow ≥ this */
exports.USAGE_MEDIUM_PCT = 50;
/** Context window percentage threshold for "warning" state */
exports.CTX_WARNING_PCT = 75;
/** Context window percentage threshold for "critical/error" state */
exports.CTX_CRITICAL_PCT = 90;
// ─── Rendering Defaults ───
/** Default cascade list render limit */
exports.CASCADE_LIST_LIMIT = 20;
/** Default max cascade title length */
exports.CASCADE_TITLE_MAX_LEN = 45;
/** Enriched cascade list render limit */
exports.CASCADE_ENRICHED_LIMIT = 30;
/** Enriched cascade max title length */
exports.CASCADE_ENRICHED_TITLE_MAX_LEN = 55;
/** Hours in a day for chart bucketing */
exports.HOURS_IN_DAY = 24;
//# sourceMappingURL=uiConstants.js.map