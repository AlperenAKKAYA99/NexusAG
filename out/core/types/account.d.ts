import type { TokenBaseData, WorkspaceContextData } from '../../services/tokenBase';
import type { DeepUsageStats } from './usage';
import type { ModelCard } from './quota';
/** Tracked account metadata (stored in globalState) */
export interface TrackedAccount {
    id: string;
    email: string;
    name: string;
    addedAt: number;
}
/** Stored token data (stored in Secrets API) */
export interface StoredTokens {
    access_token: string;
    refresh_token: string;
    expiry_timestamp: number;
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
/**
 * Pre-processed account card — renderer does ZERO logic.
 * Built by quotaManager.buildAccountCards(), consumed by webview renderAll().
 */
export interface AccountCard {
    email: string;
    name?: string;
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
