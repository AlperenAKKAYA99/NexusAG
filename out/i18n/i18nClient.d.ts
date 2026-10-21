/**
 * Lightweight i18n client for the webview.
 * Receives the full translation dictionary from the extension host via postMessage.
 * Exposes t() for all webview renderers and onLocaleChange() for reactive re-renders.
 *
 * This module has NO Node.js or vscode API dependencies — pure browser-safe code.
 */
import { TranslationDict, SupportedLocale, LOCALE_LABELS } from './types';
/**
 * Called when extension host sends locale + translations via postMessage.
 * Triggers all registered onLocaleChange callbacks for reactive re-rendering.
 */
export declare function setTranslations(locale: SupportedLocale, dict: TranslationDict): void;
/** Get current locale code */
export declare function getLocale(): SupportedLocale;
/** Get the locale labels map (for rendering the language grid) */
export declare function getLocaleLabels(): typeof LOCALE_LABELS;
/**
 * Register a callback that fires whenever the locale changes.
 * Used by renderers to trigger full re-renders with new translations.
 */
export declare function onLocaleChange(fn: () => void): void;
/**
 * Translate a key with optional interpolation.
 * If the key is missing from the current dictionary, returns the key itself
 * (the extension host always sends the English fallback merged in).
 *
 * @example t('accounts.count_other', { count: 5 }) → "5 accounts"
 */
export declare function t(key: string, params?: Record<string, string | number>): string;
