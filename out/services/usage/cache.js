"use strict";
/**
 * Disk cache management for usage stats.
 * Handles read/write persistence and synchronous cache loading.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsCache = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const types_1 = require("./types");
const agPaths_1 = require("../../shared/agPaths");
const aggregator_1 = require("./aggregator");
const logger_1 = require("../../utils/logger");
const log = (0, logger_1.createLogger)('StatsCache');
class StatsCache {
    /** Path to the disk cache file */
    get filePath() {
        return path.join(agPaths_1.BRAIN_DIR, '.deep_stats_cache.json');
    }
    /** Read cached data from disk. Returns null if missing or corrupted. */
    read() {
        try {
            if (!fs.existsSync(this.filePath))
                return null;
            const raw = fs.readFileSync(this.filePath, 'utf-8');
            const data = JSON.parse(raw);
            if (!data.perConvo || !data.fetchedIds || !data.stats)
                return null;
            if (data.schemaVersion !== types_1.CACHE_SCHEMA_VERSION) {
                log.info(`Cache read: ignoring schema v${data.schemaVersion ?? 1}; rebuild required for v${types_1.CACHE_SCHEMA_VERSION}`);
                return null;
            }
            // Sanitize: remove duplicate entries that may have been persisted
            // by older versions with the RPC pagination overlap bug.
            let totalRemoved = 0;
            for (const cid of Object.keys(data.perConvo)) {
                const entries = data.perConvo[cid].entries;
                if (!entries || entries.length === 0)
                    continue;
                const byFingerprint = new Map();
                for (const e of entries) {
                    const fp = (0, types_1.entryFingerprint)(e);
                    const existing = byFingerprint.get(fp);
                    byFingerprint.set(fp, existing ? (0, types_1.mergePreferredEntry)(existing, e) : e);
                }
                const clean = [...byFingerprint.values()];
                if (clean.length < entries.length) {
                    totalRemoved += entries.length - clean.length;
                    data.perConvo[cid] = { entries: clean };
                }
            }
            if (totalRemoved > 0) {
                log.info(`Cache read: sanitized ${totalRemoved} duplicate entries`);
            }
            return data;
        }
        catch { /* expected: cache file may be corrupted or missing */
            return null;
        }
    }
    /** Write stats data to disk cache. */
    write(perConvo, fetchedIds, stats, titleMap, stepCounts, entryCounts) {
        try {
            // Serialize titleMap as plain object for JSON persistence
            const titleMapObj = {};
            for (const [k, v] of titleMap)
                titleMapObj[k] = v;
            const stepCountsObj = {};
            if (stepCounts) {
                for (const [k, v] of stepCounts)
                    stepCountsObj[k] = v;
            }
            const data = {
                schemaVersion: types_1.CACHE_SCHEMA_VERSION,
                perConvo, fetchedIds, stats,
                updatedAt: new Date().toISOString(),
                titleMap: titleMapObj,
                stepCounts: stepCounts ? stepCountsObj : undefined,
                entryCounts,
            };
            const tmp = this.filePath + '.tmp';
            fs.writeFileSync(tmp, JSON.stringify(data), 'utf-8');
            fs.renameSync(tmp, this.filePath); // atomic on POSIX
            log.info(`Disk cache written: ${fetchedIds.length} conversations, ${titleMap.size} titles`);
        }
        catch (e) {
            log.warn('Failed to write disk cache:', e?.message);
        }
    }
    /**
     * Synchronous disk cache load — returns pre-aggregated stats instantly.
     * Called during refresh() to populate usage stats BEFORE the first webview render.
     * Returns null if no cache exists.
     */
    loadSync(currentTitleMap) {
        const cache = this.read();
        if (!cache)
            return null;
        let titleMap = currentTitleMap;
        if (cache.titleMap) {
            titleMap = new Map(Object.entries(cache.titleMap));
        }
        // Re-aggregate from raw entries so semantic fixes apply to older caches.
        const stats = (0, aggregator_1.aggregateFromPerConvo)(cache.perConvo, titleMap);
        log.info(`loadSync: loaded ${cache.fetchedIds.length} conversations, titles: ${titleMap.size}`);
        return { stats, titleMap };
    }
}
exports.StatsCache = StatsCache;
//# sourceMappingURL=cache.js.map