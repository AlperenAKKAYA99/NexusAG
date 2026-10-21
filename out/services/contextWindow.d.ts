/**
 * Context Window Service
 * Fetches real-time context window data for the active conversation.
 * Data source: LS Metadata API → contextWindowMetadata + completionConfig
 */
import { ServerInfo } from '../types';
export interface ContextWindowCategory {
    name: string;
    tokens: number;
    percentage: number;
    color: string;
    icon: string;
    count: number;
}
export interface ContextBreakdownChild {
    name: string;
    numTokens: number;
    children?: {
        name: string;
        numTokens: number;
    }[];
}
export interface ContextBreakdownGroup {
    name: string;
    numTokens: number;
    children?: ContextBreakdownChild[];
}
export interface ContextWindowData {
    conversationId: string;
    title: string;
    model: string;
    provider: string;
    usedTokens: number;
    maxTokens: number;
    percentage: number;
    categories: ContextWindowCategory[];
    /** Raw tokenBreakdown groups for the detail dashboard */
    rawBreakdown?: ContextBreakdownGroup[];
    completionConfig: {
        maxOutputTokens: number;
        temperature: number;
        topK: number;
        topP: number;
    };
    lastUpdated: string;
}
export declare class ContextWindowService {
    /** In-flight request dedup — prevents parallel identical LS calls */
    private inFlight;
    /**
     * Result-level cache — caches the FINAL ContextWindowData, not raw metadata.
     * On cache hit: ZERO API calls. On miss: 2 calls (GetCascadeTrajectory + metadata seek).
     * Capped at MAX_CACHE_ENTRIES to prevent unbounded growth across conversations.
     */
    private resultCache;
    private static readonly CACHE_TTL;
    private static readonly META_PAGE_SIZE;
    private static readonly MAX_CACHE_ENTRIES;
    /**
     * Fetch context window for a SPECIFIC cascade ID (no heuristic selection).
     * Used by USS tracker when it detects which conversation just changed.
     * Deduplicates parallel calls per cascadeId.
     */
    getContextForCascade(serverInfo: ServerInfo, cascadeId: string): Promise<ContextWindowData | null>;
    private _getContextForCascade;
    /**
     * Fetch context data for a specific cascade.
     *
     * API call chain (exactly 2 calls):
     * 1. GetCascadeTrajectory → numTotalGeneratorMetadata (title comes from caller)
     * 2. GetCascadeTrajectoryGeneratorMetadata(offset) → last page with token data
     */
    private fetchAndCacheContextData;
    private buildContextWindowData;
    private parseCategories;
    private extractRawBreakdown;
    private getMaxContext;
    private formatModelName;
    private formatProvider;
    /**
     * Find the most recent metadata entry with real token data (estimatedTokensUsed > 0).
     * This is always the most accurate context window snapshot.
     */
    private scanForTokenData;
    /** Set cache entry with LRU eviction at MAX_CACHE_ENTRIES */
    private setCacheEntry;
    /**
     * Invalidate cached result for a specific cascade.
     * Called by USS eTag tracker when it detects the conversation data changed —
     * ensures the next fetch reads fresh metadata from the LS instead of returning stale cache.
     */
    invalidateCache(cascadeId: string): void;
    /**
     * Lightweight live-fetch: get ONLY the last metadata entry for real-time context window
     * updates during model execution. Called on every stream delta.
     *
     * NOTE: `streamTotalLength` is used ONLY as a signal that new data exists.
     * The actual offset is derived from the API's own `numTotalGeneratorMetadata`
     * because the stream counts ALL entry types (chat, system, metadata) while
     * the API only counts generator metadata entries.
     */
    fetchLastEntry(serverInfo: ServerInfo, cascadeId: string, _streamTotalLength: number, title: string): Promise<ContextWindowData | null>;
    /** Thin wrapper: callLsJson that resolves null on error (contextWindow is best-effort) */
    private callLs;
}
