/**
 * LiteLlmPricingCatalog — Dynamic pricing from LiteLLM's model catalog.
 * Fetches 700+ model prices from GitHub at boot, caches for 6 hours.
 * Resolution: exact match → suffix match → alias expansion → null
 */
export interface ModelPricing {
    inputCostPerToken: number;
    outputCostPerToken: number;
    cacheReadCostPerToken?: number;
    cacheWriteCostPerToken?: number;
    reasoningCostPerToken?: number;
}
/** Initialize pricing catalog — call at boot (fire-and-forget). */
export declare function initPricingCatalog(): Promise<void>;
/** Resolve pricing for a model name. Returns null → use hardcoded fallback. */
export declare function resolveLiteLlmPricing(modelName: string): ModelPricing | null;
