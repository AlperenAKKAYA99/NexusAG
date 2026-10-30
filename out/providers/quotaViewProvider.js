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
exports.QuotaViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const webviewTemplate_1 = require("../templates/webviewTemplate");
const usage_components_1 = require("../shared/usage-components");
const logger_1 = require("../utils/logger");
const i18n_1 = require("../i18n");
const usageStatsPanel_1 = require("./usageStatsPanel");
const contextDetailPanel_1 = require("./contextDetailPanel");
const log = (0, logger_1.createLogger)('ViewProvider');
class QuotaViewProvider {
    extensionUri;
    quotaManager;
    accountManager;
    convGuard;
    _view;
    constructor(extensionUri, quotaManager, accountManager, convGuard) {
        this.extensionUri = extensionUri;
        this.quotaManager = quotaManager;
        this.accountManager = accountManager;
        this.convGuard = convGuard;
    }
    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri],
        };
        webviewView.webview.onDidReceiveMessage(async (msg) => {
            switch (msg.type) {
                case 'weblog':
                    log.info(`[WEBVIEW_LOG] ${msg.msg}`);
                    break;
                case 'ready':
                    log.info('MSG: ready received');
                    // Push active locale and translations to webview
                    this.pushLocale((0, i18n_1.getLocale)(), (0, i18n_1.getTranslations)());
                    // Instant: push whatever is in memory RIGHT NOW (0ms, no network)
                    this.quotaManager.pushCachedData();
                    // Then silently fetch fresh quota in background.
                    // Without this, a re-opened panel shows stale data until the
                    // next 60s webview timer tick (retainContextWhenHidden is off).
                    this.quotaManager.refresh();
                    break;
                case 'refresh':
                    this.quotaManager.refresh(undefined, msg.manual === true);
                    break;
                case 'setRefreshMode':
                    this.quotaManager.setLiveMode(msg.mode === 'live');
                    break;
                case 'refreshTokenOnly':
                    this.quotaManager.refreshTokenOnly();
                    break;
                case 'openFile': {
                    const wsRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
                    if (!wsRoot || !msg.path)
                        break;
                    const isSkillDir = /^\.agent\/skills\/[^/]+$/.test(msg.path);
                    const filePath = isSkillDir ? msg.path + '/SKILL.md' : msg.path;
                    try {
                        const doc = await vscode.workspace.openTextDocument(vscode.Uri.joinPath(wsRoot, filePath));
                        await vscode.window.showTextDocument(doc, { preview: true });
                    }
                    catch {
                        // Fallback: try without SKILL.md suffix
                        const fallbackDoc = await vscode.workspace.openTextDocument(vscode.Uri.joinPath(wsRoot, msg.path));
                        await vscode.window.showTextDocument(fallbackDoc, { preview: true });
                    }
                    break;
                }
                case 'toggleModel':
                    await this.quotaManager.toggleStatusBarModel(msg.modelId, msg.isVisible);
                    break;
                case 'setPinnedModel': {
                    // Persist pin state in globalState so it survives panel reload & extension restart
                    const pins = this.quotaManager.getPinnedModels();
                    if (msg.modelId) {
                        pins[msg.accountKey] = msg.modelId;
                    }
                    else {
                        delete pins[msg.accountKey];
                    }
                    await this.quotaManager.setPinnedModels(pins);
                    // Push confirmed pin state back to webview immediately.
                    // Without this, the next auto-refresh could overwrite the
                    // webview's in-memory pinnedModels with stale globalState data
                    // if the refresh started before the save completed.
                    this.quotaManager.pushCachedData();
                    break;
                }
                case 'addAccount':
                    vscode.commands.executeCommand('ag.addAccount');
                    break;
                case 'addAccountByToken':
                    vscode.commands.executeCommand('ag.addAccountByToken');
                    break;
                case 'addAccountsByTokens': {
                    const tokens = Array.isArray(msg.tokens) ? msg.tokens : [];
                    const result = await this.accountManager.addAccountsByTokens(tokens);
                    this._view?.webview.postMessage({
                        type: 'tokensProcessed',
                        result,
                    });
                    break;
                }
                case 'removeAccount':
                    vscode.commands.executeCommand('ag.removeAccount', msg.accountId);
                    break;
                case 'switchAccount':
                    this.quotaManager.switchAccount(msg.accountId).catch(e => log.error('switchAccount unhandled:', e?.message || e));
                    break;
                case 'copyToken':
                    this.quotaManager.copyToken(msg.accountId);
                    break;
                case 'editAccountLabel': {
                    const email = msg.email;
                    if (!email)
                        break;
                    const currentLabel = this.accountManager.getAccountLabel(email) || '';
                    const newLabel = await vscode.window.showInputBox({
                        title: (0, i18n_1.t)('accounts.setLabelTitle'),
                        prompt: (0, i18n_1.t)('accounts.setLabelPrompt'),
                        value: currentLabel,
                        placeHolder: (0, i18n_1.t)('accounts.setLabelPlaceholder'),
                        validateInput: (val) => {
                            if (val.trim().length > 40)
                                return 'Label is too long (max 40 characters)';
                            return null;
                        },
                    });
                    if (newLabel !== undefined) {
                        await this.accountManager.setAccountLabel(email, newLabel.trim());
                        this.quotaManager.pushCachedData();
                    }
                    break;
                }
                case 'openUsagePanel':
                    vscode.commands.executeCommand('ag.openUsageStats');
                    break;
                case 'openContextDetail':
                    vscode.commands.executeCommand('ag.openContextDetail');
                    break;
                case 'setUsageRange':
                    this.handleUsageRange(msg.range);
                    break;
                case 'fixConversations':
                    vscode.commands.executeCommand('ag.fixConversations');
                    break;
                case 'dismissConvFix':
                    if (this.convGuard)
                        this.convGuard.dismiss();
                    break;
                case 'changeLocale':
                    if (msg.locale) {
                        (0, i18n_1.setLocale)(msg.locale);
                        vscode.workspace.getConfiguration('ag-switchboard')
                            .update('language', msg.locale, vscode.ConfigurationTarget.Global);
                        this.pushLocale((0, i18n_1.getLocale)(), (0, i18n_1.getTranslations)());
                        usageStatsPanel_1.UsageStatsPanel.currentPanel?.refreshLocale();
                        contextDetailPanel_1.ContextDetailPanel.currentPanel?.refreshLocale();
                        this.quotaManager.pushCachedData();
                    }
                    break;
            }
        });
        // Refresh quota when panel becomes visible again after being hidden.
        // The webview timer dies when the panel is collapsed (retainContextWhenHidden
        // is not set for sidebar views), so cached data can go stale.
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                log.info('panel re-shown → refreshing');
                this.quotaManager.pushCachedData();
                this.quotaManager.refresh();
            }
        });
        webviewView.webview.html = (0, webviewTemplate_1.getWebviewContent)(webviewView.webview, this.extensionUri);
    }
    setLoading() {
        this._view?.webview.postMessage({ type: 'loading' });
    }
    setError(message) {
        this._view?.webview.postMessage({ type: 'error', message });
    }
    updateData(state) {
        this._view?.webview.postMessage({
            type: 'update',
            accountCards: state.accountCards,
            pinnedModels: state.pinnedModels,
            tokenBase: state.tokenBase,
            workspaceContext: state.workspaceContext,
            usageStats: state.usageStats,
            contextWindow: null,
            pricing: (0, usage_components_1.getPricing)(),
        });
    }
    /** Push context window data to webview (separate from main update) */
    postContextWindow(data) {
        this._view?.webview.postMessage({
            type: 'contextWindowUpdate',
            data,
        });
    }
    /** Generic message passthrough to webview */
    postMessage(msg) {
        this._view?.webview.postMessage(msg);
    }
    /** Push locale and translation dictionary to webview */
    pushLocale(locale, translations) {
        this.postMessage({
            type: 'setLocale',
            locale,
            translations,
        });
    }
    handleUsageRange(range) {
        this.quotaManager.setUsageRange(range);
        const filtered = this.quotaManager.getFilteredUsageStats(range);
        if (filtered) {
            this._view?.webview.postMessage({
                type: 'usageStatsUpdate',
                usageStats: filtered,
                pricing: (0, usage_components_1.getPricing)(),
            });
        }
    }
}
exports.QuotaViewProvider = QuotaViewProvider;
//# sourceMappingURL=quotaViewProvider.js.map