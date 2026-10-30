import type { TokenBaseData, WorkspaceContextData } from './services/tokenBase';
/** Tracked account metadata (stored in globalState) */
export interface TrackedAccount {
    id: string;
    email: string;
    name: string;
    customLabel?: string;
    addedAt: number;
}
/** Stored token data (stored in Secrets API) */
export interface StoredTokens {
    access_token: string;
    refresh_token: string;
    expiry_timestamp: number;
}
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
/** Local language server connection info */
export interface ServerInfo {
    port: number;
    csrfToken: string;
    protocol: 'http' | 'https';
    /** HTTPS server port for cascade trajectory endpoints (differs from extension_server_port) */
    httpsPort?: number;
}
/** Options for programmatic IDE account switching */
export interface SwitchAccountOptions {
    email: string;
    name: string;
    accessToken: string;
    refreshToken: string;
    expiryTimestamp: number;
}
/** Single model's quota — unified from both local LS and remote API */
export interface ModelCard {
    id: string;
    label: string;
    pct: number;
    resetTime: string;
    isLocal: boolean;
}
/** 3-family status for multi-dot status matrix */
export interface ModelFamilyStatus {
    claudePct: number | null;
    argonGptPct: number | null;
    geminiPct: number | null;
}
/**
 * Pre-processed account card — renderer does ZERO logic.
 * Built by quotaManager.buildAccountCards(), consumed by webview renderAll().
 */
export interface AccountCard {
    email: string;
    name?: string;
    customLabel?: string;
    familyStatus?: ModelFamilyStatus;
    isActive: boolean;
    trackingId?: string;
    models: ModelCard[];
    bottleneck: ModelCard | null;
    tierName: string | null;
    tierId?: string | null;
    aiCredits: number | null;
    promptCredits: number | null;
    promptCreditsMax: number | null;
    flowCredits: number | null;
    flowCreditsMax: number | null;
    resetTime: string;
    isError: boolean;
    errorMessage?: string;
    selectedModels: string[];
    isLocal: boolean;
    /** True during account switch — LS hasn't adopted new identity yet */
    isTransitioning?: boolean;
    /** Target email during transition (the email being switched TO) */
    pendingEmail?: string;
}
/** Unified state object passed to viewProvider.updateData() */
export interface ViewState {
    accountCards: AccountCard[];
    pinnedModels: Record<string, string>;
    tokenBase: TokenBaseData | null;
    workspaceContext: WorkspaceContextData | null;
    usageStats: DeepUsageStats | null;
}
/** Reverse-engineered USS row shape: { value: base64_protobuf, eTag: bigint } */
export interface USSRow {
    value: string;
    eTag: bigint;
    $typeName?: string;
}
/** USS topic subscription (reverse-engineered from IDE internals) */
export interface USSTopic {
    getState(): Record<string, USSRow> | null;
    onDidChange(handler: () => void): {
        dispose(): void;
    };
}
/** OAuth token info for USS uss-oauth topic */
export interface OAuthTokenInfo {
    accessToken: string;
    refreshToken: string;
    expiryDateSeconds: number;
    tokenType: string;
    isGcpTos: boolean;
}
/**
 * Typed accessor for the IDE's antigravityUnifiedStateSync API.
 * This API is injected by the IDE and is not part of the official vscode API.
 */
export interface USSApi {
    OAuthPreferences: {
        setOAuthTokenInfo(info: OAuthTokenInfo): Promise<void>;
        getOAuthTokenInfo(): Promise<string | null>;
    };
    UserStatus: {
        getUserStatus(): Promise<string | null>;
    };
    pushSerializedUpdateIPC(data: string): Promise<void>;
}
/** Typed HTTP error with status code (replaces monkey-patched Error) */
export declare class HttpError extends Error {
    readonly statusCode: number;
    constructor(statusCode: number, message: string);
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
    disabled?: boolean;
    tagTitle?: string;
    tagDescription?: string;
    modelId?: string;
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
/** Time-bucketed token usage */
export interface TokenBucket {
    input: number;
    output: number;
    cache: number;
    cacheWrite: number;
    reasoning: number;
    calls: number;
}
/** Daily breakdown entry */
export interface DailyBucket extends TokenBucket {
    date: string;
}
/** Hourly breakdown entry (aggregated across all days) */
export interface HourlyBucket extends TokenBucket {
    hour: number;
}
/** Model breakdown entry */
export interface ModelBucket extends TokenBucket {
    displayName: string;
}
/** Cascade/conversation breakdown */
export interface CascadeBucket extends TokenBucket {
    id: string;
    title: string;
}
/** Provider breakdown entry */
export interface ProviderBucket extends TokenBucket {
    provider: string;
    displayName: string;
}
/** Day-of-week aggregation (Mon=0 .. Sun=6) */
export interface WeekdayBucket extends TokenBucket {
    day: number;
    label: string;
}
/** Monthly breakdown per model (for tooltip) */
export interface MonthlyModelEntry {
    displayName: string;
    tokens: number;
    cost: number;
    inp: number;
    out: number;
    cache: number;
    cacheWrite?: number;
    reas: number;
}
/** Calendar month bucket (filter-independent) */
export interface MonthlyBucket extends TokenBucket {
    key: string;
    label: string;
    total: number;
    cost: number;
    topModels: MonthlyModelEntry[];
}
/** Full deep analytics stats */
export interface DeepUsageStats {
    totalTokens: number;
    totalInput: number;
    totalOutput: number;
    totalCache: number;
    totalCacheWrite: number;
    totalReasoning: number;
    totalCalls: number;
    daysActive: number;
    cacheRate: number;
    dateRange: {
        from: string;
        to: string;
    };
    daily: DailyBucket[];
    hourly: HourlyBucket[];
    models: ModelBucket[];
    cascades: CascadeBucket[];
    providers: ProviderBucket[];
    weekday: WeekdayBucket[];
    monthly: MonthlyBucket[];
}
