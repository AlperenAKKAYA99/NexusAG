/**
 * Pure aggregation functions for token usage data.
 * All functions are stateless and testable in isolation.
 */
import { ConvoTokenData, MetadataUsage } from './types';
import { DeepUsageStats } from '../../types';
/**
 * Resolve raw model string to display name.
 * @param ts — ISO timestamp for date-aware placeholder resolution (optional)
 */
export declare function getModelDisplayName(raw: string, apiProvider?: string, ts?: string): string;
/** Extract token counts from an API usage object, handling both camelCase and snake_case field names. */
export declare function extractTokens(usage: MetadataUsage): {
    inp: number;
    out: number;
    cache: number;
    cacheWrite: number;
    reasoning: number;
};
export type DateFilter = string | {
    from?: string;
    to?: string;
};
/**
 * Aggregate DeepUsageStats from per-conversation cached data.
 * Composes pure bucket builders into the final stats object.
 * @param dateFilter — Full ISO cutoff string, or bounded ISO range.
 */
export declare function aggregateFromPerConvo(perConvo: Record<string, ConvoTokenData>, titleMap: Map<string, string>, dateFilter?: DateFilter): DeepUsageStats;
