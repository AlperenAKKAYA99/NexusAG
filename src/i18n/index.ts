/**
 * i18n Engine — Extension host SSOT for locale management.
 * Detects system locale via vscode.env.language, loads translations,
 * and provides t() for extension-side string resolution.
 */

import * as vscode from 'vscode';
import { TranslationDict, SupportedLocale, SUPPORTED_LOCALES } from './types';

// Static imports — all locale files are bundled at compile time
import en from './locales/en.json';
import tr from './locales/tr.json';
import ptBR from './locales/pt-BR.json';
import es from './locales/es.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import ja from './locales/ja.json';
import zhCN from './locales/zh-CN.json';
import hi from './locales/hi.json';
import ru from './locales/ru.json';

const LOCALE_MAP: Record<SupportedLocale, TranslationDict> = {
    'en': en,
    'tr': tr,
    'pt-BR': ptBR,
    'es': es,
    'de': de,
    'fr': fr,
    'ja': ja,
    'zh-CN': zhCN,
    'hi': hi,
    'ru': ru,
};

let _currentLocale: SupportedLocale = 'en';
let _dict: TranslationDict = en;
const _fallback: TranslationDict = en;

/**
 * Detect the best matching locale from VS Code's env.language.
 * vscode.env.language returns BCP-47 tags like "en", "tr", "pt-br", "zh-cn".
 */
export function detectLocale(): SupportedLocale {
    const vsLang = vscode.env.language.toLowerCase(); // e.g. "pt-br", "zh-cn"

    // 1. Exact match (case-insensitive normalization)
    for (const loc of SUPPORTED_LOCALES) {
        if (loc.toLowerCase() === vsLang) return loc;
    }
    // 2. Base language match (e.g. "pt" → "pt-BR", "zh" → "zh-CN")
    const base = vsLang.split('-')[0];
    for (const loc of SUPPORTED_LOCALES) {
        if (loc.toLowerCase().startsWith(base)) return loc;
    }
    // 3. Fallback
    return 'en';
}

/**
 * Initialize i18n with auto-detected or user-chosen locale.
 * Call this once during extension activation.
 */
export function initI18n(locale?: SupportedLocale): void {
    _currentLocale = locale || detectLocale();
    _dict = LOCALE_MAP[_currentLocale] || en;
}

/** Switch locale at runtime (called when user changes language) */
export function setLocale(locale: SupportedLocale): void {
    _currentLocale = locale;
    _dict = LOCALE_MAP[locale] || en;
}

/** Get current locale code */
export function getLocale(): SupportedLocale {
    return _currentLocale;
}

/** Get the full translation dictionary for current locale (sent to webview) */
export function getTranslations(): TranslationDict {
    return _dict;
}

/**
 * Translate a key with optional interpolation.
 * Falls back to English if key is missing, then to the key itself.
 *
 * @example t('accounts.count_other', { count: 5 }) → "5 accounts"
 */
export function t(key: string, params?: Record<string, string | number>): string {
    let text = _dict[key] ?? _fallback[key] ?? key;
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
        }
    }
    return text;
}
