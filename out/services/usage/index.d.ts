/**
 * UsageStatsService — orchestrates token usage statistics from the Antigravity
 * Language Server's cascade trajectory endpoints.
 *
 * Data flow:
 * 1. Scan ~/.gemini/antigravity/brain/ for conversation UUIDs
 * 2. Fetch metadata for each via parallel batched API calls
 * 3. Aggregate into daily/hourly/model/cascade breakdowns
 *
 * Delegates to:
 * - aggregator.ts — pure aggregation functions
 * - cache.ts — disk cache persistence
 * - types.ts — shared types and constants
 */
import { ServerInfo, DeepUsageStats } from '../../types';
export declare class UsageStatsService {
    /** Memory cache for deep stats (expensive to compute) */
    private deepStatsCache;
    /** In-memory per-convo data — available during progressive fetch before disk cache exists */
    private currentPerConvo;
    private currentTitleMap;
    private currentStepCounts;
    /** Raw (pre-dedup) meta/steps counts per conversation — for correct offset-based delta */
    private rawFetchCounts;
    private readonly cache;
    private readonly processLock;
    fetchDeepStats(serverInfo: ServerInfo, forceRefresh?: boolean, 
    /** Called when background backfill completes with updated stats */
    onBackfillComplete?: (stats: DeepUsageStats) => void, 
    /** Called during scan with (done, total) for progress UI */
    onProgress?: (done: number, total: number) => void): Promise<DeepUsageStats | null>;
    /**
     * Two-phase full fetch:
     * Phase 1: Fetch recent conversations (mtime < 48h) → return immediately for 24h view
     * Phase 2: Backfill remaining conversations in background → notify via callback
     */
    private twoPhaseFullFetch;
    /**
     * Partition conversation IDs into hot (mtime > cutoff) and cold.
     */
    private partitionByMtime;
    /**
     * Incremental refresh — fetches NEW conversations + re-fetches MODIFIED ones.
     * Uses filesystem mtime to detect conversations that changed since last cache update.
     */
    private incrementalRefresh;
    /**
     * Fetch metadata for conversation IDs (parallel chunks).
     * Hybrid: RPC Direct (HTTPS) first, HTTP fallback on failure.
     */
    private fetchConversationData;
    /** Fetch meta+steps for a single conversation, merge, and dedup. */
    private fetchAndDedup;
    /**
     * Fetch ALL metadata for a conversation using cumulative-offset pagination.
     *
     * The LS caps each response at ~8 MB, so large conversations (4000+ entries)
     * require multiple calls. The `generator_metadata_offset` parameter skips
     * that many entries from the start. We use the cumulative item count as
     * the next offset and stop when no new items arrive.
     *
     * History: paginateAll (pre-b61) produced 20× redundant 8 MB payloads
     * because it re-fetched overlapping ranges without a proper stop condition.
     */
    private fetchMetaForConvo;
    /**
     * Fetch ALL steps for a conversation using cumulative-offset pagination.
     * Same strategy as fetchMetaForConvo — cumulative offset until exhausted.
     */
    private fetchStepsForConvo;
    /** Dedup usage entries by responseId when present, preferring metadata over steps. */
    private dedupEntries;
    /**
     * Build per-conversation entry counts for offset-based delta fetch.
     * Uses raw (pre-dedup) meta/steps counts from rawFetchCounts.
     * Critical: generator_metadata_offset and step_offset are independent
     * LS-side counters. Using deduped entry count (meta+steps combined)
     * would produce offset > totalMeta → LS returns 0 → silent data loss.
     */
    private buildEntryCounts;
    /**
     * Re-aggregate stats with a date range filter.
     * Called when user changes time range (24h/7d/30d/all).
     * Prefers in-memory data to avoid redundant disk I/O.
     */
    getFilteredStats(range: string): DeepUsageStats | null;
    private fetchTrajectorySummaries;
    /**
     * Synchronous disk cache load — returns pre-aggregated stats instantly.
     * Called during refresh() to populate usage stats BEFORE the first webview render.
     * Returns null if no cache exists (triggers full async fetch instead).
     */
    loadFromDiskCacheSync(): DeepUsageStats | null;
    /** Scan ~/.gemini/antigravity/brain/ (and legacy antigravity-ide/brain/) for conversation UUIDs */
    private discoverConversationIds;
    /** Extract TokenEntry[] from metadata items array */
    private extractEntries;
    /** Extract TokenEntry[] from steps items array */
    private extractStepEntries;
}
