"use strict";
/**
 * i18n Engine — Extension host SSOT for locale management.
 * Detects system locale via vscode.env.language, loads translations,
 * and provides t() for extension-side string resolution.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectLocale = detectLocale;
exports.initI18n = initI18n;
exports.setLocale = setLocale;
exports.getLocale = getLocale;
exports.getTranslations = getTranslations;
exports.t = t;
const vscode = __importStar(require("vscode"));
const types_1 = require("./types");
// Static imports — all locale files are bundled at compile time
const en_json_1 = __importDefault(require("./locales/en.json"));
const tr_json_1 = __importDefault(require("./locales/tr.json"));
const pt_BR_json_1 = __importDefault(require("./locales/pt-BR.json"));
const es_json_1 = __importDefault(require("./locales/es.json"));
const de_json_1 = __importDefault(require("./locales/de.json"));
const fr_json_1 = __importDefault(require("./locales/fr.json"));
const ja_json_1 = __importDefault(require("./locales/ja.json"));
const zh_CN_json_1 = __importDefault(require("./locales/zh-CN.json"));
const hi_json_1 = __importDefault(require("./locales/hi.json"));
const ru_json_1 = __importDefault(require("./locales/ru.json"));
const LOCALE_MAP = {
    'en': en_json_1.default,
    'tr': tr_json_1.default,
    'pt-BR': pt_BR_json_1.default,
    'es': es_json_1.default,
    'de': de_json_1.default,
    'fr': fr_json_1.default,
    'ja': ja_json_1.default,
    'zh-CN': zh_CN_json_1.default,
    'hi': hi_json_1.default,
    'ru': ru_json_1.default,
};
let _currentLocale = 'en';
let _dict = en_json_1.default;
const _fallback = en_json_1.default;
/**
 * Detect the best matching locale from VS Code's env.language.
 * vscode.env.language returns BCP-47 tags like "en", "tr", "pt-br", "zh-cn".
 */
function detectLocale() {
    const vsLang = vscode.env.language.toLowerCase(); // e.g. "pt-br", "zh-cn"
    // 1. Exact match (case-insensitive normalization)
    for (const loc of types_1.SUPPORTED_LOCALES) {
        if (loc.toLowerCase() === vsLang)
            return loc;
    }
    // 2. Base language match (e.g. "pt" → "pt-BR", "zh" → "zh-CN")
    const base = vsLang.split('-')[0];
    for (const loc of types_1.SUPPORTED_LOCALES) {
        if (loc.toLowerCase().startsWith(base))
            return loc;
    }
    // 3. Fallback
    return 'en';
}
/**
 * Initialize i18n with auto-detected or user-chosen locale.
 * Call this once during extension activation.
 */
function initI18n(locale) {
    _currentLocale = locale || detectLocale();
    _dict = LOCALE_MAP[_currentLocale] || en_json_1.default;
}
/** Switch locale at runtime (called when user changes language) */
function setLocale(locale) {
    _currentLocale = locale;
    _dict = LOCALE_MAP[locale] || en_json_1.default;
}
/** Get current locale code */
function getLocale() {
    return _currentLocale;
}
/** Get the full translation dictionary for current locale (sent to webview) */
function getTranslations() {
    return _dict;
}
/**
 * Translate a key with optional interpolation.
 * Falls back to English if key is missing, then to the key itself.
 *
 * @example t('accounts.count_other', { count: 5 }) → "5 accounts"
 */
function t(key, params) {
    let text = _dict[key] ?? _fallback[key] ?? key;
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
        }
    }
    return text;
}
//# sourceMappingURL=index.js.map