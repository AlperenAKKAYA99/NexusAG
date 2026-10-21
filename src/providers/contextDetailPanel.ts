/**
 * ContextDetailPanel — Full-width editor tab for context window drill-down.
 * Opens via "See All →" button in the sidebar context widget.
 *
 * Features:
 * - Collapsible tree view of tokenBreakdown groups/children
 * - Step content preview via [👁] button
 * - Markdown export with Copy/Download actions
 * - Auto-updates when context window data changes
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ContextWindowData, ContextBreakdownGroup } from '../services/contextWindow';
import { ContextDetailService, StepContent } from '../services/contextDetailService';
import { createLogger } from '../utils/logger';
import { fmtBig, escHtml, getNonce } from '../shared/helpers';
import { ServerInfo } from '../types';
import { t, getLocale } from '../i18n';

const log = createLogger('CtxDetailPanel');

export class ContextDetailPanel {
    public static currentPanel: ContextDetailPanel | undefined;
    private static readonly viewType = 'ag.contextDetailPanel';

    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private readonly detailService = new ContextDetailService();
    private disposables: vscode.Disposable[] = [];
    private data: ContextWindowData | null;
    private serverInfo: ServerInfo | null;
    private static refreshCallback: (() => Promise<void>) | null = null;

    // ─── Lifecycle ───

    public static createOrShow(
        extensionUri: vscode.Uri,
        data: ContextWindowData | null,
        serverInfo: ServerInfo | null,
    ) {
        const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

        if (ContextDetailPanel.currentPanel) {
            ContextDetailPanel.currentPanel.panel.reveal(column);
            if (data) {
                ContextDetailPanel.currentPanel.updateData(data, serverInfo);
            }
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            ContextDetailPanel.viewType,
            '🔍 ' + t('context.detailTitle'),
            column,
            { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [extensionUri] },
        );

        ContextDetailPanel.currentPanel = new ContextDetailPanel(panel, extensionUri, data, serverInfo);
    }

    /**
     * Push updated context data to the panel (called from QuotaManager on stream updates).
     */
    public static pushUpdate(data: ContextWindowData, serverInfo: ServerInfo | null) {
        if (!ContextDetailPanel.currentPanel) return;
        ContextDetailPanel.currentPanel.updateData(data, serverInfo);
    }

    /** Register a callback for manual refresh (called from QuotaManager) */
    public static setRefreshCallback(cb: () => Promise<void>) {
        ContextDetailPanel.refreshCallback = cb;
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        data: ContextWindowData | null,
        serverInfo: ServerInfo | null,
    ) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.data = data;
        this.serverInfo = serverInfo;
        this.panel.webview.html = this.buildHtml();

        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.panel.webview.onDidReceiveMessage(msg => this.handleMessage(msg), null, this.disposables);
    }

    public refreshLocale() {
        this.panel.title = '🔍 ' + t('context.detailTitle');
        const html = this.data ? this.renderDashboard() : this.renderEmpty();
        this.panel.webview.postMessage({ type: 'contentUpdate', html });
    }

    public dispose() {
        ContextDetailPanel.currentPanel = undefined;
        this.panel.dispose();
        while (this.disposables.length) this.disposables.pop()?.dispose();
    }

    private updateData(data: ContextWindowData, serverInfo: ServerInfo | null) {
        const prevData = this.data;
        this.data = data;
        if (serverInfo) this.serverInfo = serverInfo;

        // If no previous data or structure changed (different conversation or different step count),
        // do a full rebuild. Otherwise, patch only the metrics.
        const structureChanged = !prevData
            || prevData.conversationId !== data.conversationId
            || (prevData.rawBreakdown?.length ?? 0) !== (data.rawBreakdown?.length ?? 0)
            || prevData.rawBreakdown?.some((g, i) => {
                const newG = data.rawBreakdown?.[i];
                return !newG || g.name !== newG.name || (g.children?.length ?? 0) !== (newG.children?.length ?? 0);
            });

        if (structureChanged) {
            // Full DOM replacement — only on conversation switch or structural change
            const html = this.data ? this.renderDashboard() : this.renderEmpty();
            this.panel.webview.postMessage({ type: 'contentUpdate', html });
        } else {
            // Surgical patch — update metrics without touching the tree
            const d = this.data;
            const pctClass = d.percentage >= 80 ? 'r' : d.percentage >= 50 ? 'y' : 'g';
            const updatedTime = d.lastUpdated ? new Date(d.lastUpdated).toLocaleString(getLocale(), {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
            }) : '';

            this.panel.webview.postMessage({
                type: 'metricsPatch',
                tokens: `${fmtBig(d.usedTokens)} <span class="cd-token-sep">/</span> ${fmtBig(d.maxTokens)}`,
                pctText: `${d.percentage}% ${t('context.used')}`,
                pctClass: `pct-${pctClass}`,
                meta: `${escHtml(d.model)} · ${escHtml(d.provider)}${updatedTime ? ` · <span class="cd-updated">⏱ ${updatedTime}</span>` : ''}`,
                barSegments: d.categories.map(c => ({ width: c.percentage, color: c.color, title: `${escHtml(c.name)}: ${fmtBig(c.tokens)} (${c.percentage}%)` })),
            });
        }
    }

    // ─── Message Handling ───

    private async handleMessage(msg: any) {
        switch (msg.type) {
            case 'viewStep': {
                if (!this.serverInfo || !this.data) {
                    this.panel.webview.postMessage({
                        type: 'stepContent',
                        stepName: msg.stepName,
                        content: null,
                    });
                    return;
                }
                const content = await this.detailService.getStepContent(
                    this.serverInfo, this.data.conversationId, msg.stepName, msg.ordinal ?? -1,
                );
                this.panel.webview.postMessage({
                    type: 'stepContent',
                    stepName: msg.stepName,
                    content,
                });
                break;
            }
            case 'exportMarkdown': {
                await this.exportMarkdown();
                break;
            }
            case 'refresh': {
                if (ContextDetailPanel.refreshCallback) {
                    await ContextDetailPanel.refreshCallback();
                }
                this.panel.webview.postMessage({ type: 'refreshDone' });
                break;
            }
            case 'log':
                log.info(`[Panel] ${msg.msg}`);
                break;
        }
    }


    private async exportMarkdown() {
        if (!this.serverInfo || !this.data) {
            vscode.window.showWarningMessage(t('context.noContextToExport'));
            this.panel.webview.postMessage({ type: 'exportDone' });
            return;
        }

        try {
            const md = await this.detailService.exportAsMarkdown(
                this.serverInfo, this.data.conversationId,
            );

            if (!md) {
                vscode.window.showErrorMessage('Failed to export markdown from Language Server.');
                this.panel.webview.postMessage({ type: 'exportDone' });
                return;
            }

            const fileName = `ag-context-export-${Date.now()}.md`;
            const filePath = path.join(os.tmpdir(), fileName);
            fs.writeFileSync(filePath, md, 'utf-8');

            const fileUri = vscode.Uri.file(filePath);

            // Open in Markdown Preview (rendered/formatted view)
            await vscode.commands.executeCommand('markdown.showPreview', fileUri);

            // Reset button state
            this.panel.webview.postMessage({ type: 'exportDone' });

            // Offer copy / save actions
            const action = await vscode.window.showInformationMessage(
                t('context.exportedSuccess', { model: this.data.model, pct: String(this.data.percentage) }),
                'Copy to Clipboard', 'Save As...',
            );

            if (action === 'Copy to Clipboard') {
                await vscode.env.clipboard.writeText(md);
                vscode.window.showInformationMessage(t('context.copiedClipboard'));
            } else if (action === 'Save As...') {
                const uri = await vscode.window.showSaveDialog({
                    defaultUri: vscode.Uri.file(path.join(os.homedir(), fileName)),
                    filters: { 'Markdown': ['md'] },
                });
                if (uri) {
                    fs.writeFileSync(uri.fsPath, md, 'utf-8');
                    vscode.window.showInformationMessage(t('context.savedToFile', { path: uri.fsPath }));
                }
            }
        } catch (err) {
            log.warn('exportMarkdown error:', (err as Error)?.message);
            this.panel.webview.postMessage({ type: 'exportDone' });
        }
    }

    // ─── HTML Build ───

    private buildHtml(): string {
        const nonce = getNonce();
        const cssUri = this.panel.webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'context-detail.css'),
        );
        const faCssUri = this.panel.webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'css', 'all.css'),
        );
        const content = this.data ? this.renderDashboard() : this.renderEmpty();

        return `<!DOCTYPE html>
<html lang="${getLocale().slice(0, 2)}">
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
    <div id="cd-root" class="cd-container">
        ${content}
    </div>
    <script nonce="${nonce}">
    (function() {
        const vscode = acquireVsCodeApi();

        document.addEventListener('click', function(e) {
            var groupHeader = e.target.closest('.cd-group-header');
            if (groupHeader) {
                var group = groupHeader.closest('.cd-group');
                if (group) group.classList.toggle('expanded');
                return;
            }
            var exportBtn = e.target.closest('.cd-export-btn');
            if (exportBtn) {
                exportBtn.textContent = 'Exporting…';
                exportBtn.disabled = true;
                vscode.postMessage({ type: 'exportMarkdown' });
                return;
            }
            var refreshBtn = e.target.closest('.cd-refresh-btn');
            if (refreshBtn) {
                refreshBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate fa-spin"></i> Refreshing…';
                refreshBtn.disabled = true;
                vscode.postMessage({ type: 'refresh' });
                return;
            }
            // Expand All / Collapse All
            if (e.target.closest('.cd-expand-all')) {
                document.querySelectorAll('.cd-group').forEach(function(g) { g.classList.add('expanded'); });
                return;
            }
            if (e.target.closest('.cd-collapse-all')) {
                document.querySelectorAll('.cd-group').forEach(function(g) { g.classList.remove('expanded'); });
                document.querySelectorAll('.cd-child').forEach(function(c) { c.classList.remove('expanded'); });
                closeOtherPreviews(null);
                return;
            }
            // Filter chips
            var chip = e.target.closest('.cd-filter-chip');
            if (chip) {
                var filter = chip.dataset.filter;
                document.querySelectorAll('.cd-filter-chip').forEach(function(c) { c.classList.remove('active'); });
                chip.classList.add('active');
                var toolTypes = ['CODE_ACTION','RUN_COMMAND','COMMAND_STATUS','SEND_COMMAND_INPUT','GREP_SEARCH','LIST_DIRECTORY','MCP_TOOL','BROWSER_SUBAGENT'];
                var fileTypes = ['VIEW_FILE'];
                document.querySelectorAll('.cd-child[data-type]').forEach(function(row) {
                    var t = row.dataset.type;
                    var show = filter === 'all'
                        || (filter === 'TOOL' && toolTypes.indexOf(t) !== -1)
                        || (filter === 'FILE' && fileTypes.indexOf(t) !== -1)
                        || t === filter;
                    row.style.display = show ? '' : 'none';
                });
                return;
            }
            // Child row click
            var childHeader = e.target.closest('.cd-child-header');
            if (childHeader) {
                var child = childHeader.closest('.cd-child');
                if (!child) return;
                if (child.classList.contains('viewable')) {
                    togglePreview(child);
                    return;
                }
                if (!child.classList.contains('no-expand')) {
                    child.classList.toggle('expanded');
                }
                return;
            }
            // Sub row click
            var subRow = e.target.closest('.cd-sub-row');
            if (subRow) {
                var sub = subRow.closest('.cd-sub');
                if (sub && sub.dataset.step) {
                    togglePreview(sub);
                }
                return;
            }
        });

        /** Toggle preview for .cd-child or .cd-sub — detail slot is always inside the element */
        function togglePreview(el) {
            var detail = el.querySelector('.cd-detail');
            if (!detail) return;
            var step = el.dataset.step;
            var ordinal = parseInt(el.dataset.ordinal || '-1', 10);

            if (el.classList.contains('previewing')) {
                el.classList.remove('previewing');
                detail.innerHTML = '';
                return;
            }
            // Batch: set new content FIRST, then close others — single reflow, no flash
            el.classList.add('previewing');
            detail.innerHTML = '<div class="cd-loading"><span class="cd-loading-dot"></span> Loading…</div>';
            closeOtherPreviews(el);
            vscode.postMessage({ type: 'viewStep', stepName: step, ordinal: ordinal });
        }

        function closeOtherPreviews(except) {
            document.querySelectorAll('.previewing').forEach(function(el) {
                if (el === except) return;
                el.classList.remove('previewing');
                var d = el.querySelector('.cd-detail');
                if (d) d.innerHTML = '';
            });
        }

        window.addEventListener('message', function(e) {
            var msg = e.data;
            if (msg.type === 'stepContent') {
                var row = document.querySelector('.cd-child[data-step="' + CSS.escape(msg.stepName) + '"]')
                       || document.querySelector('.cd-sub[data-step="' + CSS.escape(msg.stepName) + '"]');
                if (!row) return;
                var detail = row.querySelector('.cd-detail');
                if (!detail) return;

                if (msg.content) {
                    var c = msg.content;
                    var html = '<div class="cd-preview-header">';
                    if (c.createdAt) html += '<div class="cd-preview-time">' + new Date(c.createdAt).toLocaleString() + '</div>';
                    if (c.tokens) html += '<div class="cd-preview-meta">' + c.tokens.input.toLocaleString() + ' in · ' + c.tokens.output.toLocaleString() + ' out</div>';
                    html += '</div>';
                    html += '<pre class="cd-preview-body">' + esc(c.content || '') + '</pre>';
                    if (c.output) html += '<pre class="cd-preview-body cd-preview-output">' + esc(c.output) + '</pre>';
                    detail.innerHTML = html;
                } else {
                    detail.innerHTML = '<div class="cd-preview-empty">' + esc(${JSON.stringify(t('context.contentNotAvailable'))}) + '</div>';
                }
                // Scroll the parent ROW (not the detail) into view for stable positioning
                if (row) row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            if (msg.type === 'contentUpdate' || msg.type === 'localeUpdate') {
                var root = document.getElementById('cd-root');
                if (root && msg.html) root.innerHTML = msg.html;
            }
            if (msg.type === 'metricsPatch') {
                // Surgical update — only touch header metrics and bar, preserve tree & detail state
                var tokenEl = document.querySelector('.cd-token-total');
                if (tokenEl) { tokenEl.innerHTML = msg.tokens; tokenEl.className = 'cd-token-total ' + msg.pctClass; }
                var pctEl = document.querySelector('.cd-pct');
                if (pctEl) pctEl.textContent = msg.pctText;
                var metaEl = document.querySelector('.cd-meta');
                if (metaEl) metaEl.innerHTML = msg.meta;
                var bar = document.querySelector('.cd-bar');
                if (bar && msg.barSegments) {
                    bar.innerHTML = '';
                    msg.barSegments.forEach(function(seg) {
                        var div = document.createElement('div');
                        div.className = 'cd-bar-seg';
                        div.style.width = seg.width + '%';
                        div.style.background = seg.color;
                        div.title = seg.title;
                        bar.appendChild(div);
                    });
                }
            }
            if (msg.type === 'exportDone' || msg.type === 'error') {
                var btn = document.querySelector('.cd-export-btn');
                if (btn) { btn.innerHTML = esc(${JSON.stringify(t('context.exportMarkdown'))}) + ' <i class="fa-solid fa-arrow-up-right-from-square"></i>'; btn.disabled = false; }
            }
            if (msg.type === 'refreshDone') {
                var rbtn = document.querySelector('.cd-refresh-btn');
                if (rbtn) { rbtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> ' + esc(${JSON.stringify(t('common.refresh'))}); rbtn.disabled = false; }
            }
        });

        function esc(s) {
            return (s || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }
    })();
    </script>
</body>
</html>`;
    }

    // ─── Renderers ───

    private renderEmpty(): string {
        return `<div class="cd-empty">
            <div class="em-icon"><i class="fa-solid fa-chart-column"></i></div>
            <div class="em-title">${t('context.noDataTitle')}</div>
            <div class="em-sub">${t('context.noDataSub')}</div>
        </div>`;
    }

    private renderDashboard(): string {
        const d = this.data!;
        const pctClass = d.percentage >= 80 ? 'r' : d.percentage >= 50 ? 'y' : 'g';

        let html = '';

        // ── Header ──
        // Format lastUpdated
        const updatedTime = d.lastUpdated ? new Date(d.lastUpdated).toLocaleString(getLocale(), {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        }) : '';

        html += `<div class="cd-header">
            <div class="cd-header-left">
                <div class="cd-title"><i class="fa-solid fa-magnifying-glass-chart"></i> ${t('context.windowDetail')}</div>
                <div class="cd-subtitle">${escHtml(d.title || t('context.untitled'))}</div>
                <div class="cd-meta">${escHtml(d.model)} · ${escHtml(d.provider)}${updatedTime ? ` · <span class="cd-updated"><i class="fa-solid fa-clock"></i> ${updatedTime}</span>` : ''}</div>
            </div>
            <div class="cd-header-right">
                <div class="cd-token-total pct-${pctClass}">
                    ${fmtBig(d.usedTokens)} <span class="cd-token-sep">/</span> ${fmtBig(d.maxTokens)}
                </div>
                <div class="cd-pct">${d.percentage}% ${t('context.used')}</div>
                <button class="cd-refresh-btn" title="${t('common.refresh')}"><i class="fa-solid fa-arrows-rotate"></i> ${t('common.refresh')}</button>
                <button class="cd-export-btn">${t('context.exportMarkdown')} <i class="fa-solid fa-arrow-up-right-from-square"></i></button>
            </div>
        </div>`;

        // ── Usage Bar ──
        html += `<div class="cd-bar-container">
            <div class="cd-bar">`;
        for (const cat of d.categories) {
            html += `<div class="cd-bar-seg" style="width:${cat.percentage}%;background:${cat.color}" title="${escHtml(cat.name)}: ${fmtBig(cat.tokens)} (${cat.percentage}%)"></div>`;
        }
        html += `</div></div>`;

        // ── Expand/Collapse + Filter toolbar ──
        html += `<div class="cd-toolbar">
            <button class="cd-expand-all" title="${t('context.expandAll')}"><i class="fa-solid fa-chevron-down"></i> ${t('context.expandAll')}</button>
            <button class="cd-collapse-all" title="${t('context.collapseAll')}"><i class="fa-solid fa-chevron-up"></i> ${t('context.collapseAll')}</button>
            <span class="cd-toolbar-sep"></span>
            <button class="cd-filter-chip active" data-filter="all">${t('context.filterAll')}</button>
            <button class="cd-filter-chip" data-filter="USER_INPUT"><i class="fa-solid fa-comment"></i> ${t('context.filterUser')}</button>
            <button class="cd-filter-chip" data-filter="PLANNER_RESPONSE"><i class="fa-solid fa-robot"></i> ${t('context.filterModel')}</button>
            <button class="cd-filter-chip" data-filter="TOOL"><i class="fa-solid fa-wrench"></i> ${t('context.filterTools')}</button>
            <button class="cd-filter-chip" data-filter="FILE"><i class="fa-solid fa-file-lines"></i> ${t('context.filterFiles')}</button>
        </div>`;

        // ── Tree View ──
        html += `<div class="cd-tree">`;

        const groups = d.rawBreakdown || [];
        const totalTokens = groups.reduce((s, g) => s + g.numTokens, 0) || d.usedTokens;

        for (const group of groups) {
            const pct = totalTokens > 0 ? Math.round(group.numTokens / totalTokens * 100) : 0;
            const meta = this.getGroupMeta(group.name);
            const childCount = group.children?.length || 0;

            html += `<div class="cd-group">
                <div class="cd-group-header">
                    <span class="cd-expand-icon"><i class="fa-solid fa-caret-right"></i></span>
                    <span class="cd-group-icon">${meta.icon}</span>
                    <span class="cd-group-name">${escHtml(group.name)}</span>
                    <span class="cd-group-count">${childCount}</span>
                    <span class="cd-group-tokens">${fmtBig(group.numTokens)}</span>
                    <span class="cd-group-pct">${pct}%</span>
                    <div class="cd-token-bar"><div class="cd-token-bar-fill" style="width:${pct}%;background:${meta.color}"></div></div>
                </div>
                <div class="cd-group-children">`;

            const heaviestTokens = group.children?.length
                ? Math.max(...group.children.map(c => c.numTokens)) : 0;

            if (group.children) {
                for (const child of group.children) {
                    html += this.renderChild(child, group, heaviestTokens);
                }
            }

            html += `</div></div>`;
        }

        html += `</div>`;

        // ── Config ──
        if (d.completionConfig) {
            const c = d.completionConfig;
            html += `<div class="cd-config">
                <div class="cd-config-title">${t('context.completionConfig')}</div>
                <div class="cd-config-grid">
                    <div class="cd-config-item"><span class="cd-config-label">${t('context.maxOutput')}</span><span class="cd-config-value">${fmtBig(c.maxOutputTokens)}</span></div>
                    <div class="cd-config-item"><span class="cd-config-label">${t('context.temperature')}</span><span class="cd-config-value">${c.temperature}</span></div>
                    <div class="cd-config-item"><span class="cd-config-label">Top-K</span><span class="cd-config-value">${c.topK}</span></div>
                    <div class="cd-config-item"><span class="cd-config-label">Top-P</span><span class="cd-config-value">${c.topP}</span></div>
                </div>
            </div>`;
        }

        return html;
    }

    // ─── Helpers ───

    /** Render a single breakdown child node (and its sub-children). */
    private renderChild(
        child: ContextBreakdownGroup, parent: ContextBreakdownGroup, heaviestTokens: number,
    ): string {
        const childPct = parent.numTokens > 0
            ? Math.round(child.numTokens / parent.numTokens * 100) : 0;
        const hasSubs = !!child.children?.length;
        const viewable = this.isViewableStep(child.name);
        const stepIdx = parseInt(child.name.match(/^(\d+):/)?.[1] || '-1', 10);
        const stepTypeRaw = child.name.match(/^\d+:\s*(.+)$/)?.[1]?.trim() || '';

        const classes = ['cd-child'];
        if (!hasSubs && !viewable) classes.push('no-expand');
        if (viewable) classes.push('viewable');

        const importantTypes = ['USER_INPUT', 'PLANNER_RESPONSE', 'CONVERSATION_HISTORY', 'CHECKPOINT'];
        if (childPct >= 5) classes.push('weight-heavy');
        else if (childPct < 1 && !importantTypes.includes(stepTypeRaw)) classes.push('weight-light');

        const isHeaviest = child.numTokens === heaviestTokens && heaviestTokens > 0
            && (parent.children?.length || 0) > 1;

        let html = `<div class="${classes.join(' ')}" data-type="${escHtml(stepTypeRaw)}" ${viewable ? `data-step="${escHtml(child.name)}" data-ordinal="${stepIdx}"` : ''}>
            <div class="cd-child-header">
                ${hasSubs ? '<span class="cd-expand-icon"><i class="fa-solid fa-caret-right"></i></span>' : '<span class="cd-expand-spacer"></span>'}
                <span class="cd-child-name">${isHeaviest ? '<i class="fa-solid fa-fire cd-fire"></i> ' : ''}${this.formatChildName(child.name)}</span>
                <span class="cd-child-tokens">${fmtBig(child.numTokens)}</span>
                <span class="cd-child-pct">${childPct}%</span>
            </div>`;

        if (hasSubs) {
            html += `<div class="cd-child-subs">`;
            for (const sub of child.children!) {
                html += this.renderSubChild(sub, child);
            }
            html += `</div>`;
        }

        if (viewable) html += `<div class="cd-detail"></div>`;
        html += `</div>`;
        return html;
    }

    /** Render a sub-child leaf node. */
    private renderSubChild(sub: ContextBreakdownGroup, parent: ContextBreakdownGroup): string {
        const subPct = parent.numTokens > 0
            ? Math.round(sub.numTokens / parent.numTokens * 100) : 0;
        const subViewable = this.isViewableStep(sub.name);
        const subStepIdx = parseInt(sub.name.match(/^(\d+):/)?.[1] || '-1', 10);
        return `<div class="cd-sub" ${subViewable ? `data-step="${escHtml(sub.name)}" data-ordinal="${subStepIdx}"` : ''}>
            <div class="cd-sub-row">
                <span class="cd-sub-name">${this.formatChildName(sub.name)}</span>
                <span class="cd-sub-tokens">${fmtBig(sub.numTokens)}</span>
                <span class="cd-sub-pct">${subPct}%</span>
            </div>
            <div class="cd-detail"></div>
        </div>`;
    }

    private getGroupMeta(name: string): { icon: string; color: string } {
        const map: Record<string, { icon: string; color: string }> = {
            'System Prompt': { icon: '<i class="fa-solid fa-gear"></i>', color: '#6b7280' },
            'Tools': { icon: '<i class="fa-solid fa-wrench"></i>', color: '#f59e0b' },
            'Mcp Tools': { icon: '<i class="fa-solid fa-plug"></i>', color: '#c084fc' },
            'Chat Messages': { icon: '<i class="fa-solid fa-comments"></i>', color: '#4f9cf7' },
        };
        return map[name] || { icon: '<i class="fa-solid fa-ellipsis"></i>', color: '#9ca3af' };
    }

    private formatChildName(name: string): string {
        const match = name.match(/^(\d+):\s*(.+)$/);
        if (match) {
            const typeMap: Record<string, string> = {
                'USER_INPUT': '<i class="fa-solid fa-comment"></i> ' + t('context.stepUserInput'),
                'PLANNER_RESPONSE': '<i class="fa-solid fa-robot"></i> ' + t('context.stepModelResponse'),
                'CODE_ACTION': '<i class="fa-solid fa-pen-to-square"></i> ' + t('context.stepCodeAction'),
                'RUN_COMMAND': '<i class="fa-solid fa-terminal"></i> ' + t('context.stepRunCommand'),
                'COMMAND_STATUS': '<i class="fa-solid fa-chart-simple"></i> ' + t('context.stepCmdStatus'),
                'SEND_COMMAND_INPUT': '<i class="fa-solid fa-keyboard"></i> ' + t('context.stepSendInput'),
                'VIEW_FILE': '<i class="fa-solid fa-file-lines"></i> ' + t('context.stepViewFile'),
                'LIST_DIRECTORY': '<i class="fa-solid fa-folder-open"></i> ' + t('context.stepListDir'),
                'GREP_SEARCH': '<i class="fa-solid fa-magnifying-glass"></i> ' + t('context.stepGrep'),
                'BROWSER_SUBAGENT': '<i class="fa-solid fa-globe"></i> ' + t('context.stepBrowser'),
                'ERROR_MESSAGE': '<i class="fa-solid fa-triangle-exclamation"></i> Error',
                'MCP_TOOL': '<i class="fa-solid fa-plug-circle-bolt"></i> MCP Tool',
                'CHECKPOINT': '<i class="fa-solid fa-thumbtack"></i> Checkpoint',
                'CONVERSATION_HISTORY': '<i class="fa-solid fa-clock-rotate-left"></i> ' + t('context.stepHistory'),
                'KNOWLEDGE_ARTIFACTS': '<i class="fa-solid fa-brain"></i> Knowledge',
                'EPHEMERAL_MESSAGE': '<i class="fa-solid fa-ghost"></i> Ephemeral',
            };
            const friendly = typeMap[match[2]] || escHtml(match[2].replace(/_/g, ' ').toLowerCase());
            return friendly;
        }
        return escHtml(name);
    }

    private isViewableStep(name: string): boolean {
        // Any Chat Messages child with "<number>: <TYPE>" format is viewable
        return /^\d+:\s*\w+/.test(name);
    }
}
