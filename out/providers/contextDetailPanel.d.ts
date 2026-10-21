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
import { ContextWindowData } from '../services/contextWindow';
import { ServerInfo } from '../types';
export declare class ContextDetailPanel {
    static currentPanel: ContextDetailPanel | undefined;
    private static readonly viewType;
    private readonly panel;
    private readonly extensionUri;
    private readonly detailService;
    private disposables;
    private data;
    private serverInfo;
    private static refreshCallback;
    static createOrShow(extensionUri: vscode.Uri, data: ContextWindowData | null, serverInfo: ServerInfo | null): void;
    /**
     * Push updated context data to the panel (called from QuotaManager on stream updates).
     */
    static pushUpdate(data: ContextWindowData, serverInfo: ServerInfo | null): void;
    /** Register a callback for manual refresh (called from QuotaManager) */
    static setRefreshCallback(cb: () => Promise<void>): void;
    private constructor();
    refreshLocale(): void;
    dispose(): void;
    private updateData;
    private handleMessage;
    private exportMarkdown;
    private buildHtml;
    private renderEmpty;
    private renderDashboard;
    /** Render a single breakdown child node (and its sub-children). */
    private renderChild;
    /** Render a sub-child leaf node. */
    private renderSubChild;
    private getGroupMeta;
    private formatChildName;
    private isViewableStep;
}
