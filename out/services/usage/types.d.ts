/**
 * Shared types and constants for the usage stats pipeline.
 */
import { DeepUsageStats } from '../../types';
export declare const BATCH_CONCURRENCY = 50;
export declare const HOT_THRESHOLD_MS: number;
export declare const FETCH_TIMEOUT_MS = 6000;
export declare const CACHE_SCHEMA_VERSION = 2;
export declare const EP: {
    readonly TRAJECTORIES: "GetAllCascadeTrajectories";
    readonly METADATA: "GetCascadeTrajectoryGeneratorMetadata";
    readonly STEPS: "GetCascadeTrajectorySteps";
};
/** Token usage fields returned by the Metadata API (camelCase or snake_case from protobuf) */
export interface MetadataUsage {
    inputTokens?: string;
    input_tokens?: string;
    outputTokens?: string;
    output_tokens?: string;
    responseOutputTokens?: string;
    response_output_tokens?: string;
    cacheReadTokens?: string;
    cache_read_tokens?: string;
    cacheCreationInputTokens?: string;
    cache_creation_input_tokens?: string;
    cacheWriteTokens?: string;
    cache_write_tokens?: string;
    thinkingOutputTokens?: string;
    thinking_output_tokens?: string;
    reasoningTokens?: string;
    reasoning_tokens?: string;
    apiProvider?: string;
    api_provider?: string;
    model?: string;
    contextTokens?: string;
    context_tokens?: string;
    responseId?: string;
    response_id?: string;
}
export type TokenEntrySource = 'metadata' | 'steps';
/** Single API call's token data (stored in disk cache) */
export interface TokenEntry {
    responseId?: string;
    source?: TokenEntrySource;
    inp: number;
    out: number;
    cache: number;
    cacheWrite: number;
    reasoning: number;
    model: string;
    provider: string;
    ts: string;
}
/** Per-conversation cached data */
export interface ConvoTokenData {
    entries: TokenEntry[];
}
/** Disk cache structure */
export interface DiskCacheData {
    schemaVersion?: number;
    perConvo: Record<string, ConvoTokenData>;
    fetchedIds: string[];
    stats: DeepUsageStats;
    updatedAt: string;
    titleMap?: Record<string, string>;
    stepCounts?: Record<string, number>;
    entryCounts?: Record<string, {
        meta: number;
        steps: number;
    }>;
}
/** Canonical dedup fingerprint.
 *  Prefer responseId: metadata and steps often describe the same model call with
 *  slightly different timestamps. The token/timestamp fallback is only for API drift.
 */
export declare function entryFingerprint(e: TokenEntry): string;
export declare function mergePreferredEntry(existing: TokenEntry, next: TokenEntry): TokenEntry;
/** Monthly aggregation accumulator */
export interface MonthlyAccumulator {
    input: number;
    output: number;
    cache: number;
    cacheWrite: number;
    reasoning: number;
    calls: number;
    models: Record<string, {
        tokens: number;
        inp: number;
        out: number;
        cache: number;
        cacheWrite: number;
        reas: number;
    }>;
}
export declare const PLACEHOLDER_MAP: Record<string, string>;
export declare const OPUS_46_CUTOFF = "2026-02-05";
export declare const PROVIDER_DISPLAY: Record<string, string>;
