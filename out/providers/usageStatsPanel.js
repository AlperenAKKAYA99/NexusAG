"use strict";
/**
 * UsageStatsPanel — Full-width editor tab for deep analytics dashboard.
 * Opens as a WebviewPanel (editor tab) with time-range filtering.
 * Uses shared components from usage-components.ts for DRY rendering.
 *
 * CSS lives in panel.css (SSOT). Formatting via shared/helpers.ts (DRY).
 */
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
exports.UsageStatsPanel = void 0;
const vscode = __importStar(require("vscode"));
const logger_1 = require("../utils/logger");
const helpers_1 = require("../shared/helpers");
const usage_components_1 = require("../shared/usage-components");
const i18n_1 = require("../i18n");
const log = (0, logger_1.createLogger)('UsagePanel');
class UsageStatsPanel {
    static currentPanel;
    static viewType = 'ag.usageStatsPanel';
    panel;
    extensionUri;
    disposables = [];
    lastStats = null;
    currentRange = 'all';
    currentGridYear = new Date().getFullYear();
    currentMonthlyYear = new Date().getFullYear();
    /** Callback for range filter requests — set by the command registration */
    onRangeFilter;
    // ─── Lifecycle ───
    static createOrShow(extensionUri, stats) {
        (0, usage_components_1.setUsageTranslator)(i18n_1.t);
        const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;
        if (UsageStatsPanel.currentPanel) {
            UsageStatsPanel.currentPanel.panel.reveal(column);
            if (stats)
                UsageStatsPanel.currentPanel.updateStats(stats);
            return;
        }
        const panel = vscode.window.createWebviewPanel(UsageStatsPanel.viewType, (0, i18n_1.t)('dashboard.title'), column, { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [extensionUri] });
        UsageStatsPanel.currentPanel = new UsageStatsPanel(panel, extensionUri, stats);
    }
    constructor(panel, extensionUri, stats) {
        (0, usage_components_1.setUsageTranslator)(i18n_1.t);
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.lastStats = stats;
        this.panel.webview.html = this.buildHtml(stats);
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.panel.webview.onDidReceiveMessage(msg => {
            if (msg.type === 'log')
                log.info(`[Panel] ${msg.msg}`);
            if (msg.type === 'setRange' && this.onRangeFilter) {
                this.currentRange = msg.range;
                const filtered = this.onRangeFilter(msg.range);
                if (filtered)
                    this.updateStats(filtered);
            }
            if (msg.type === 'setGridYear') {
                this.currentGridYear = parseInt(msg.year, 10) || new Date().getFullYear();
                if (this.lastStats)
                    this.updateStats(this.lastStats);
            }
            if (msg.type === 'setMonthlyYear') {
                this.currentMonthlyYear = parseInt(msg.year, 10) || new Date().getFullYear();
                if (this.lastStats)
                    this.updateStats(this.lastStats);
            }
        }, null, this.disposables);
    }
    updateStats(stats) {
        (0, usage_components_1.setUsageTranslator)(i18n_1.t);
        this.lastStats = stats;
        const html = this.renderDashboard(stats);
        this.panel.webview.postMessage({ type: 'statsUpdate', html, range: this.currentRange });
    }
    updateLatestStats(stats) {
        if (this.currentRange === 'all') {
            this.updateStats(stats);
            return;
        }
        const filtered = this.onRangeFilter?.(this.currentRange);
        this.updateStats(filtered || stats);
    }
    refreshLocale() {
        (0, usage_components_1.setUsageTranslator)(i18n_1.t);
        this.panel.title = (0, i18n_1.t)('dashboard.title');
        if (this.lastStats) {
            const html = this.renderDashboard(this.lastStats);
            this.panel.webview.postMessage({
                type: 'localeUpdate',
                title: (0, i18n_1.t)('dashboard.title'),
                subtitle: (0, i18n_1.t)('dashboard.subtitle'),
                html,
                range: this.currentRange,
            });
        }
        else {
            this.panel.webview.html = this.buildHtml(null);
        }
    }
    dispose() {
        UsageStatsPanel.currentPanel = undefined;
        this.panel.dispose();
        while (this.disposables.length)
            this.disposables.pop()?.dispose();
    }
    // ─── HTML Shell ───
    buildHtml(stats) {
        const nonce = (0, helpers_1.getNonce)();
        const cssUri = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'panel.css'));
        const faCssUri = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'css', 'all.css'));
        // Pre-render initial content
        const initialContent = stats ? this.renderDashboard(stats) : this.renderLoading();
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'none';
                   style-src ${this.panel.webview.cspSource} 'unsafe-inline';
                   script-src 'nonce-${nonce}';
                   font-src ${this.panel.webview.cspSource} data:;">
    <link href="${faCssUri}" rel="stylesheet">
    <link href="${cssUri}" rel="stylesheet">
