"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotaManager = void 0;
const vscode = __importStar(require("vscode"));
const lsClient_1 = require("../utils/lsClient");
const pollLock_1 = require("../utils/pollLock");
const accountCardBuilder_1 = require("./accountCardBuilder");
const serverDiscovery_1 = require("../services/serverDiscovery");
const accountSwitch_1 = require("../services/accountSwitch");
const tokenBase_1 = require("../services/tokenBase");
const usage_1 = require("../services/usage");
const contextWindow_1 = require("../services/contextWindow");
const liveStream_1 = require("../services/liveStream");
const statusBar_1 = require("../services/statusBar");
const contextDetailPanel_1 = require("../providers/contextDetailPanel");
const usageStatsPanel_1 = require("../providers/usageStatsPanel");
const emailResolver_1 = require("../services/emailResolver");
const uss_1 = require("../utils/uss");
const logger_1 = require("../utils/logger");
const i18n_1 = require("../i18n");
const tokenExportFormatter_1 = require("../shared/tokenExportFormatter");
const log = (0, logger_1.createLogger)('QuotaManager');
class QuotaManager {
    context;
    accountManager;
    convGuard;
    statusBar;
    emailResolver = new emailResolver_1.EmailResolver();
    lastLocalData = null;
    lastTrackedQuotas = [];
    viewProvider = null;
    refreshInFlight = false;
    /** Email hint from a switch that arrived during an in-flight refresh */
    pendingHint;
    pendingManualRefresh = false;
    serverDiscovery = new serverDiscovery_1.ServerDiscoveryService();
    switchService;
    tokenBaseService = new tokenBase_1.TokenBaseService();
    usageStatsService = new usage_1.UsageStatsService();
    contextWindowService = new contextWindow_1.ContextWindowService();
    lastTokenBase = null;
    lastWorkspaceContext = null;
    lastUsageStats = null;
    lastContextWindow = null;
    lastContextConversationId = null;
    /** Last known active email — used by pushCachedData to maintain consistent UI */
    lastActiveEmail = '';
    static CTX_CACHE_KEY = 'ag.lastContextWindow';
    static CASCADE_ID_LOG_LEN = 12;
    static POST_SWITCH_REFRESH_DELAY = 2000;
    static DEBOUNCE_MS = 1500;
    /** Host-side polling interval — runs regardless of panel visibility */
    static HOST_POLL_INTERVAL_MS = 60_000;
    currentUsageRange = '24h';
    cachedServer = null;
    static SERVER_CACHE_TTL = 60_000;
    // Global LS port is stable across IDE reloads; separate from workspace LS cache.
    cachedCascadeServer = null;
    static CASCADE_SERVER_TTL = 600_000;
    /** Lifecycle-scoped switch guard. AbortController so double-click aborts previous switch. */
    switchController = null;
    hostPollTimer = null;
    isLiveMode = false;
    static REMOTE_QUOTA_CACHE_TTL = 90_000; // 90s protection shield against Google 429
    static DEEP_STATS_CACHE_TTL = 45_000; // 45s disk scan throttle
    lastRemoteQuotaFetchTime = 0;
    lastDeepStatsFetchTime = 0;
    lightRefreshTimer = null;
    liveTurnTimer = null;
    constructor(context, accountManager, convGuard) {
        this.context = context;
        this.accountManager = accountManager;
        this.convGuard = convGuard;
        this.switchService = new accountSwitch_1.AccountSwitchService(context, accountManager.getAuthService());
        this.statusBar = new statusBar_1.StatusBarService(context);
        context.subscriptions.push({ dispose: () => this.switchService.dispose() });
        context.subscriptions.push({ dispose: () => this.liveStream.destroy() });
        context.subscriptions.push({ dispose: () => this.switchController?.abort() });
        this.initLiveStreamListener();
        contextDetailPanel_1.ContextDetailPanel.setRefreshCallback(async () => {
            if (this.lastContextConversationId) {
                this.contextWindowService.invalidateCache(this.lastContextConversationId);
                await this.executeFetch(this.lastContextConversationId);
            }
        });
        this.lastContextWindow = null;
        this.lastContextConversationId = null;
        this.context.globalState.update(QuotaManager.CTX_CACHE_KEY, null);
        this.refresh();
        // Host-side periodic poll — keeps status bar and cache fresh even
        // when the sidebar panel is collapsed (webview timer dies without
        // retainContextWhenHidden). This is the authoritative poll;
        // the webview timer provides supplementary UI-driven refreshes.
        this.hostPollTimer = setInterval(() => this.refresh(), QuotaManager.HOST_POLL_INTERVAL_MS);
        context.subscriptions.push({ dispose: () => { if (this.hostPollTimer)
                clearInterval(this.hostPollTimer); } });
    }
    getSwitchService() {
        return this.switchService;
    }
    setViewProvider(provider) {
        this.viewProvider = provider;
        if (this.lastLocalData || this.lastTrackedQuotas.length > 0) {
            this.viewProvider.updateData(this.buildViewState());
        }
    }
    // ── ViewState builder (DRY: used by all updateData calls) ──
    buildViewState() {
        return {
            accountCards: this.getAccountCards(),
            pinnedModels: this.getPinnedModels(),
            tokenBase: this.lastTokenBase,
            workspaceContext: this.lastWorkspaceContext,
            usageStats: this.getRangeFilteredStats(),
        };
    }
    getAccountCards() {
        const cards = (0, accountCardBuilder_1.buildAccountCards)(this.lastLocalData, this.lastTrackedQuotas, this.lastActiveEmail, !!this.switchController, this.getSelectedModels());
        return cards;
    }
    getSelectedModels() {
        return this.context.globalState.get('ag.selectedStatusBarModels', []);
    }
    getLastUsageStats() {
        return this.lastUsageStats;
    }
    getFilteredUsageStats(range) {
        return this.usageStatsService.getFilteredStats(range);
    }
    getLastContextWindow() {
        return this.lastContextWindow;
    }
    getActiveConversationId() {
        return this.lastContextConversationId;
    }
    async getServerInfo() {
        return this.resolveServer();
    }
    setUsageRange(range) {
        this.currentUsageRange = range;
    }
    setLiveMode(live) {
        this.isLiveMode = live;
        log.info(`setLiveMode: ${live}`);
    }
    /** Debounced lightweight refresh — called on LiveStream turn idle or USS conversation delta */
    debouncedLightweightRefresh() {
        if (this.lightRefreshTimer)
            clearTimeout(this.lightRefreshTimer);
        this.lightRefreshTimer = setTimeout(() => {
            this.lightRefreshTimer = null;
            this.refreshLightweight();
        }, 500);
    }
    /**
     * Ultra-fast lightweight refresh:
     * - Only queries local Language Server (<5ms on 127.0.0.1)
     * - NEVER calls remote Google APIs (zero network calls, zero 429 risk)
     * - Does NOT scan disk for conversation history
     */
    async refreshLightweight() {
        if (this.refreshInFlight)
            return;
        const serverInfo = await this.resolveServer();
        if (!serverInfo)
            return;
        try {
            const localData = await this.serverDiscovery.fetchLocalQuota(serverInfo).catch(() => null);
            if (localData) {
                this.lastLocalData = localData;
                this.updateStatusBar(localData);
                this.logQuotaFractions(localData);
                this.pushCachedData();
            }
        }
        catch (e) {
            log.diag(`refreshLightweight error: ${e?.message}`);
        }
    }
    /** Returns stats filtered by the user's currently selected range */
    getRangeFilteredStats() {
        if (!this.lastUsageStats)
            return null;
        return this.usageStatsService.getFilteredStats(this.currentUsageRange);
    }
    getPinnedModels() {
        return { ...this.context.globalState.get('ag.pinnedModels', {}) };
    }
    async setPinnedModels(pins) {
        await this.context.globalState.update('ag.pinnedModels', pins);
    }
    async toggleStatusBarModel(modelId, isVisible) {
        let selected = this.getSelectedModels();
        if (isVisible && !selected.includes(modelId)) {
            selected.push(modelId);
        }
        else if (!isVisible) {
            selected = selected.filter(id => id !== modelId);
        }
        await this.context.globalState.update('ag.selectedStatusBarModels', selected);
        if (this.lastLocalData)
            this.updateStatusBar(this.lastLocalData);
    }
    /** Push whatever is already in memory to the webview — zero network, instant render */
    pushCachedData() {
        if (!this.viewProvider) {
            log.info('pushCachedData: no viewProvider');
            return;
        }
        const hasLocal = !!this.lastLocalData;
        const hasTracked = this.lastTrackedQuotas.length > 0;
        const ctxId = this.lastContextWindow?.conversationId?.substring(0, 12) || 'none';
        log.info(`pushCachedData: hasLocal=${hasLocal}, trackedCount=${this.lastTrackedQuotas.length}, ctxFor=${ctxId}, active=${this.lastContextConversationId?.substring(0, 12) || 'none'}`);
        if (hasLocal || hasTracked) {
            this.viewProvider.updateData(this.buildViewState());
            // Push cached context window if available — NO re-fetch here
            if (this.lastContextWindow) {
                this.viewProvider.postContextWindow(this.lastContextWindow);
            }
            // Also update status bar from cached local data to prevent stale "Server Not Found"
            if (this.lastLocalData)
                this.updateStatusBar(this.lastLocalData);
        }
    }
    // ── Shared server resolution (DRY: used by refresh, refreshTokenOnly, fetchCtxIndependent) ──
    async resolveServer(forceRefresh = false) {
        if (!forceRefresh && this.cachedServer && Date.now() - this.cachedServer.ts < QuotaManager.SERVER_CACHE_TTL) {
            return this.cachedServer.info;
        }
        const info = await this.serverDiscovery.discover(this.getWorkspaceId()).catch(() => null);
        this.cachedServer = { info, ts: Date.now() };
        return info;
    }
    /**
     * Resolve the Global (cascade) LS for context window & LiveStream.
     *
     * The IDE runs two LS processes:
     *   - Workspace LS (--workspace_id, --enable_lsp) → code completions, quota, workspace context
     *   - Global LS (no workspace_id) → cascade/chat inference, generator metadata
     *
     * Context window data lives on the Global LS. This method discovers and caches it.
     */
    async resolveCascadeServer(cascadeId) {
        if (this.cachedCascadeServer && this.cachedCascadeServer.info && Date.now() - this.cachedCascadeServer.ts < QuotaManager.CASCADE_SERVER_TTL) {
            return this.cachedCascadeServer.info;
        }
        // Do NOT pass wsServer as fallback — WS LS has stale cascade snapshots.
        const info = await this.serverDiscovery.discoverCascadeServer(cascadeId, null).catch(() => null);
        if (info) {
            this.cachedCascadeServer = { info, ts: Date.now() };
            return info;
        }
        // Stale-while-revalidate: if fresh discovery failed but we have a
        // previously cached server (expired TTL), use it rather than returning null.
        // Global LS rarely changes port — stale cache is almost always correct.
        if (this.cachedCascadeServer?.info) {
            log.info(`resolveCascadeServer: fresh discovery failed, using stale cache (port=${this.cachedCascadeServer.info.port}, age=${Date.now() - this.cachedCascadeServer.ts}ms)`);
            return this.cachedCascadeServer.info;
        }
        log.diag(`resolveCascadeServer: not found (no cache)`);
        return null;
    }
    // ── Debounced Context Fetch ──────────────────────────────────
    ctxDebounceTimer = null;
    /** Coalesces rapid-fire USS events into a single fetch. */
    debouncedContextFetch(cascadeId) {
        if (this.ctxDebounceTimer)
            clearTimeout(this.ctxDebounceTimer);
        this.ctxDebounceTimer = setTimeout(() => {
            this.ctxDebounceTimer = null;
            this.executeFetch(cascadeId);
        }, QuotaManager.DEBOUNCE_MS);
    }
    /** Set active conversation + start live stream. Called on USS activeCascade switch. */
    setActiveConversation(cascadeId) {
        this.lastContextConversationId = cascadeId;
        // Do NOT invalidate cachedCascadeServer — Global LS is a singleton.
        // Forcing re-discovery on every switch caused ps/lsof timing races.
        this.lastLiveTotalLength = 0;
        log.diag(`setActiveConversation: ${cascadeId.substring(0, QuotaManager.CASCADE_ID_LOG_LEN)}`);
        this.resolveCascadeServer(cascadeId).then(server => {
            if (server) {
                this.liveStream.connect(server, cascadeId);
            }
            else {
                this.resolveServer().then(ws => {
                    if (ws)
                        this.liveStream.connect(ws, cascadeId);
                }).catch((e) => log.warn('LiveStream fallback failed:', e?.message));
            }
        }).catch(err => log.diag(`setActiveConversation: ${err?.message}`));
    }
    // ── Live Stream ──────────────────────────────────────────────
    liveStream = new liveStream_1.LiveStream();
    lastLiveTotalLength = 0;
    initLiveStreamListener() {
        this.liveStream.on('totalLength', async (event) => {
            this.debouncedLiveTurnRefresh();
            // Use Global/Cascade LS — workspace LS has stale snapshots (hours old)
            const server = this.cachedCascadeServer?.info ?? this.cachedServer?.info;
            if (!server || !event.conversationId)
                return;
            if (event.conversationId !== this.lastContextConversationId)
                return;
            if (event.totalLength <= this.lastLiveTotalLength)
                return;
            this.lastLiveTotalLength = event.totalLength;
            try {
                const data = await this.contextWindowService.fetchLastEntry(server, event.conversationId, event.totalLength, this.lastContextWindow?.title || 'Conversation');
                if (event.totalLength < this.lastLiveTotalLength)
                    return; // newer delta arrived
                if (data)
                    this.pushContextUpdate(data, event.conversationId, server);
            }
            catch (e) {
                log.diag(`liveStream delta: ${e?.message}`);
            }
        });
    }
    debouncedLiveTurnRefresh() {
        if (this.liveTurnTimer)
            clearTimeout(this.liveTurnTimer);
        this.liveTurnTimer = setTimeout(() => {
            this.liveTurnTimer = null;
            log.diag('LiveStream turn quiet — triggering lightweight quota update');
            this.debouncedLightweightRefresh();
        }, 1200);
    }
    /** One-shot context window fetch — used on conversation switch. */
    async fetchContextWindowOnce(cascadeId) {
        return this.executeFetch(cascadeId, true);
    }
    async executeFetch(cascadeId, setActive = false) {
        if (setActive)
            this.lastContextConversationId = cascadeId;
        const shortId = cascadeId.substring(0, QuotaManager.CASCADE_ID_LOG_LEN);
        try {
            this.contextWindowService.invalidateCache(cascadeId);
            // Global LS only — workspace LS has stale snapshots (hours old)
            const cascadeServer = await this.resolveCascadeServer(cascadeId);
            if (!cascadeServer) {
                log.info(`fetchCW: unavailable for ${shortId}`);
                return;
            }
            await this.refreshContextWindow(cascadeServer, cascadeId);
        }
        catch (err) {
            this.cachedCascadeServer = null;
            log.info(`fetchCW: FAILED ${err?.message}`);
        }
    }
    /** Push context window data to all surfaces. Rejects stale data. */
    pushContextUpdate(data, cascadeId, server) {
        // Reject data from a conversation we've already switched away from.
        // This prevents the boot fetch (slow LS response) from overwriting
        // a quicker switch fetch that completed first.
        if (cascadeId !== this.lastContextConversationId) {
            log.info(`pushCW: REJECT stale ${cascadeId.substring(0, 12)} (active=${this.lastContextConversationId?.substring(0, 12)})`);
            return;
        }
        // Never overwrite newer data with older for the SAME conversation
        if (this.lastContextWindow && data.lastUpdated && this.lastContextWindow.lastUpdated) {
            if (data.lastUpdated < this.lastContextWindow.lastUpdated) {
                return;
            }
        }
        log.info(`pushCW: ACCEPT ${cascadeId.substring(0, 12)} title="${data.title?.substring(0, 25)}" tokens=${data.usedTokens}`);
        this.lastContextWindow = data;
        this.context.globalState.update(QuotaManager.CTX_CACHE_KEY, data);
        if (this.viewProvider)
            this.viewProvider.postContextWindow(data);
        contextDetailPanel_1.ContextDetailPanel.pushUpdate(data, server);
        if (data.usedTokens > 0 && data.maxTokens > 0) {
            this.statusBar.updateContext(data.usedTokens, data.maxTokens, data.model);
        }
    }
    async refresh(activeEmailHint, forceRemote = false) {
        // Suppress refresh during active switch lifecycle to prevent premature renders
        if (this.switchController && !this.switchController.signal.aborted) {
            log.info('refresh: SUPPRESSED (switch lifecycle active)');
            return;
        }
        if (this.refreshInFlight) {
            if (activeEmailHint) {
                this.pendingHint = activeEmailHint;
            }
            else {
                this.pendingManualRefresh = true;
            }
            log.diag(`refresh: QUEUED (hint=${activeEmailHint || 'manual'})`);
            return;
        }
        const lock = new pollLock_1.PollLock();
        if (!await lock.tryAcquire()) {
            log.diag('refresh: SKIPPED (lock held by another instance)');
            return;
        }
        this.refreshInFlight = true;
        const startTime = Date.now();
        try {
            const hasData = !!(this.lastLocalData || this.lastTrackedQuotas.length > 0);
            if (this.viewProvider && !hasData)
                this.viewProvider.setLoading();
            const serverInfo = await this.resolveServer();
            const workspaceName = vscode.workspace.workspaceFolders?.[0]?.name ?? '';
            const workspaceFsPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
            // Remote Quota Protection Shield: throttle external Google APIs to prevent HTTP 429
            const shouldFetchRemote = forceRemote ||
                (Date.now() - this.lastRemoteQuotaFetchTime >= QuotaManager.REMOTE_QUOTA_CACHE_TTL) ||
                this.lastTrackedQuotas.length === 0;
            const trackedPromise = shouldFetchRemote
                ? this.accountManager.refreshAllQuotas().then(res => {
                    this.lastRemoteQuotaFetchTime = Date.now();
                    return res;
                }).catch(() => [])
                : Promise.resolve(this.lastTrackedQuotas);
            const [localResult, trackedResult, tokenBase, workspaceContext] = await Promise.all([
                serverInfo ? this.serverDiscovery.fetchLocalQuota(serverInfo).catch(() => null) : Promise.resolve(null),
                trackedPromise,
                this.tokenBaseService.fetchTokenBase(serverInfo, this.getWorkspaceId()).catch(() => null),
                serverInfo ? this.tokenBaseService.fetchWorkspaceContext(serverInfo, workspaceName, workspaceFsPath).catch(() => null) : Promise.resolve(null),
            ]);
            // Pre-load disk cache synchronously so first render includes usage stats
            if (!this.lastUsageStats) {
                const cachedStats = this.usageStatsService.loadFromDiskCacheSync();
                if (cachedStats)
                    this.lastUsageStats = cachedStats;
            }
            const activeEmail = activeEmailHint ?? await this.getActiveEmail();
            this.lastActiveEmail = activeEmail;
            log.info(`refresh: ${Date.now() - startTime}ms local=${!!localResult} tracked=${trackedResult.length} (remoteFetched=${shouldFetchRemote})`);
            if (localResult) {
                this.lastLocalData = localResult;
                this.updateStatusBar(localResult);
                this.logQuotaFractions(localResult);
            }
            else {
                this.lastLocalData = null;
                this.statusBar.setError('$(error) Antigravity: Server Not Found', 'Could not connect to local Antigravity server');
            }
            this.lastTrackedQuotas = trackedResult;
            this.lastTokenBase = tokenBase;
            this.lastWorkspaceContext = workspaceContext;
            if (this.viewProvider) {
                if (this.lastLocalData || this.lastTrackedQuotas.length > 0) {
                    this.viewProvider.updateData(this.buildViewState());
                }
                else {
                    this.viewProvider.setError('Antigravity IDE server not found and no tracked accounts.');
                }
            }
            // Deep usage stats — fire-and-forget after initial render (throttled to 45s unless forced)
            const shouldFetchDeepStats = forceRemote ||
                (Date.now() - this.lastDeepStatsFetchTime >= QuotaManager.DEEP_STATS_CACHE_TTL) ||
                !this.lastUsageStats;
            if (serverInfo && shouldFetchDeepStats) {
                this.lastDeepStatsFetchTime = Date.now();
                const isSubsequentCall = !!this.lastUsageStats;
                this.usageStatsService.fetchDeepStats(serverInfo, isSubsequentCall, (backfilledStats) => {
                    this.lastUsageStats = backfilledStats;
                    usageStatsPanel_1.UsageStatsPanel.currentPanel?.updateLatestStats(backfilledStats);
                    this.pushCachedData();
                }, (done, total) => {
                    this.viewProvider?.postMessage({ type: 'scanProgress', done, total });
                }).then(deep => {
                    if (deep) {
                        log.diag(`refresh: fetchDeepStats done — ${deep.totalCalls} calls`);
                        this.lastUsageStats = deep;
                        usageStatsPanel_1.UsageStatsPanel.currentPanel?.updateLatestStats(deep);
                        this.pushCachedData();
                    }
                }).catch(err => {
                    log.warn(`refresh: fetchDeepStats threw: ${err?.message}`);
                    if (!this.lastUsageStats) {
                        this.viewProvider?.postMessage({
                            type: 'usageStatsUpdate',
                            usageStats: { error: err?.message || 'Failed to scan usage data from Antigravity server.' }
                        });
                    }
                });
            }
            else if (!serverInfo) {
                log.warn('refresh: serverInfo is null — skipping fetchDeepStats (no LS server found)');
            }
        }
        catch (error) {
            const msg = error.message || 'Unknown error';
            log.info(`refresh: ERROR: ${msg}`);
            if (this.viewProvider)
                this.viewProvider.setError(msg);
            this.statusBar.setError('$(error) Antigravity: Error', msg);
        }
        finally {
            this.refreshInFlight = false;
            await lock.release();
            const hint = this.pendingHint;
            const manualPending = this.pendingManualRefresh;
            this.pendingHint = undefined;
            this.pendingManualRefresh = false;
            if (hint) {
                this.refresh(hint);
            }
            else if (manualPending) {
                this.refresh();
            }
        }
    }
    /** Fetch context window for a specific conversation and push to webview */
    async refreshContextWindow(serverInfo, cascadeId) {
        log.diag(`refreshCW: fetching for ${cascadeId.substring(0, QuotaManager.CASCADE_ID_LOG_LEN)}`);
        try {
            const ctx = await this.contextWindowService.getContextForCascade(serverInfo, cascadeId);
            if (!ctx) {
                log.diag(`refreshCW: ctx is null for ${cascadeId.substring(0, QuotaManager.CASCADE_ID_LOG_LEN)}`);
                if (cascadeId !== this.lastContextConversationId)
                    return;
                this.lastContextWindow = null;
                this.context.globalState.update(QuotaManager.CTX_CACHE_KEY, null);
                this.viewProvider?.postContextWindow(null);
                log.diag('refreshCW: cleared stale context (active conversation has no data)');
                return;
            }
            log.diag(`refreshCW: got data — title="${ctx.title?.substring(0, 30)}" tokens=${ctx.usedTokens}/${ctx.maxTokens} convId=${ctx.conversationId?.substring(0, QuotaManager.CASCADE_ID_LOG_LEN)}`);
            this.pushContextUpdate(ctx, ctx.conversationId, serverInfo);
        }
        catch (err) {
            log.diag(`refreshCW FAILED: ${err?.message}`);
            log.info(`refreshContextWindow FAILED: ${err?.message}`);
        }
    }
    /** Refresh ONLY token budget + workspace context — no account quota fetching */
    async refreshTokenOnly() {
        if (this.refreshInFlight)
            return;
        this.refreshInFlight = true;
        try {
            if (this.viewProvider)
                this.viewProvider.setLoading();
            const workspaceName = vscode.workspace.workspaceFolders?.[0]?.name ?? '';
            const workspaceFsPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
            const serverInfo = await this.resolveServer();
            const [tokenBase, workspaceContext] = await Promise.all([
                this.tokenBaseService.fetchTokenBase(serverInfo, this.getWorkspaceId()).catch(() => null),
                serverInfo ? this.tokenBaseService.fetchWorkspaceContext(serverInfo, workspaceName, workspaceFsPath).catch(() => null) : Promise.resolve(null),
            ]);
            this.lastTokenBase = tokenBase;
            this.lastWorkspaceContext = workspaceContext;
            if (this.viewProvider) {
                const activeEmail = await this.getActiveEmail();
                this.lastActiveEmail = activeEmail;
                this.viewProvider.updateData(this.buildViewState());
            }
        }
        catch (error) {
            if (this.viewProvider)
                this.viewProvider.setError(error.message || 'Token refresh failed');
        }
        finally {
            this.refreshInFlight = false;
        }
    }
    setConversationGuard(convGuard) {
        this.convGuard = convGuard;
    }
    /** Switch the active IDE account to a tracked account */
    async switchAccount(accountId) {
        const account = this.accountManager.getAccounts().find(a => a.id === accountId);
        if (!account) {
            vscode.window.showErrorMessage('Account not found');
            return;
        }
        // Force-refresh for max TTL token
        const tokens = await this.accountManager.getValidTokensForAccount(account.email, true);
        if (!tokens) {
            vscode.window.showErrorMessage(`No valid tokens for ${account.email}. Please re-add the account.`);
            return;
        }
        const cfg = vscode.workspace.getConfiguration('ag-switchboard');
        const switchWithFix = cfg.get('switchWithFixConversations', true);
        const modalDetail = switchWithFix
            ? 'Antigravity will switch to this account, rebuild the sidebar conversation index (Fix Missing Conversations), and relaunch automatically.'
            : undefined;
        const confirm = await vscode.window.showWarningMessage(`Switch IDE account to ${account.email}?`, modalDetail ? { modal: true, detail: modalDetail } : { modal: true }, 'Switch');
        if (confirm !== 'Switch')
            return;
        // Abort previous switch (double-click protection)
        this.switchController?.abort();
        this.switchController = new AbortController();
        try {
            if (switchWithFix && this.convGuard) {
                vscode.window.showInformationMessage(`🔄 Switching to ${account.email} and rebuilding conversation index...`);
                await this.switchService.applyAccountCredentials({
                    email: account.email,
                    name: account.name,
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    expiryTimestamp: tokens.expiry_timestamp,
                });
                this.lastActiveEmail = account.email;
                log.info(`switchAccount (with Fix Conversations): applied credentials for ${account.email}, triggering fix worker`);
                this.convGuard.runFix({
                    authStatus: {
                        name: account.name,
                        email: account.email,
                        apiKey: tokens.access_token,
                        userStatusProtoBinaryBase64: this.switchService.buildUserStatusProto(account.name, account.email),
                    },
                });
                return;
            }
            const result = await this.switchService.switchAccount({
                email: account.email, name: account.name, accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token, expiryTimestamp: tokens.expiry_timestamp,
            });
            if (result.confirmed) {
                this.lastActiveEmail = account.email;
                log.info(`switchAccount: confirmed ${account.email}`);
                try {
                    this.cachedServer = null;
                    const serverInfo = await this.resolveServer();
                    if (!serverInfo)
                        throw new Error('no server');
                    const localData = await this.serverDiscovery.fetchLocalQuota(serverInfo).catch(() => null);
                    if (localData) {
                        this.lastLocalData = localData;
                        this.updateStatusBar(localData);
                    }
                }
                catch (e) {
                    log.warn('Post-switch local fetch failed:', e?.message);
                }
                this.pushCachedData();
                setTimeout(() => this.refresh(), QuotaManager.POST_SWITCH_REFRESH_DELAY);
            }
            else {
                // USS state was set but LS unavailable — will recover on next LS restart
                log.warn(`switchAccount: unconfirmed for ${account.email}`);
                this.lastActiveEmail = account.email;
                this.cachedServer = null;
            }
        }
        finally {
            this.switchController = null;
        }
    }
    /**
     * Resolves a refresh token for an account id or email with USS and SwitchService fallbacks.
     */
    async resolveAccountRefreshToken(accountIdOrEmail) {
        let token = await this.accountManager.getRefreshToken(accountIdOrEmail);
        // Fallback 1: check active session via USS if this is the active account
        if (!token) {
            try {
                const uss = (0, uss_1.getUSS)();
                if (uss?.OAuthPreferences?.getOAuthTokenInfo) {
                    const info = await uss.OAuthPreferences.getOAuthTokenInfo();
                    if (info) {
                        const parsed = typeof info === 'string' ? JSON.parse(info) : info;
                        token = parsed?.refreshToken || parsed?.refresh_token || null;
                    }
                }
            }
            catch (e) {
                log.warn('Could not read token from USS:', e?.message || e);
            }
        }
        // Fallback 2: check activeRefreshToken on switchService
        if (!token) {
            token = this.switchService.getActiveRefreshToken();
        }
        return token || null;
    }
    /** Copy refresh_token to clipboard for sharing */
    async copyToken(accountId) {
        const token = await this.resolveAccountRefreshToken(accountId);
        if (!token) {
            vscode.window.showErrorMessage((0, i18n_1.t)('notify.noTokenFound'));
            return false;
        }
        await vscode.env.clipboard.writeText(token);
        vscode.window.showInformationMessage((0, i18n_1.t)('notify.tokenCopied'));
        return true;
    }
    /**
     * Copy multiple refresh tokens to clipboard in the specified format.
     * Webview or caller sends account IDs (or empty for all).
     */
    async copyTokens(accountIds, format = 'plain') {
        const trackedAccounts = this.accountManager.getAccounts();
        // Determine targets: specific accounts or all
        let targets;
        if (accountIds && accountIds.length > 0) {
            targets = [];
            for (const id of accountIds) {
                const cleanId = id.replace(/^active:/, '').trim().toLowerCase();
                const matched = trackedAccounts.find(a => a.id.toLowerCase() === cleanId ||
                    (a.email && a.email.toLowerCase() === cleanId));
                if (matched) {
                    targets.push({ id: matched.id, email: matched.email, name: matched.name });
                }
                else if (cleanId.includes('@') || cleanId === 'active') {
                    // Local active account or direct email
                    const localEmail = this.lastLocalData?.userStatus?.email || (cleanId.includes('@') ? cleanId : 'active');
                    targets.push({ id, email: localEmail });
                }
            }
        }
        else {
            // All tracked accounts + local active account if not already in tracked
            targets = trackedAccounts.map(a => ({ id: a.id, email: a.email, name: a.name }));
            const localEmail = this.lastLocalData?.userStatus?.email;
            if (localEmail && !targets.some(t => t.email.toLowerCase() === localEmail.toLowerCase())) {
                targets.unshift({ id: 'active', email: localEmail });
            }
        }
        if (targets.length === 0) {
            vscode.window.showWarningMessage((0, i18n_1.t)('export.noneFound'));
            return { total: 0, copiedCount: 0, missingCount: 0, copiedEmails: [], missingEmails: [] };
        }
        // Optional confirmation dialog if bulk (more than 1) and confirmBulkCopy is enabled
        const confirmBulk = vscode.workspace.getConfiguration('ag-switchboard').get('tokenExport.confirmBulkCopy', true);
        if (targets.length > 1 && confirmBulk) {
            const copyBtn = (0, i18n_1.t)('export.copy_other', { count: targets.length });
            const answer = await vscode.window.showWarningMessage((0, i18n_1.t)('notify.bulkCopyConfirm', { count: targets.length }), { modal: true, detail: (0, i18n_1.t)('export.securityWarning') }, copyBtn);
            if (answer !== copyBtn) {
                return { total: targets.length, copiedCount: 0, missingCount: 0, copiedEmails: [], missingEmails: [] };
            }
        }
        const entries = [];
        const copiedEmails = [];
        const missingEmails = [];
        for (const target of targets) {
            const token = await this.resolveAccountRefreshToken(target.id);
            if (token) {
                entries.push({
                    email: target.email,
                    name: target.name,
                    token,
                });
                copiedEmails.push(target.email);
            }
            else {
                missingEmails.push(target.email);
            }
        }
        if (entries.length === 0) {
            vscode.window.showErrorMessage((0, i18n_1.t)('export.noneFound'));
            return {
                total: targets.length,
                copiedCount: 0,
                missingCount: missingEmails.length,
                copiedEmails: [],
                missingEmails,
            };
        }
        const formatted = (0, tokenExportFormatter_1.formatTokens)(entries, format);
        await vscode.env.clipboard.writeText(formatted);
        // Security auto-clear clipboard timer if configured
        const clearSeconds = vscode.workspace.getConfiguration('ag-switchboard').get('tokenExport.clearClipboardSeconds', 0);
        if (clearSeconds > 0) {
            setTimeout(async () => {
                try {
                    const current = await vscode.env.clipboard.readText();
                    if (current === formatted) {
                        await vscode.env.clipboard.writeText('');
                        vscode.window.showInformationMessage((0, i18n_1.t)('notify.clipboardCleared'));
                    }
                }
                catch { /* ignore */ }
            }, clearSeconds * 1000);
        }
        // Summary notification
        if (entries.length === 1 && missingEmails.length === 0) {
            vscode.window.showInformationMessage((0, i18n_1.t)('notify.tokenCopied'));
        }
        else if (missingEmails.length === 0) {
            vscode.window.showInformationMessage((0, i18n_1.t)('notify.tokensCopied', { count: entries.length }));
        }
        else {
            vscode.window.showWarningMessage((0, i18n_1.t)('export.partial', { copied: entries.length, missing: missingEmails.length }));
        }
        return {
            total: targets.length,
            copiedCount: entries.length,
            missingCount: missingEmails.length,
            copiedEmails,
            missingEmails,
        };
    }
    // ── Workspace Cascade Ownership ────────────────────────────
    /** Shared helper: resolve server + fetch cascade trajectory summaries */
    async fetchCascadeSummaries() {
        const server = await this.resolveServer();
        if (!server)
            return null;
        const resp = await (0, lsClient_1.callLsJson)(server, 'GetAllCascadeTrajectories', {});
        const sums = resp?.trajectorySummaries;
        return (sums && typeof sums === 'object') ? sums : null;
    }
    /**
     * Fetch all cascade IDs belonging to this workspace.
     * Uses GetAllCascadeTrajectories from the workspace LS — only returns cascades
     * that are associated with this workspace, enabling cross-window isolation.
     */
    async getWorkspaceCascadeIds() {
        try {
            const sums = await this.fetchCascadeSummaries();
            if (!sums)
                return null;
            const ids = new Set(Object.keys(sums));
            return ids.size > 0 ? ids : null;
        }
        catch (e) {
            log.info(`getWorkspaceCascadeIds: ${e?.message}`);
            return null;
        }
    }
    /**
     * Query the LS for all cascade trajectories and return the most recently
     * modified cascade ID. USS-independent — works even when USS topics are cold.
     */
    async getMostRecentCascadeId() {
        try {
            const sums = await this.fetchCascadeSummaries();
            if (!sums)
                return null;
            let best = null;
            for (const [id, summary] of Object.entries(sums)) {
                const t = Number(summary?.lastModifiedTime) || 0;
                if (!best || t > best.time)
                    best = { id, time: t };
            }
            return best?.id ?? null;
        }
        catch (e) {
            log.diag(`getMostRecentCascadeId: ${e?.message}`);
            return null;
        }
    }
    // ── Private Helpers ─────────────────────────────────────────
    /** Workspace ID matching LS --workspace_id format: slashes+hyphens → underscores */
    getWorkspaceId() {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0)
            return undefined;
        const uri = folders[0].uri;
        if (uri.scheme === 'file') {
            return 'file_' + uri.path.replace(/\//g, '_').replace(/^_/, '').replace(/-/g, '_');
        }
        return uri.toString().replace(/[/:\-]/g, '_');
    }
    /** Delegate to EmailResolver */
    async getActiveEmail() {
        return this.emailResolver.getActiveEmail();
    }
    updateStatusBar(data) {
        this.statusBar.update(data, this.getSelectedModels());
    }
    /** Diagnostic probe: log raw LS remainingFraction per model (only in diag mode) */
    logQuotaFractions(data) {
        const configs = data.userStatus?.cascadeModelConfigData?.clientModelConfigs;
        if (!configs)
            return;
        const fracs = configs
            .filter((m) => m.quotaInfo?.remainingFraction !== undefined)
            .map((m) => `${m.label || '?'}=${m.quotaInfo.remainingFraction}`);
        if (fracs.length > 0)
            log.diag(`quota fractions: [${fracs.join(', ')}]`);
    }
}
exports.QuotaManager = QuotaManager;
//# sourceMappingURL=quotaManager.js.map