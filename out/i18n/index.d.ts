/**
 * i18n Engine — Extension host SSOT for locale management.
 * Detects system locale via vscode.env.language, loads translations,
 * and provides t() for extension-side string resolution.
 */
import { TranslationDict, SupportedLocale } from './types';
/**
 * Detect the best matching locale from VS Code's env.language.
 * vscode.env.language returns BCP-47 tags like "en", "tr", "pt-br", "zh-cn".
 */
export declare function detectLocale(): SupportedLocale;
/**
 * Initialize i18n with auto-detected or user-chosen locale.
 * Call this once during extension activation.
 */
export declare function initI18n(locale?: SupportedLocale): void;
/** Switch locale at runtime (called when user changes language) */
export declare function setLocale(locale: SupportedLocale): void;
/** Get current locale code */
export declare function getLocale(): SupportedLocale;
/** Get the full translation dictionary for current locale (sent to webview) */
export declare function getTranslations(): TranslationDict;
/**
 * Translate a key with optional interpolation.
 * Falls back to English if key is missing, then to the key itself.
 *
 * @example t('accounts.count_other', { count: 5 }) → "5 accounts"
 */
export declare function t(key: string, params?: Record<string, string | number>): string;
