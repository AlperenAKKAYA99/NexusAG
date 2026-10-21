/**
 * Shared helpers — SSOT for both extension host and webview.
 * Pure functions only: no DOM, no Node APIs, no side effects.
 */
export declare function dotClass(pct: number): string;
export declare const fillClass: typeof dotClass;
export declare function pctClass(pct: number): string;
export declare function timeLeft(resetTimeStr: string | undefined | null): string;
/** Duration in ms → compact string: "5h 23m", "42m", "2d 3h" */
export declare function formatDurationMs(ms: number): string;
export declare function shortModelName(name: string | undefined | null): string;
/**
 * Normalize any model identifier (LS enum, API key, or label) to a canonical
 * lowercase alphanumeric string for cross-source pin matching.
 *
 * "Claude Opus 4.6 (Thinking)" → "claudeopus46thinking"
 * "claude-opus-4-6-thinking"   → "claudeopus46thinking"
 * "MODEL_PLACEHOLDER_M26"      → "modelplaceholderm26"
 */
export declare function normalizeModelKey(s: string): string;
export declare function shortTierName(name: string | undefined | null): string;
/** Number → locale string with separators (28,921) */
export declare function fmtNum(n: number): string;
/** Large number → compact string (1.2M, 489.7K) */
export declare function fmtBig(n: number): string;
/** ISO date → short display (Apr 19) */
export declare function fmtShortDate(iso: string): string;
/** HTML entity escape (escapes &, <, >, \", and ') */
export declare function escHtml(s: string): string;
/** CSP nonce generator */
export declare function getNonce(): string;