</head>
<body class="usage-panel-body">
    <div class="up-container">
        <div class="up-header">
            <div class="up-title" id="upTitle">${(0, i18n_1.t)('dashboard.title')}</div>
            <div class="up-subtitle" id="upSubtitle">${(0, i18n_1.t)('dashboard.subtitle')}</div>
        </div>
        <div id="up-content">${initialContent}</div>
    </div>
    <script nonce="${nonce}">
    (function() {
        const vscode = acquireVsCodeApi();

        // Range button clicks
        document.addEventListener('click', function(e) {
            const rangeBtn = e.target.closest('.up-range-btn');
            if (rangeBtn) {
                document.querySelectorAll('.up-range-btn').forEach(b => b.classList.remove('active'));
                rangeBtn.classList.add('active');
                vscode.postMessage({ type: 'setRange', range: rangeBtn.dataset.range });
                return;
            }
            const yearBtn = e.target.closest('.gh-year-btn');
            if (yearBtn) {
                document.querySelectorAll('.gh-year-btn').forEach(b => b.classList.remove('active'));
                yearBtn.classList.add('active');
                vscode.postMessage({ type: 'setGridYear', year: yearBtn.dataset.year });
                return;
            }
            const monthlyYearBtn = e.target.closest('.monthly-year-btn');
            if (monthlyYearBtn) {
                document.querySelectorAll('.monthly-year-btn').forEach(b => b.classList.remove('active'));
                monthlyYearBtn.classList.add('active');
                vscode.postMessage({ type: 'setMonthlyYear', year: monthlyYearBtn.dataset.year });
                return;
            }
            const cascadeToggle = e.target.closest('.cascade-more-btn');
            if (cascadeToggle) {
                const overflow = cascadeToggle.previousElementSibling;
                if (overflow && overflow.classList.contains('cascade-overflow')) {
                    const hidden = overflow.style.display === 'none';
                    overflow.style.display = hidden ? '' : 'none';
                    const showLess = cascadeToggle.dataset.showLess || 'Show less';
                    const showMore = cascadeToggle.dataset.showMore || 'more';
                    cascadeToggle.textContent = hidden ? showLess : '+' + cascadeToggle.dataset.overflowCount + ' ' + showMore;
                }
                return;
            }
        });

        // Receive stats update — patch DOM instead of full rebuild
        window.addEventListener('message', function(e) {
            const msg = e.data;
            if (msg.type === 'localeUpdate') {
                const titleEl = document.getElementById('upTitle');
                if (titleEl && msg.title) titleEl.textContent = msg.title;
                const subEl = document.getElementById('upSubtitle');
                if (subEl && msg.subtitle) subEl.textContent = msg.subtitle;
                const container = document.getElementById('up-content');
                if (container && msg.html) container.innerHTML = msg.html;
                return;
            }
            if (msg.type !== 'statsUpdate') return;

            // Update range bar active state
            const rangeBar = document.querySelector('.up-range-bar');
            if (rangeBar) {
                rangeBar.querySelectorAll('.up-range-btn').forEach(function(b) {
                    b.classList.toggle('active', b.dataset.range === msg.range);
                });
            }

            // Patch content
            const container = document.getElementById('up-content');
            if (container && msg.html) {
                container.innerHTML = msg.html;
            }
        });
    })();
    </script>
