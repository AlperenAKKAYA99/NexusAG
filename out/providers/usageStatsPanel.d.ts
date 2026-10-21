/**
 * UsageStatsPanel — Full-width editor tab for deep analytics dashboard.
 * Opens as a WebviewPanel (editor tab) with time-range filtering.
 * Uses shared components from usage-components.ts for DRY rendering.
 *
 * CSS lives in panel.css (SSOT). Formatting via shared/helpers.ts (DRY).
 */
import * as vscode from 'vscode';
import { DeepUsageStats } from '../types';
export declare class UsageStatsPanel {
    static currentPanel: UsageStatsPanel | undefined;
    private static readonly viewType;
    private readonly panel;
    private readonly extensionUri;
    private disposables;
    private lastStats;
    private currentRange;
    private currentGridYear;
    private currentMonthlyYear;
    /** Callback for range filter requests — set by the command registration */
    onRangeFilter?: (range: string) => DeepUsageStats | null;
    static createOrShow(extensionUri: vscode.Uri, stats: DeepUsageStats | null): void;
    private constructor();
    updateStats(stats: DeepUsageStats): void;
    updateLatestStats(stats: DeepUsageStats): void;
    refreshLocale(): void;
    dispose(): void;
    private buildHtml;
    private renderLoading;
    private renderDashboard;
    private renderHeroKpi;
    private renderRangeBar;
    private renderHeatmapCard;
    private renderWeekdayCard;
    private renderModelsCard;
    private renderMonthlyCard;
    private renderCostCard;
    private renderConversationsCard;
}
