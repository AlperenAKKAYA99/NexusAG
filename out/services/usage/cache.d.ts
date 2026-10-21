/**
 * Disk cache management for usage stats.
 * Handles read/write persistence and synchronous cache loading.
 */
import { DeepUsageStats } from '../../types';
import { DiskCacheData, ConvoTokenData } from './types';
export declare class StatsCache {
    /** Path to the disk cache file */
    get filePath(): string;
    /** Read cached data from disk. Returns null if missing or corrupted. */
    read(): DiskCacheData | null;
    /** Write stats data to disk cache. */
    write(perConvo: Record<string, ConvoTokenData>, fetchedIds: string[], stats: DeepUsageStats, titleMap: Map<string, string>, stepCounts?: Map<string, number>, entryCounts?: Record<string, {
        meta: number;
        steps: number;
    }>): void;
    /**
     * Synchronous disk cache load — returns pre-aggregated stats instantly.
     * Called during refresh() to populate usage stats BEFORE the first webview render.
     * Returns null if no cache exists.
     */
    loadSync(currentTitleMap: Map<string, string>): {
        stats: DeepUsageStats;
        titleMap: Map<string, string>;
    } | null;
}
