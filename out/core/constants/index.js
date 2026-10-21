"use strict";
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LS_PROCESS_GREP = exports.LS_CERT_PATHS = exports.STATE_DB_PATH = exports.isWindows = exports.isLinux = exports.isMac = exports.HOURS_IN_DAY = exports.CASCADE_ENRICHED_TITLE_MAX_LEN = exports.CASCADE_ENRICHED_LIMIT = exports.CASCADE_TITLE_MAX_LEN = exports.CASCADE_LIST_LIMIT = exports.USAGE_MEDIUM_PCT = exports.USAGE_HIGH_PCT = exports.QUOTA_WARN_PCT = exports.QUOTA_HEALTHY_PCT = exports.CTX_CRITICAL_PCT = exports.CTX_WARNING_PCT = void 0;
__exportStar(require("./oauth"), exports);
__exportStar(require("./api"), exports);
__exportStar(require("./system"), exports);
// UI Constants re-exported from shared
var uiConstants_1 = require("../../shared/uiConstants");
Object.defineProperty(exports, "CTX_WARNING_PCT", { enumerable: true, get: function () { return uiConstants_1.CTX_WARNING_PCT; } });
Object.defineProperty(exports, "CTX_CRITICAL_PCT", { enumerable: true, get: function () { return uiConstants_1.CTX_CRITICAL_PCT; } });
Object.defineProperty(exports, "QUOTA_HEALTHY_PCT", { enumerable: true, get: function () { return uiConstants_1.QUOTA_HEALTHY_PCT; } });
Object.defineProperty(exports, "QUOTA_WARN_PCT", { enumerable: true, get: function () { return uiConstants_1.QUOTA_WARN_PCT; } });
Object.defineProperty(exports, "USAGE_HIGH_PCT", { enumerable: true, get: function () { return uiConstants_1.USAGE_HIGH_PCT; } });
Object.defineProperty(exports, "USAGE_MEDIUM_PCT", { enumerable: true, get: function () { return uiConstants_1.USAGE_MEDIUM_PCT; } });
Object.defineProperty(exports, "CASCADE_LIST_LIMIT", { enumerable: true, get: function () { return uiConstants_1.CASCADE_LIST_LIMIT; } });
Object.defineProperty(exports, "CASCADE_TITLE_MAX_LEN", { enumerable: true, get: function () { return uiConstants_1.CASCADE_TITLE_MAX_LEN; } });
Object.defineProperty(exports, "CASCADE_ENRICHED_LIMIT", { enumerable: true, get: function () { return uiConstants_1.CASCADE_ENRICHED_LIMIT; } });
Object.defineProperty(exports, "CASCADE_ENRICHED_TITLE_MAX_LEN", { enumerable: true, get: function () { return uiConstants_1.CASCADE_ENRICHED_TITLE_MAX_LEN; } });
Object.defineProperty(exports, "HOURS_IN_DAY", { enumerable: true, get: function () { return uiConstants_1.HOURS_IN_DAY; } });
// Platform-aware paths re-exported from shared
var agPaths_1 = require("../../shared/agPaths");
Object.defineProperty(exports, "isMac", { enumerable: true, get: function () { return agPaths_1.isMac; } });
Object.defineProperty(exports, "isLinux", { enumerable: true, get: function () { return agPaths_1.isLinux; } });
Object.defineProperty(exports, "isWindows", { enumerable: true, get: function () { return agPaths_1.isWindows; } });
Object.defineProperty(exports, "STATE_DB_PATH", { enumerable: true, get: function () { return agPaths_1.STATE_DB_PATH; } });
Object.defineProperty(exports, "LS_CERT_PATHS", { enumerable: true, get: function () { return agPaths_1.LS_CERT_PATHS; } });
Object.defineProperty(exports, "LS_PROCESS_GREP", { enumerable: true, get: function () { return agPaths_1.LS_PROCESS_GREP; } });
//# sourceMappingURL=index.js.map