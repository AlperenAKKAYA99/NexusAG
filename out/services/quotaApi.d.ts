import { QuotaResult } from '../types';
export declare class QuotaApiService {
    /** Timeout for Google Cloud quota API requests */
    private static readonly CLOUD_API_TIMEOUT_MS;
    /** Fetch quota for a remote account using its access token */
    fetchRemoteQuota(accessToken: string): Promise<QuotaResult>;
    private loadProjectInfo;
    /**
     * Parse retrieveUserQuota buckets[] response.
     * Each bucket: { tokenType, modelId, remainingFraction, resetTime? }
     * Shows ALL models — no filtering. Uses display name overrides when available,
     * otherwise auto-humanizes the model slug.
     */
    private parseBuckets;
    /**
     * Auto-humanize a model slug: 'gemini-3.1-pro-high' → 'Gemini 3.1 Pro (High)'
     * Treats the last segment as a variant qualifier when it's a known modifier.
     */
    private static humanizeModelId;
    private postJson;
}
