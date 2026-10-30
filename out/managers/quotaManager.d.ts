import * as vscode from 'vscode';
import { ServerInfo, DeepUsageStats } from '../types';
import { AccountManager } from './accountManager';
import { AccountSwitchService } from '../services/accountSwitch';
import { ContextWindowData } from '../services/contextWindow';
import { QuotaViewProvider } from '../providers/quotaViewProvider';
import { ConversationGuard } from '../services/conversationGuard';
export declare class QuotaManager {
    private readonly context;
    private readonly accountManager;
    private convGuard?;
    private readonly statusBar;
    private readonly emailResolver;
    private lastLocalData;
    private lastTrackedQuotas;
    private viewProvider;
    private refreshInFlight;
    /** Email hint from a switch that arrived during an in-flight refresh */
    private pendingHint;
    private pendingManualRefresh;
    private readonly serverDiscovery;
    private readonly switchService;
    private readonly tokenBaseService;
    private readonly usageStatsService;
    private readonly contextWindowService;
    private lastTokenBase;
    private lastWorkspaceContext;
    private lastUsageStats;
    private lastContextWindow;
    private lastContextConversationId;
    /** Last known active email — used by pushCachedData to maintain consistent UI */
    private lastActiveEmail;
    private static readonly CTX_CACHE_KEY;
    private static readonly CASCADE_ID_LOG_LEN;
    private static readonly POST_SWITCH_REFRESH_DELAY;
    private static readonly DEBOUNCE_MS;
    /** Host-side polling interval — runs regardless of panel visibility */
    private static readonly HOST_POLL_INTERVAL_MS;
    private currentUsageRange;
    private cachedServer;
    private static readonly SERVER_CACHE_TTL;
    private cachedCascadeServer;
    private static readonly CASCADE_SERVER_TTL;
    /** Lifecycle-scoped switch guard. AbortController so double-click aborts previous switch. */
    private switchController;
    private hostPollTimer;
    private isLiveMode;
    private static readonly REMOTE_QUOTA_CACHE_TTL;
    private static readonly DEEP_STATS_CACHE_TTL;
    private lastRemoteQuotaFetchTime;
    private lastDeepStatsFetchTime;
    private lightRefreshTimer;
    private liveTurnTimer;
    constructor(context: vscode.ExtensionContext, accountManager: AccountManager, convGuard?: ConversationGuard);
    getSwitchService(): AccountSwitchService;
    setViewProvider(provider: QuotaViewProvider): void;
    private buildViewState;
    private getAccountCards;
    getSelectedModels(): string[];
    getLastUsageStats(): DeepUsageStats | null;
    getFilteredUsageStats(range: string): DeepUsageStats | null;
    getLastContextWindow(): ContextWindowData | null;
    getActiveConversationId(): string | null;
    getServerInfo(): Promise<ServerInfo | null>;
    setUsageRange(range: string): void;
    setLiveMode(live: boolean): void;
    /** Debounced lightweight refresh — called on LiveStream turn idle or USS conversation delta */
    debouncedLightweightRefresh(): void;
    /**
     * Ultra-fast lightweight refresh:
     * - Only queries local Language Server (<5ms on 127.0.0.1)
     * - NEVER calls remote Google APIs (zero network calls, zero 429 risk)
     * - Does NOT scan disk for conversation history
     */
    refreshLightweight(): Promise<void>;
    /** Returns stats filtered by the user's currently selected range */
    private getRangeFilteredStats;
    getPinnedModels(): Record<string, string>;
    setPinnedModels(pins: Record<string, string>): Promise<void>;
    toggleStatusBarModel(modelId: string, isVisible: boolean): Promise<void>;
    /** Push whatever is already in memory to the webview — zero network, instant render */
    pushCachedData(): void;
    private resolveServer;
    /**
     * Resolve the Global (cascade) LS for context window & LiveStream.
     *
     * The IDE runs two LS processes:
     *   - Workspace LS (--workspace_id, --enable_lsp) → code completions, quota, workspace context
     *   - Global LS (no workspace_id) → cascade/chat inference, generator metadata
     *
     * Context window data lives on the Global LS. This method discovers and caches it.
     */
    private resolveCascadeServer;
    private ctxDebounceTimer;
    /** Coalesces rapid-fire USS events into a single fetch. */
    debouncedContextFetch(cascadeId: string): void;
    /** Set active conversation + start live stream. Called on USS activeCascade switch. */
    setActiveConversation(cascadeId: string): void;
    private readonly liveStream;
    private lastLiveTotalLength;
    private initLiveStreamListener;
    private debouncedLiveTurnRefresh;
    /** One-shot context window fetch — used on conversation switch. */
    fetchContextWindowOnce(cascadeId: string): Promise<void>;
    private executeFetch;
    /** Push context window data to all surfaces. Rejects stale data. */
    private pushContextUpdate;
    refresh(activeEmailHint?: string, forceRemote?: boolean): Promise<void>;
    /** Fetch context window for a specific conversation and push to webview */
    private refreshContextWindow;
    /** Refresh ONLY token budget + workspace context — no account quota fetching */
    refreshTokenOnly(): Promise<void>;
    setConversationGuard(convGuard: ConversationGuard): void;
    /** Switch the active IDE account to a tracked account */
    switchAccount(accountId: string): Promise<void>;
    /** Copy refresh_token to clipboard for sharing */
    copyToken(accountId: string): Promise<void>;
    /** Shared helper: resolve server + fetch cascade trajectory summaries */
    private fetchCascadeSummaries;
    /**
     * Fetch all cascade IDs belonging to this workspace.
     * Uses GetAllCascadeTrajectories from the workspace LS — only returns cascades
     * that are associated with this workspace, enabling cross-window isolation.
     */
    getWorkspaceCascadeIds(): Promise<Set<string> | null>;
    /**
     * Query the LS for all cascade trajectories and return the most recently
     * modified cascade ID. USS-independent — works even when USS topics are cold.
     */
    getMostRecentCascadeId(): Promise<string | null>;
    /** Workspace ID matching LS --workspace_id format: slashes+hyphens → underscores */
    private getWorkspaceId;
    /** Delegate to EmailResolver */
    getActiveEmail(): Promise<string>;
    private updateStatusBar;
    /** Diagnostic probe: log raw LS remainingFraction per model (only in diag mode) */
    private logQuotaFractions;
}
