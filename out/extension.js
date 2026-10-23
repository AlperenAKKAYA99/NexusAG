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
exports.activate = activate;
const vscode = __importStar(require("vscode"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const accountManager_1 = require("./managers/accountManager");
const quotaManager_1 = require("./managers/quotaManager");
const quotaViewProvider_1 = require("./providers/quotaViewProvider");
const usageStatsPanel_1 = require("./providers/usageStatsPanel");
const contextDetailPanel_1 = require("./providers/contextDetailPanel");
const usage_components_1 = require("./shared/usage-components");
const litellmPricing_1 = require("./services/litellmPricing");
const conversationTracker_1 = require("./services/conversationTracker");
const conversationGuard_1 = require("./services/conversationGuard");
const lsClient_1 = require("./utils/lsClient");
const logger_1 = require("./utils/logger");
const i18n_1 = require("./i18n");
const log = (0, logger_1.createLogger)('Extension');
async function activate(context) {
    // Initialize OutputChannel logger FIRST — all modules use this
    (0, logger_1.initLogger)(context);
    // --- i18n Initialization: Detect system locale or restore saved ---
    const langSetting = vscode.workspace.getConfiguration('ag-switchboard').get('language') || 'auto';
    const savedLocale = langSetting !== 'auto' ? langSetting : context.globalState.get('nexusag.locale');
    (0, i18n_1.initI18n)(savedLocale || undefined);
    log.info(`i18n initialized: locale=${(0, i18n_1.getLocale)()}`);
    // Use OS temp dir so file sinks work on Windows too
    const tmpDir = os.tmpdir();
    (0, logger_1.setFileSink)(path.join(tmpDir, 'ag-panel.log'));
    (0, logger_1.setDiagSink)(path.join(tmpDir, 'ag-ctx-diag.log'));
    // --- Boot managers ---
    const accountManager = new accountManager_1.AccountManager(context);
    accountManager.initialize();
    const quotaManager = new quotaManager_1.QuotaManager(context, accountManager);
    // Non-blocking USS API check
    quotaManager.getSwitchService().testApiAccess().then(ok => {
        log.info(`USS API: ${ok ? '✅ available' : '❌ not available'}`);
    });
    // Start reactive conversation tracker (USS topics)
    const tracker = new conversationTracker_1.ConversationTracker(quotaManager, context);
    tracker.start();
    context.subscriptions.push(tracker);
    log.info('Extension activated');
    // --- Load model pricing from settings ---
    applyPricingFromSettings();
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('ag-switchboard.modelPricing')) {
            applyPricingFromSettings();
            log.info('Model pricing updated from settings');
        }
    }));
    // --- LiteLLM dynamic pricing (non-blocking, fire-and-forget) ---
    (0, litellmPricing_1.initPricingCatalog)().then(() => {
        (0, usage_components_1.setExternalPricingResolver)((displayName) => {
            const resolved = (0, litellmPricing_1.resolveLiteLlmPricing)(displayName);
            if (!resolved)
                return null;
            // Convert per-token to per-1M-token for compatibility with hardcoded pricing table
            return {
                input: resolved.inputCostPerToken * 1e6,
                output: resolved.outputCostPerToken * 1e6,
                cache: (resolved.cacheReadCostPerToken ?? resolved.inputCostPerToken * 0.1) * 1e6,
                reasoning: (resolved.reasoningCostPerToken ?? resolved.outputCostPerToken) * 1e6,
            };
        });
        log.info('LiteLLM dynamic pricing resolver registered');
    }).catch(() => { });
    // --- Conversation Guard (Fix Missing Conversations) ---
    const convGuard = new conversationGuard_1.ConversationGuard(context);
    context.subscriptions.push(convGuard);
    quotaManager.setConversationGuard(convGuard);
    // --- Register webview provider ---
    const viewProvider = new quotaViewProvider_1.QuotaViewProvider(context.extensionUri, quotaManager, accountManager, convGuard);
    quotaManager.setViewProvider(viewProvider);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('ag.quotaView', viewProvider));
    // --- Language change listener from settings ---
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('ag-switchboard.language')) {
            const setting = vscode.workspace.getConfiguration('ag-switchboard').get('language') || 'auto';
            if (setting === 'auto') {
                (0, i18n_1.initI18n)();
            }
            else {
                (0, i18n_1.setLocale)(setting);
            }
            context.globalState.update('nexusag.locale', (0, i18n_1.getLocale)());
            viewProvider.pushLocale((0, i18n_1.getLocale)(), (0, i18n_1.getTranslations)());
            usageStatsPanel_1.UsageStatsPanel.currentPanel?.refreshLocale();
            contextDetailPanel_1.ContextDetailPanel.currentPanel?.refreshLocale();
            log.info(`Language setting changed → ${(0, i18n_1.getLocale)()}`);
        }
    }));
    // --- Register commands ---
    context.subscriptions.push(vscode.commands.registerCommand('ag.refreshQuota', () => quotaManager.refresh()), vscode.commands.registerCommand('ag.addAccount', async () => {
        const success = await accountManager.addAccount();
        if (success) {
            vscode.window.showInformationMessage((0, i18n_1.t)('notify.accountAddedSuccess'));
            quotaManager.refresh();
        }
        else {
            vscode.window.showWarningMessage((0, i18n_1.t)('notify.accountLoginFailed'));
        }
    }), vscode.commands.registerCommand('ag.removeAccount', async (accountId) => {
        const account = accountManager.getAccounts().find(a => a.id === accountId);
        if (!account)
            return;
        const removeBtn = (0, i18n_1.t)('common.remove');
        const confirm = await vscode.window.showWarningMessage((0, i18n_1.t)('notify.removeConfirm', { email: account.email }), { modal: true }, removeBtn);
        if (confirm === removeBtn) {
            await accountManager.removeAccount(accountId);
            quotaManager.refresh();
        }
    }), vscode.commands.registerCommand('ag.addAccountByToken', async () => {
        const success = await accountManager.addAccountByToken();
        if (success) {
            quotaManager.refresh();
        }
    }), vscode.commands.registerCommand('ag.copyTokens', async () => {
        const accounts = accountManager.getAccounts();
        if (accounts.length === 0) {
            vscode.window.showWarningMessage((0, i18n_1.t)('export.noneFound'));
            return;
        }
        const items = accounts.map(a => ({
            id: a.id,
            label: `$(account) ${a.email}`,
            description: a.name !== a.email ? a.name : undefined,
            picked: true,
        }));
        const selected = await vscode.window.showQuickPick(items, {
            title: (0, i18n_1.t)('export.title'),
            placeHolder: (0, i18n_1.t)('export.desc'),
            canPickMany: true,
            ignoreFocusOut: true,
        });
        if (!selected || selected.length === 0)
            return;
        // Format QuickPick
        const formatItems = [
            { id: 'plain', label: (0, i18n_1.t)('export.formatPlain'), description: '1//0eAAA...\n1//0eBBB...' },
            { id: 'labeled', label: (0, i18n_1.t)('export.formatLabeled'), description: '# user@example.com\n1//0eAAA...' },
            { id: 'json', label: (0, i18n_1.t)('export.formatJson'), description: '[ { "email": "...", "refresh_token": "..." } ]' },
        ];
        const defaultFormat = vscode.workspace.getConfiguration('ag-switchboard').get('tokenExport.defaultFormat', 'plain');
        const chosenFormatItem = await vscode.window.showQuickPick(formatItems, {
            title: (0, i18n_1.t)('export.format'),
            placeHolder: formatItems.find(f => f.id === defaultFormat)?.label || formatItems[0].label,
            ignoreFocusOut: true,
        });
        const chosenFormat = (chosenFormatItem?.id || defaultFormat);
        await quotaManager.copyTokens(selected.map(s => s.id), chosenFormat);
    }), vscode.commands.registerCommand('ag.openUsageStats', () => {
        usageStatsPanel_1.UsageStatsPanel.createOrShow(context.extensionUri, quotaManager.getLastUsageStats());
        if (usageStatsPanel_1.UsageStatsPanel.currentPanel) {
            usageStatsPanel_1.UsageStatsPanel.currentPanel.onRangeFilter = (range) => quotaManager.getFilteredUsageStats(range);
        }
    }), vscode.commands.registerCommand('ag.openContextDetail', async () => {
        const serverInfo = await quotaManager.getServerInfo();
        // Show panel immediately with cached data (instant open)
        const cachedCw = quotaManager.getLastContextWindow();
        contextDetailPanel_1.ContextDetailPanel.createOrShow(context.extensionUri, cachedCw, serverInfo);
        // Then trigger a fresh fetch to get the latest context window
        const cascadeId = quotaManager.getActiveConversationId();
        if (cascadeId) {
            quotaManager.fetchContextWindowOnce(cascadeId);
        }
    }), vscode.commands.registerCommand('ag.fixConversations', async () => {
        const status = await convGuard.detect();
        const count = status?.missing ?? 0;
        const msg = count > 0
            ? (0, i18n_1.t)('notify.convMissingFound', { count: String(count) })
            : (0, i18n_1.t)('notify.noMissingConv');
        const detail = (0, i18n_1.t)('notify.convFixDetail');
        const fixNowBtn = (0, i18n_1.t)('convGuard.fixNow');
        const confirm = await vscode.window.showWarningMessage(msg, { modal: true, detail }, fixNowBtn);
        if (confirm === fixNowBtn)
            convGuard.runFix();
    }));
    // --- React to account changes ---
    accountManager.onDidChange(() => quotaManager.refresh());
    // --- Start delayed conversation detection ---
    convGuard.startDelayedDetection();
    convGuard.onStatusChange(async (status) => {
        if (status.missing > 0 && !convGuard.isDismissed()) {
            // Try to get LS titles (highest fidelity) — graceful fallback if unavailable
            let lsTitles;
            try {
                const si = await quotaManager.getServerInfo();
                if (si) {
                    // callLsJson imported at top level
                    const resp = await (0, lsClient_1.callLsJson)(si, 'GetAllCascadeTrajectories', {});
                    const sums = resp?.trajectorySummaries || {};
                    lsTitles = new Map();
                    for (const [id, v] of Object.entries(sums)) {
                        const val = v;
                        const title = val.summary || val.title || val.displayName || '';
                        if (title)
                            lsTitles.set(id, title);
                    }
                }
            }
            catch { /* LS unavailable — filesystem fallback */ }
            const details = convGuard.resolveMissingDetails(status.missingIds, lsTitles);
            viewProvider.postMessage({
                type: 'conversationStatus',
                onDisk: status.onDisk,
                inIndex: status.inIndex,
                missing: status.missing,
                details,
            });
        }
    });
}
function applyPricingFromSettings() {
    const cfg = vscode.workspace.getConfiguration('ag-switchboard');
    const overrides = cfg.get('modelPricing');
    if (overrides && typeof overrides === 'object') {
        (0, usage_components_1.updatePricing)(overrides);
    }
}
//# sourceMappingURL=extension.js.map