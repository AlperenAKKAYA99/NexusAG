"use strict";
/**
 * StatusBarService — manages the VS Code status bar item for quota display.
 * Includes context window percentage inline with the active model.
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
exports.StatusBarService = void 0;
const vscode = __importStar(require("vscode"));
const helpers_1 = require("../shared/helpers");
const uiConstants_1 = require("../shared/uiConstants");
const i18n_1 = require("../i18n");
class StatusBarService {
    statusBarItem;
    // Cached state for re-rendering when either quota or context changes
    lastQuotaData = null;
    lastSelectedIds = [];
    ctxUsed = 0;
    ctxMax = 0;
    ctxModel = '';
    ctxHideTimer = null;
    constructor(context) {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'ag.refreshQuota';
        this.statusBarItem.text = `$(pulse) ${(0, i18n_1.t)('status.quotaLoading')}`;
        this.statusBarItem.show();
        context.subscriptions.push(this.statusBarItem);
    }
    /** Set error state on status bar */
    setError(text, tooltip) {
        this.statusBarItem.text = text;
        if (tooltip)
            this.statusBarItem.tooltip = tooltip;
    }
    /** Update status bar from quota data */
    update(data, selectedIds) {
        this.lastQuotaData = data;
        this.lastSelectedIds = selectedIds;
        this._render();
    }
    /** Update context window info (shown inline with quota) */
    updateContext(usedTokens, maxTokens, model) {
        this.ctxUsed = usedTokens;
        this.ctxMax = maxTokens;
        this.ctxModel = model;
        this._render();
        // Auto-hide context after 5min idle
        if (this.ctxHideTimer)
            clearTimeout(this.ctxHideTimer);
        this.ctxHideTimer = setTimeout(() => {
            this.ctxUsed = 0;
            this.ctxMax = 0;
            this._render();
        }, 5 * 60_000);
    }
    // ── Internal render ──
    _render() {
        const data = this.lastQuotaData;
        const selectedIds = this.lastSelectedIds;
        const rawModels = data?.userStatus?.cascadeModelConfigData?.clientModelConfigs;
        if (!rawModels || rawModels.length === 0)
            return;
        const sorted = [...rawModels].sort((a, b) => (a.label || '').localeCompare(b.label || ''));
        const selected = sorted.filter(m => selectedIds.includes(m.modelOrAlias?.model || ''));
        // ── Status bar text ──
        if (selected.length === 0) {
            this.statusBarItem.text = `$(pulse) ${(0, i18n_1.t)('status.noModelSelected')}`;
        }
        else {
            const parts = selected.map(m => {
                const pct = getQuotaPercent(m);
                return `${quotaIcon(pct)} ${m.label}: ${pct === null ? 'N/A' : pct.toFixed(0) + '%'}`;
            });
            // Append context window percentage if active
            if (this.ctxMax > 0 && this.ctxUsed > 0) {
                const ctxPct = Math.min((this.ctxUsed / this.ctxMax) * 100, 100);
                const ctxIcon = ctxPct > uiConstants_1.CTX_CRITICAL_PCT ? '$(warning)' : '$(symbol-misc)';
                parts.push(`${ctxIcon} ${ctxPct.toFixed(0)}% ctx`);
            }
            this.statusBarItem.text = parts.join('  ·  ');
        }
        // ── Background color from context level ──
        if (this.ctxMax > 0 && this.ctxUsed > 0) {
            const ctxPct = (this.ctxUsed / this.ctxMax) * 100;
            if (ctxPct > uiConstants_1.CTX_CRITICAL_PCT) {
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
            }
            else if (ctxPct > uiConstants_1.CTX_WARNING_PCT) {
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            }
            else {
                this.statusBarItem.backgroundColor = undefined;
            }
        }
        else {
            this.statusBarItem.backgroundColor = undefined;
        }
        // ── Rich tooltip ──
        const md = new vscode.MarkdownString('', true);
        md.appendMarkdown(`**${(0, i18n_1.t)('status.quotaModelsTitle')}**\n\n---\n\n`);
        for (const m of sorted) {
            if (!m.quotaInfo)
                continue;
            const pct = getQuotaPercent(m);
            const sel = selectedIds.includes(m.modelOrAlias?.model || '') ? ` *${(0, i18n_1.t)('status.selected')}*` : '';
            const resetDate = m.quotaInfo.resetTime ? new Date(m.quotaInfo.resetTime) : null;
            const isValid = resetDate && !isNaN(resetDate.getTime());
            const timeStr = isValid
                ? resetDate.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : (0, i18n_1.t)('common.unknown');
            const timeLeft = isValid ? `(${(0, helpers_1.formatDurationMs)(resetDate.getTime() - Date.now())} ${(0, i18n_1.t)('status.left')})` : '';
            md.appendMarkdown(`${quotaIcon(pct)} **${m.label}** (${pct === null ? 'N/A' : pct.toFixed(0) + '%'})${sel}\n\n`);
            md.appendMarkdown(`*${(0, i18n_1.t)('status.resets')}* ${timeStr} ${timeLeft}\n\n---\n\n`);
        }
        // Context window section in tooltip
        if (this.ctxMax > 0 && this.ctxUsed > 0) {
            const ctxPct = Math.min((this.ctxUsed / this.ctxMax) * 100, 100);
            const shortModel = this.ctxModel.split('/').pop() || this.ctxModel;
            md.appendMarkdown(`**${(0, i18n_1.t)('status.contextWindow')}** — ${shortModel}\n\n`);
            md.appendMarkdown(`**${ctxPct.toFixed(1)}%** ${(0, i18n_1.t)('status.used')} · ${(0, helpers_1.fmtBig)(this.ctxUsed)} / ${(0, helpers_1.fmtBig)(this.ctxMax)} ${(0, i18n_1.t)('common.tokens')}\n\n`);
            md.appendMarkdown(`**${(0, i18n_1.t)('status.free')}** ${(0, helpers_1.fmtBig)(this.ctxMax - this.ctxUsed)} ${(0, i18n_1.t)('common.tokens')}\n\n`);
        }
        this.statusBarItem.tooltip = md;
    }
}
exports.StatusBarService = StatusBarService;
// ==================== Standalone Helpers ====================
function getQuotaPercent(m) {
    if (m.quotaInfo?.remainingFraction === undefined)
        return null;
    return Math.max(0, Math.min(100, m.quotaInfo.remainingFraction * 100));
}
function quotaIcon(pct) {
    if (pct === null)
        return '⚪';
    if (pct >= 100)
        return '🟢';
    if (pct <= 0)
        return '🔴';
    return '🟡';
}
//# sourceMappingURL=statusBar.js.map