/**
 * i18n shared types — SSOT for locale codes, labels, and translation shape.
 * Used by both extension host (i18n/index.ts) and webview (i18n/i18nClient.ts).
 */
/** Flat key → string map. All locale JSON files MUST satisfy this shape. */
export type TranslationDict = Record<string, string>;
export type SupportedLocale = 'en' | 'tr' | 'pt-BR' | 'es' | 'de' | 'fr' | 'ja' | 'zh-CN' | 'hi' | 'ru';
export declare const SUPPORTED_LOCALES: SupportedLocale[];
/** Human-readable locale labels (shown in settings UI language grid) */
export declare const LOCALE_LABELS: Record<SupportedLocale, {
    label: string;
    flag: string;
}>;
