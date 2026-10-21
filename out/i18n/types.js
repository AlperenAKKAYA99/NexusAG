"use strict";
/**
 * i18n shared types — SSOT for locale codes, labels, and translation shape.
 * Used by both extension host (i18n/index.ts) and webview (i18n/i18nClient.ts).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCALE_LABELS = exports.SUPPORTED_LOCALES = void 0;
exports.SUPPORTED_LOCALES = [
    'en', 'tr', 'pt-BR', 'es', 'de', 'fr', 'ja', 'zh-CN', 'hi', 'ru',
];
/** Human-readable locale labels (shown in settings UI language grid) */
exports.LOCALE_LABELS = {
    'en': { label: 'English', flag: '🇺🇸' },
    'tr': { label: 'Türkçe', flag: '🇹🇷' },
    'pt-BR': { label: 'Português (Brasil)', flag: '🇧🇷' },
    'es': { label: 'Español', flag: '🇪🇸' },
    'de': { label: 'Deutsch', flag: '🇩🇪' },
    'fr': { label: 'Français', flag: '🇫🇷' },
    'ja': { label: '日本語', flag: '🇯🇵' },
    'zh-CN': { label: '简体中文', flag: '🇨🇳' },
    'hi': { label: 'हिन्दी', flag: '🇮🇳' },
    'ru': { label: 'Русский', flag: '🇷🇺' },
};
//# sourceMappingURL=types.js.map