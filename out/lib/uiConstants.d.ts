/**
 * UI Constants — Pure values safe for both extension host AND webview bundles.
 * NO Node APIs, NO vscode imports. This file is the SSOT for values
 * shared across the webview ↔ extension boundary.
 */
/** Quota remaining: green ≥ this, yellow below */
export declare const QUOTA_HEALTHY_PCT = 50;
/** Quota remaining: yellow ≥ this, red below */
export declare const QUOTA_WARN_PCT = 20;
/** Usage: red ≥ this */
export declare const USAGE_HIGH_PCT = 80;
/** Usage: yellow ≥ this */
export declare const USAGE_MEDIUM_PCT = 50;
/** Context window percentage threshold for "warning" state */
export declare const CTX_WARNING_PCT = 75;
/** Context window percentage threshold for "critical/error" state */
export declare const CTX_CRITICAL_PCT = 90;
/** Default cascade list render limit */
export declare const CASCADE_LIST_LIMIT = 20;
/** Default max cascade title length */
export declare const CASCADE_TITLE_MAX_LEN = 45;
/** Enriched cascade list render limit */
export declare const CASCADE_ENRICHED_LIMIT = 30;
/** Enriched cascade max title length */
export declare const CASCADE_ENRICHED_TITLE_MAX_LEN = 55;
/** Hours in a day for chart bucketing */
export declare const HOURS_IN_DAY = 24;
