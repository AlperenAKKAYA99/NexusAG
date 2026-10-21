import type { TrackedAccount } from './account';
/** Parsed model quota from remote API */
export interface QuotaModel {
    name: string;
    percentage: number;
    resetTime: string;
    resetTimeRaw: string;
}
/** Full quota result for a tracked account */
export interface AccountQuota {
    account: TrackedAccount;
    models: QuotaModel[];
    tier: string | null;
    tierName: string | null;
    isForbidden: boolean;
    isError: boolean;
    errorMessage?: string;
    lastUpdated: number;
}
/** Fetched quota result returned by QuotaApiService */
export interface QuotaResult {
    models: QuotaModel[];
    tier: string | null;
    tierName: string | null;
    isForbidden: boolean;
    isError: boolean;
    errorMessage?: string;
}
/** Single model's quota — unified from both local LS and remote API */
export interface ModelCard {
    id: string;
    label: string;
    pct: number;
    resetTime: string;
    isLocal: boolean;
}
/** Model quota info from local LS GetUserStatus response */
export interface ModelQuotaInfo {
    remainingFraction?: number;
    resetTime?: string;
}
/** Individual model config from LS response */
export interface ClientModelConfig {
    label?: string;
    modelOrAlias?: {
        model?: string;
    };
    quotaInfo?: ModelQuotaInfo;
}
/** Local LS GetUserStatus response shape */
export interface LocalQuotaData {
    userStatus?: {
        email?: string;
        cascadeModelConfigData?: {
            clientModelConfigs?: ClientModelConfig[];
        };
        userTier?: {
            id?: string;
            name?: string;
            availableCredits?: Array<{
                creditType: string;
                creditAmount: string;
            }>;
        };
        planStatus?: {
            availablePromptCredits?: number;
            availableFlowCredits?: number;
            planInfo?: {
                monthlyPromptCredits?: number;
                monthlyFlowCredits?: number;
            };
        };
    };
}