</body>
</html>`;
    }
    // ─── Loading State ───
    renderLoading() {
        return `<div class="up-loading">
            <div class="up-loading-spinner"></div>
            <div class="up-loading-text">${(0, i18n_1.t)('dashboard.loadingTitle')}</div>
            <div class="up-loading-sub">${(0, i18n_1.t)('dashboard.loadingSub')}</div>
        </div>`;
    }
    // ─── Dashboard ───
    renderDashboard(s) {
        const range = this.currentRange;
        const rl = (0, usage_components_1.rangeLabel)(range);
        return [
            this.renderHeroKpi(s),
            this.renderRangeBar(),
            // ── Bento Grid ──
            '<div class="up-bento">',
            // Full-width: Model Distribution
            this.renderModelsCard(s),
            // Full-width: Activity Heatmap
            this.renderHeatmapCard(s),
            // Full-width: Weekly Pattern
            this.renderWeekdayCard(s),
            // Full-width: Monthly Breakdown
            this.renderMonthlyCard(s),
            // Full-width: Cost Estimation
            this.renderCostCard(s, rl),
            // Full-width: Conversations (enriched)
            this.renderConversationsCard(s),
            '</div>',
        ].join('');
    }
    // ─── Hero KPI (Cost + Tokens prominent, rest as chips) ───
    renderHeroKpi(s) {
        const totalCost = (0, usage_components_1.calculateTotalCost)(s.models);
        const totalReas = s.totalReasoning || 0;
        let html = '<div class="up-hero-section">';
        // Hero pair: Cost + Tokens
        html += '<div class="up-hero-pair">';
        html += '<div class="up-hero-card up-hero-cost">';
        html += `<div class="up-hero-val">${(0, usage_components_1.fmtDollar)(totalCost)}</div>`;
        html += `<div class="up-hero-label">${(0, i18n_1.t)('dashboard.estimatedCost')}</div>`;
        html += '</div>';
        html += '<div class="up-hero-card up-hero-tokens">';
        html += `<div class="up-hero-val">${(0, helpers_1.fmtBig)(s.totalTokens)}</div>`;
        html += `<div class="up-hero-label">${(0, i18n_1.t)('dashboard.totalTokens')}</div>`;
        html += '</div>';
        html += '</div>';
        // Secondary chips
        html += '<div class="up-hero-chips">';
        html += `<span class="up-chip"><span class="up-chip-dot" style="background:#4f9cf7"></span>${(0, helpers_1.fmtBig)(s.totalInput)} <em>${(0, i18n_1.t)('dashboard.in')}</em></span>`;
        html += `<span class="up-chip"><span class="up-chip-dot" style="background:#a78bfa"></span>${(0, helpers_1.fmtBig)(s.totalCache)} <em>${(0, i18n_1.t)('dashboard.cache')}</em></span>`;
        html += `<span class="up-chip"><span class="up-chip-dot" style="background:#4ade80"></span>${(0, helpers_1.fmtBig)(s.totalOutput)} <em>${(0, i18n_1.t)('dashboard.out')}</em></span>`;
        if (totalReas > 0) {
            html += `<span class="up-chip"><span class="up-chip-dot" style="background:#f59e0b"></span>${(0, helpers_1.fmtBig)(totalReas)} <em>${(0, i18n_1.t)('dashboard.reas')}</em></span>`;
        }
        html += `<span class="up-chip up-chip-muted">${(0, helpers_1.fmtNum)(s.totalCalls)} <em>${(0, i18n_1.t)('dashboard.calls')}</em></span>`;
        html += `<span class="up-chip up-chip-muted">${s.daysActive}d <em>${(0, i18n_1.t)('dashboard.active')}</em></span>`;
        html += `<span class="up-chip up-chip-muted">${s.cacheRate}% <em>${(0, i18n_1.t)('dashboard.cacheRate')}</em></span>`;
        html += '</div>';
        // Date range
        if (s.dateRange?.from) {
            html += `<div class="up-hero-daterange">${(0, helpers_1.fmtShortDate)(s.dateRange.from)} → ${(0, helpers_1.fmtShortDate)(s.dateRange.to)}</div>`;
        }
        html += '</div>';
        return html;
    }
    renderRangeBar() {
        const rolling = [
            { id: '24h', label: '24h' },
            { id: '7d', label: '7d' },
            { id: '30d', label: '30d' },
        ];
        const calendar = [
            { id: 'today', label: (0, i18n_1.t)('dashboard.today') },
            { id: 'this-week', label: (0, i18n_1.t)('dashboard.week') },
            { id: 'this-month', label: (0, i18n_1.t)('dashboard.month') },
        ];
        const all = [{ id: 'all', label: (0, i18n_1.t)('dashboard.allTime') }];
        const renderBtns = (items) => items.map(r => {
            const active = r.id === this.currentRange ? ' active' : '';
            return `<button class="up-range-btn${active}" data-range="${r.id}">${r.label}</button>`;
        }).join('');
        return '<div class="up-range-bar">'
            + renderBtns(rolling)
            + '<span class="up-range-sep">│</span>'
            + renderBtns(calendar)
            + '<span class="up-range-sep">│</span>'
            + renderBtns(all)
            + '</div>';
    }
    // ─── GitHub Contribution Heatmap Card (shared) ───
    renderHeatmapCard(s) {
        const totalCost = (0, usage_components_1.calculateTotalCost)(s.models);
        const costPerToken = s.totalTokens > 0 ? totalCost / s.totalTokens : 0;
        let html = '<div class="up-card up-bento-full">';
        html += `<div class="up-card-hdr">${(0, i18n_1.t)('dashboard.activity')} <span class="up-badge">${(0, i18n_1.t)('dashboard.contribution')}</span></div>`;
        if (!s.daily || s.daily.length === 0) {
            html += `<div class="up-empty">${(0, i18n_1.t)('dashboard.noData')}</div>`;
        }
        else {
            const years = (0, usage_components_1.getAvailableYears)(s.daily);
            html += (0, usage_components_1.renderYearSelector)(years, this.currentGridYear);
            html += (0, usage_components_1.renderDailyGrid)(s.daily, true, this.currentGridYear, costPerToken);
        }
        html += '</div>';
        return html;
    }
    // ─── Weekday Distribution Card (HALF-WIDTH) ───
    renderWeekdayCard(s) {
        let html = '<div class="up-card up-bento-full">';
        html += `<div class="up-card-hdr">${(0, i18n_1.t)('dashboard.weeklyPattern')} <span class="up-badge">${(0, i18n_1.t)('dashboard.dayOfWeek')}</span></div>`;
        if (!s.weekday || s.weekday.length === 0) {
            html += `<div class="up-empty">${(0, i18n_1.t)('dashboard.noData')}</div>`;
        }
        else {
            html += (0, usage_components_1.renderWeekdayChart)(s.weekday);
        }
        html += '</div>';
        return html;
    }
    // ─── Model Distribution Card (shared) ───
    renderModelsCard(s) {
        let html = '<div class="up-card up-bento-full">';
        html += `<div class="up-card-hdr">${(0, i18n_1.t)('dashboard.modelDistribution')}</div>`;
        if (!s.models || s.models.length === 0) {
            html += `<div class="up-empty">${(0, i18n_1.t)('dashboard.noData')}</div>`;
        }
        else {
            html += (0, usage_components_1.renderModelBreakdown)(s.models, s.totalTokens);
        }
        html += '</div>';
        return html;
    }
    // ─── Monthly Breakdown Card ───
    renderMonthlyCard(s) {
        if (!s.monthly || s.monthly.length === 0)
            return '';
        const years = (0, usage_components_1.getMonthlyYears)(s.monthly);
        const activeYear = years.includes(this.currentMonthlyYear) ? this.currentMonthlyYear : years[0];
        const monthlyHtml = (0, usage_components_1.renderMonthlySummary)(s.monthly, activeYear);
        if (!monthlyHtml)
            return '';
        // Year selector for monthly chart
        let yearBar = '';
        if (years.length > 1) {
            yearBar = '<div class="monthly-year-bar">';
            for (const y of years) {
                const active = y === activeYear ? ' active' : '';
                yearBar += `<button class="monthly-year-btn${active}" data-year="${y}">${y}</button>`;
            }
            yearBar += '</div>';
        }
        let html = '<div class="up-card up-bento-full">';
        html += `<div class="up-card-hdr">${(0, i18n_1.t)('dashboard.monthlyBreakdown')} <span class="up-badge">${activeYear}</span></div>`;
        html += yearBar;
        html += monthlyHtml;
        html += '</div>';
        return html;
    }
    // ─── Cost Estimation Card (full-width) ───
    renderCostCard(s, rl) {
        let html = '<div class="up-card up-bento-full">';
        html += `<div class="up-card-hdr">${(0, i18n_1.t)('dashboard.estimatedApiCost')} <span class="up-badge">${(0, helpers_1.escHtml)(rl)}</span></div>`;
        html += (0, usage_components_1.renderCostEstimate)(s.models);
        html += '</div>';
        return html;
    }
    // ─── Top Conversations Card (enriched) ───
    renderConversationsCard(s) {
        let html = '<div class="up-card up-bento-full">';
        html += `<div class="up-card-hdr">${(0, i18n_1.t)('dashboard.topConversations')} <span class="up-badge">${s.cascades.length}</span></div>`;
        html += (0, usage_components_1.renderEnrichedCascadeList)(s.cascades, s.models, 30, 60);
        html += '</div>';
        return html;
    }
}
exports.UsageStatsPanel = UsageStatsPanel;
//# sourceMappingURL=usageStatsPanel.js.map