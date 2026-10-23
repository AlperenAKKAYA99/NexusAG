import * as vscode from 'vscode';
import { EXTENSION_VERSION, BUILD_TAG } from '../version';

/**
 * Generate a random nonce for Content Security Policy.
 */
function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

/**
 * Assembles the full webview HTML with:
 * - CSP (Content Security Policy) with nonce
 * - External CSS via <link> (loaded from out/webview/panel.css)
 * - External JS via <script> (loaded from out/webview/panel.js)
 * 
 * HTML skeleton only — all CSS is in panel.css, all JS in panel.js (esbuild bundle).
 */
export function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    // Get URIs for external resources
    const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'panel.js')
    );
    const styleUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'panel.css')
    );
    const faStyleUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'css', 'all.css')
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'none';
                   style-src ${webview.cspSource} 'unsafe-inline';
                   script-src ${webview.cspSource} 'nonce-${nonce}';
                   font-src ${webview.cspSource} data:;">
    <link rel="stylesheet" href="${faStyleUri}">
    <link rel="stylesheet" href="${styleUri}">
    <title>Quota Radar</title>
</head>
<body>
    <div id="loading" class="loader" style="display: block;">
        <div class="init-screen">
            <div class="radar-wrap">
                <div class="radar-ring r1"></div>
                <div class="radar-ring r2"></div>
                <div class="radar-ring r3"></div>
                <div class="radar-core"></div>
            </div>
            <div class="init-title" data-i18n="init.title">NexusAG</div>
            <div class="init-status" data-i18n="init.connecting">Connecting to Antigravity...</div>
            <div class="init-dots">
                <span class="idot d1"></span>
                <span class="idot d2"></span>
                <span class="idot d3"></span>
            </div>
        </div>
    </div>
    <div id="error" class="err-msg"></div>

    <div id="content" class="hidden">
        <!-- Tab Bar -->
        <div class="tab-bar">
            <button class="tab-btn active" data-action="switch-tab" data-tab="accounts">
                <i class="fa-solid fa-users tab-icon"></i>
                <span data-i18n="tabs.accounts">Accounts</span>
            </button>
            <button class="tab-btn" data-action="switch-tab" data-tab="tokens">
                <i class="fa-solid fa-chart-pie tab-icon"></i>
                <span data-i18n="tabs.tokenBudget">Token Budget</span>
            </button>
            <button class="tab-btn" data-action="switch-tab" data-tab="usage">
                <i class="fa-solid fa-chart-column tab-icon"></i>
                <span data-i18n="tabs.usageStats">Usage Stats</span>
            </button>
        </div>

        <!-- Tab 1: Accounts -->
        <div id="tab-accounts" class="tab-content active">
            <!-- Conversation Guard Banner (hidden by default) -->
            <div id="convGuardBanner" class="conv-guard-banner hidden"></div>
            <!-- Summary Strip -->
            <div class="summary-strip">
                <div class="summary-left" id="summaryLeft">
                    <div class="health-bar-wrap" id="healthBarWrap" data-i18n-title="accounts.overallCapacity" title="Overall Quota Capacity">
                        <div class="health-bar-track">
                            <div class="health-bar-fill g" id="healthBarFill" style="width: 0%;"></div>
                        </div>
                        <span class="health-pct g" id="healthPct">--%</span>
                    </div>
                    <span class="summary-sep">·</span>
                    <span class="summary-label" id="summaryLabel" data-i18n="common.loading">Loading...</span>
                </div>
                <div class="summary-right">
                    <button class="s-btn" id="refreshBtn" data-i18n-title="common.refresh" title="Refresh" data-action="refresh">
                        <i class="fa-solid fa-arrows-rotate"></i>
                    </button>
                    <button class="s-btn" data-i18n-title="accounts.copyTokens" title="Copy Tokens" data-action="open-token-export">
                        <i class="fa-solid fa-copy"></i>
                    </button>
                    <button class="s-btn" data-i18n-title="accounts.addViaToken" title="Add via Token" data-action="add-account-by-token">
                        <i class="fa-solid fa-key"></i>
                    </button>
                    <button class="s-btn" data-i18n-title="accounts.addAccount" title="Add Account" data-action="add-account">
                        <i class="fa-solid fa-user-plus"></i>
                    </button>
                </div>
            </div>

            <!-- Account List -->
            <div class="account-list" id="accountList"></div>

            <!-- Add Account -->
            <div class="add-area">
                <button class="add-btn" data-action="add-account">
                    <i class="fa-solid fa-user-plus"></i>
                    <span data-i18n="accounts.addAccount">Add Account</span>
                </button>
                <button class="add-btn" data-action="add-account-by-token">
                    <i class="fa-solid fa-key"></i>
                    <span data-i18n="accounts.addViaToken">Add via Token</span>
                </button>
                <button class="add-btn" data-action="open-token-export">
                    <i class="fa-solid fa-copy"></i>
                    <span data-i18n="accounts.copyTokens">Copy Tokens</span>
                </button>
            </div>
        </div>

        <!-- Tab 2: Token Budget -->
        <div id="tab-tokens" class="tab-content">
            <!-- Token tab refresh strip -->
            <div class="token-strip">
                <span class="token-strip-label" data-i18n="tokens.contextBudget">Context Budget</span>
                <button class="s-btn" id="tokenRefreshBtn" data-i18n-title="tokens.refreshTokenBudget" title="Refresh token budget" data-action="refresh-token-only">
                    <i class="fa-solid fa-arrows-rotate"></i>
                </button>
            </div>
            <div class="token-scroll">
                <div id="tokenContent" class="token-tab">
                    <div class="token-empty">
                        <div class="em-icon"><i class="fa-solid fa-chart-pie"></i></div>
                        <div class="em-title" data-i18n="tokens.tokenDataLoading">Token data loading...</div>
                    </div>
                </div>
                <!-- Active Context Window -->
                <div id="contextWindowContent" class="ctx-window-wrap"></div>
                <!-- Workspace Context: .agent/ & .agents/ items from LS index (not filesystem) -->
                <div class="wc-section">
                    <div class="wc-section-hdr">
                        <span class="wc-section-icon"><i class="fa-solid fa-folder-tree"></i></span>
                        <span class="wc-section-label" data-i18n="workspace.workspaceContext">Workspace Context</span>
                        <span class="wc-section-badge">.agent(s)/</span>
                    </div>
                    <div id="workspaceContextContent" class="wc-content">
                        <div class="wc-empty" data-i18n="workspace.loadingContext">Loading workspace context...</div>
                    </div>
                </div>
            </div>
        </div>


        <!-- Tab 3: Usage Stats -->
        <div id="tab-usage" class="tab-content">
            <div class="token-strip">
                <span class="token-strip-label" data-i18n="usage.sessionTokenUsage">Session Token Usage</span>
                <button class="s-btn" id="usageRefreshBtn" data-i18n-title="usage.refreshUsageStats" title="Refresh usage stats" data-action="refresh-usage-only">
                    <i class="fa-solid fa-arrows-rotate"></i>
                </button>
            </div>
            <div class="token-scroll">
                <div id="usageContent" class="usage-tab">
                    <div class="token-empty">
                        <div class="em-icon"><i class="fa-solid fa-chart-column"></i></div>
                        <div class="em-title" data-i18n="usage.usageDataLoading">Usage data loading...</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tab 4: Settings -->
        <div id="tab-settings" class="tab-content">
            <div class="settings-strip">
                <button class="s-btn settings-back-btn" data-action="back-from-settings" data-i18n-title="common.back" title="Back">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <span class="settings-strip-label" data-i18n="settings.title">Settings</span>
            </div>
            <div class="settings-scroll">
                <!-- Section: Language -->
                <div class="settings-section">
                    <div class="settings-section-hdr">
                        <i class="fa-solid fa-globe"></i>
                        <span data-i18n="settings.language">Language</span>
                    </div>
                    <div class="settings-card">
                        <div class="settings-card-hdr">
                            <div class="settings-card-icon" style="background: rgba(168, 85, 247, 0.12); color: #a855f7;">
                                <i class="fa-solid fa-language"></i>
                            </div>
                            <div class="settings-card-info">
                                <div class="settings-card-title" data-i18n="settings.language">Language</div>
                                <div class="settings-card-desc" data-i18n="settings.languageDesc">
                                    Choose the display language for NexusAG interface.
                                </div>
                            </div>
                        </div>
                        <div class="settings-card-action">
                            <div class="lang-grid" id="langGrid"></div>
                        </div>
                    </div>
                </div>

                <!-- Section: Auto-Refresh Schedule -->
                <div class="settings-section">
                    <div class="settings-section-hdr">
                        <i class="fa-solid fa-arrows-rotate"></i>
                        <span data-i18n="settings.autoRefresh">Auto-Refresh Schedule</span>
                    </div>
                    <div class="settings-card">
                        <div class="settings-card-hdr">
                            <div class="settings-card-icon" style="background: rgba(56, 189, 248, 0.12); color: #38bdf8;">
                                <i class="fa-solid fa-clock"></i>
                            </div>
                            <div class="settings-card-info">
                                <div class="settings-card-title" data-i18n="settings.refreshInterval">Refresh Interval</div>
                                <div class="settings-card-desc" data-i18n="settings.refreshIntervalDesc">
                                    Choose how frequently quota data and token budgets are automatically updated in the background.
                                </div>
                            </div>
                        </div>
                        <div class="settings-card-action settings-interval-action">
                            <div class="interval-pick">
                                <button class="iv-btn" data-ms="live" data-action="set-interval" data-i18n-title="settings.instantTooltip" title="Instant (Live): Triggers immediately when model generates a response, zero quota cost">
                                    <i class="fa-solid fa-bolt"></i><span data-i18n="settings.instant">Instant</span>
                                </button>
                                <button class="iv-btn" data-ms="30000" data-action="set-interval">30s</button>
                                <button class="iv-btn active" data-ms="60000" data-action="set-interval">1m</button>
                                <button class="iv-btn" data-ms="120000" data-action="set-interval">2m</button>
                                <button class="iv-btn" data-ms="300000" data-action="set-interval">5m</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section: Maintenance & Repair -->
                <div class="settings-section">
                    <div class="settings-section-hdr">
                        <i class="fa-solid fa-screwdriver-wrench"></i>
                        <span data-i18n="settings.maintenance">Maintenance & Repair</span>
                    </div>
                    <div class="settings-card">
                        <div class="settings-card-hdr">
                            <div class="settings-card-icon">
                                <i class="fa-solid fa-clock-rotate-left"></i>
                            </div>
                            <div class="settings-card-info">
                                <div class="settings-card-title" data-i18n="settings.fixConversations">Fix Missing Conversations</div>
                                <div class="settings-card-desc" data-i18n="settings.fixConversationsDesc">
                                    Scans local conversation storage (.pb) on disk and reconciles missing records into the IDE sidebar index.
                                </div>
                            </div>
                        </div>
                        <div class="settings-card-action">
                            <button class="settings-btn-primary" data-action="fix-conversations">
                                <i class="fa-solid fa-wrench"></i>
                                <span data-i18n="settings.scanRepair">Scan & Repair</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Section: Switchboard Info -->
                <div class="settings-section">
                    <div class="settings-section-hdr">
                        <i class="fa-solid fa-circle-info"></i>
                        <span data-i18n="settings.aboutNexus">About NexusAG</span>
                    </div>
                    <div class="settings-card settings-about-card">
                        <div class="settings-row">
                            <span class="settings-label" data-i18n="settings.extension">Extension</span>
                            <span class="settings-val">NexusAG</span>
                        </div>
                        <div class="settings-row">
                            <span class="settings-label" data-i18n="settings.version">Version</span>
                            <span class="settings-val">v${EXTENSION_VERSION} <span class="build-tag">${BUILD_TAG}</span></span>
                        </div>
                        <div class="settings-row">
                            <span class="settings-label" data-i18n="settings.fontAwesome">Font Awesome</span>
                            <span class="settings-val">7.3.1 Pro</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="foot">
            <div class="foot-meta">
                <span id="lastUpdated">—</span>
                <span class="build-tag">${BUILD_TAG}</span>
            </div>
            <div class="foot-controls">
                <!-- Fix Missing Conversations: PRESERVED intact, hidden per user instruction -->
                <button class="s-btn foot-util" id="fixConversationsBtn" data-i18n-title="settings.fixConversations" title="Fix Missing Conversations" data-action="fix-conversations" style="display: none;">
                    <i class="fa-solid fa-screwdriver-wrench"></i>
                </button>
                <button class="s-btn foot-util" id="settingsBtn" data-i18n-title="settings.title" title="Settings" data-action="open-settings">
                    <i class="fa-solid fa-gear"></i>
                </button>
            </div>
        </div>
    </div>

    <!-- Add Accounts via Token Modal -->
    <div id="tokenModal" class="ag-modal-backdrop hidden" style="display:none">
        <div class="ag-modal">
            <div class="ag-modal-header">
                <div class="ag-modal-title">
                    <i class="fa-solid fa-key"></i>
                    <span data-i18n="modal.addViaToken">Add Accounts via Token</span>
                </div>
                <button class="ag-modal-close" data-action="close-token-modal" data-i18n-title="modal.closeEsc" title="Close (Esc)">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="ag-modal-body">
                <p class="ag-modal-desc" data-i18n="modal.pasteTokens">
                    Paste one or more refresh tokens below (one per line):
                </p>
                <div class="ag-textarea-wrap">
                    <textarea
                        id="tokenInputArea"
                        class="ag-textarea"
                        rows="7"
                        placeholder="1//0eAAA...&#10;1//0eBBB...&#10;1//0eCCC..."
                        spellcheck="false"
                        autocomplete="off"
                        autocapitalize="off"
                    ></textarea>
                    <div class="ag-token-counter">
                        <span id="tokenCounter" data-i18n="modal.tokensDetected_zero">0 tokens detected</span>
                        <span class="ag-token-hint" data-i18n="modal.ctrlEnter">Ctrl+Enter to submit</span>
                    </div>
                </div>
                <div id="tokenModalStatus" class="ag-modal-status" style="display:none"></div>
            </div>
            <div class="ag-modal-footer">
                <button class="ag-modal-btn ag-btn-secondary" data-action="close-token-modal" data-i18n="common.cancel">Cancel</button>
                <button class="ag-modal-btn ag-btn-primary" id="submitTokensBtn" data-action="submit-tokens" disabled>
                    <i class="fa-solid fa-plus"></i>
                    <span data-i18n="modal.addAccounts">Add Accounts</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Copy Accounts Tokens Modal -->
    <div id="tokenExportModal" class="ag-modal-backdrop hidden" style="display:none">
        <div class="ag-modal ag-export-modal">
            <div class="ag-modal-header">
                <div class="ag-modal-title">
                    <i class="fa-solid fa-copy"></i>
                    <span data-i18n="export.title">Copy Account Tokens</span>
                </div>
                <button class="ag-modal-close" data-action="close-token-export" data-i18n-title="modal.closeEsc" title="Close (Esc)">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="ag-modal-body">
                <p class="ag-modal-desc" data-i18n="export.desc">
                    Select accounts to copy refresh tokens to clipboard:
                </p>

                <!-- Filter shortcuts -->
                <div class="ag-export-tools">
                    <span class="ag-export-tools-label" data-i18n="common.items">Select:</span>
                    <button class="ag-filter-pill" data-action="export-select-all" data-i18n="export.selectAll">All</button>
                    <button class="ag-filter-pill" data-action="export-select-none" data-i18n="export.selectNone">None</button>
                    <button class="ag-filter-pill" data-action="export-select-healthy" data-i18n="export.selectHealthy">Healthy</button>
                </div>

                <!-- Account Checkbox List -->
                <div class="ag-export-list" id="exportAccountList"></div>

                <!-- Format selector -->
                <div class="ag-format-section">
                    <div class="ag-format-hdr">
                        <span data-i18n="export.format">Format</span>
                    </div>
                    <div class="ag-format-pills">
                        <button class="ag-format-btn active" data-action="set-export-format" data-format="plain" data-i18n="export.formatPlain">Plain</button>
                        <button class="ag-format-btn" data-action="set-export-format" data-format="labeled" data-i18n="export.formatLabeled">Labeled</button>
                        <button class="ag-format-btn" data-action="set-export-format" data-format="json" data-i18n="export.formatJson">JSON</button>
                    </div>
                </div>

                <div class="ag-token-counter">
                    <span id="exportCounter">0 accounts selected</span>
                    <span class="ag-token-hint" data-i18n="modal.ctrlEnter">Ctrl+Enter to copy</span>
                </div>

                <div id="exportModalStatus" class="ag-modal-status" style="display:none"></div>
            </div>
            <div class="ag-modal-footer">
                <button class="ag-modal-btn ag-btn-secondary" data-action="close-token-export" data-i18n="common.cancel">Cancel</button>
                <button class="ag-modal-btn ag-btn-primary" id="submitExportBtn" data-action="submit-token-export">
                    <i class="fa-solid fa-copy"></i>
                    <span data-i18n="export.copy_one">Copy</span>
                </button>
            </div>
        </div>
    </div>

    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}
