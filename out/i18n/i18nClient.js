"use strict";
/**
 * Lightweight i18n client for the webview.
 * Receives the full translation dictionary from the extension host via postMessage.
 * Exposes t() for all webview renderers and onLocaleChange() for reactive re-renders.
 *
 * This module has NO Node.js or vscode API dependencies — pure browser-safe code.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setTranslations = setTranslations;
exports.getLocale = getLocale;
exports.getLocaleLabels = getLocaleLabels;
exports.onLocaleChange = onLocaleChange;
exports.t = t;
const types_1 = require("./types");
let _dict = {};
let _locale = 'en';
const _changeListeners = [];
/**
 * Called when extension host sends locale + translations via postMessage.
 * Triggers all registered onLocaleChange callbacks for reactive re-rendering.
 */
function setTranslations(locale, dict) {
    _locale = locale;
    _dict = dict;
    // Notify all listeners for reactive re-render
    for (const fn of _changeListeners) {
        try {
            fn();
        }
        catch { /* swallow — one broken listener shouldn't block others */ }
    }
}
/** Get current locale code */
function getLocale() {
    return _locale;
}
/** Get the locale labels map (for rendering the language grid) */
function getLocaleLabels() {
    return types_1.LOCALE_LABELS;
}
/**
 * Register a callback that fires whenever the locale changes.
 * Used by renderers to trigger full re-renders with new translations.
 */
function onLocaleChange(fn) {
    _changeListeners.push(fn);
}
/**
 * Translate a key with optional interpolation.
 * If the key is missing from the current dictionary, returns the key itself
 * (the extension host always sends the English fallback merged in).
 *
 * @example t('accounts.count_other', { count: 5 }) → "5 accounts"
 */
function t(key, params) {
    let text = _dict[key] ?? key;
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
        }
    }
    return text;
}
//# sourceMappingURL=i18nClient.js.map