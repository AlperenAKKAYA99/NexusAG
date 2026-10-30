/**
 * Shared Usage Stats render components — SSOT for sidebar & detail panel.
 * Pure HTML-string generators. No DOM, no Node APIs, no side effects.
 * Used by: webview/renderers/usage.ts (sidebar) & providers/usageStatsPanel.ts (detail panel)
 */
import { DailyBucket, HourlyBucket, ModelBucket, CascadeBucket, MonthlyBucket, ProviderBucket, WeekdayBucket } from '../types';
export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;
export declare function setUsageTranslator(fn: TranslateFn): void;
export declare function tu(key: string, params?: Record<string, string | number>): string;
export declare const MONTH_KEYS: string[];
/** Format short date using localized month name from tu() (e.g. 11 Eki / 11 Oct) */
export declare function fmtShortDateI18n(iso: string): string;
export type UsageTotals = {
    input: number;
    output: number;
    cache?: number;
    cacheWrite?: number;
    reasoning?: number;
};
/** All token telemetry for a bucket/model/month. */
export declare function usageTotal(u: UsageTotals): number;
export declare function kpiCard(_icon: string, value: string, label: string, color?: string): string;
export declare function renderDailyBars(daily: DailyBucket[], costPerToken?: number): string;
export declare function renderHourlyHeatmap(hourly: HourlyBucket[], costPerToken?: number): string;
/**
 * @param large — if true, uses gh-grid-lg class for bigger cells (detail panel)
 * @param year — which year to render (defaults to current year)
 * @param costPerToken — blended cost per token for cost estimation
 */
export declare function renderDailyGrid(daily: DailyBucket[], large?: boolean, year?: number, costPerToken?: number): string;
/** Extract available years from daily data (sorted descending) */
export declare function getAvailableYears(daily: DailyBucket[]): number[];
/** Year selector buttons */
export declare function renderYearSelector(years: number[], activeYear: number): string;
export declare function renderModelBreakdown(models: ModelBucket[], totalTokens: number): string;
export declare function renderCascadeList(cascades: CascadeBucket[], limit?: number, maxTitleLen?: number): string;
/** Per-1M-token pricing — updated April 2026 */
export type PricingEntry = {
    input: number;
    output: number;
    cache: number;
    reasoning: number;
};
/** Register an external pricing resolver (e.g. LiteLLM dynamic catalog) */
export declare function setExternalPricingResolver(resolver: (displayName: string) => PricingEntry | null): void;
/** Override pricing at runtime (called from extension with VS Code settings) */
export declare function updatePricing(overrides: Record<string, Partial<PricingEntry>>): void;
/** Export current pricing for webview injection */
export declare function getPricing(): Record<string, PricingEntry>;
export declare function matchPricing(displayName: string): PricingEntry;
/** Smart dollar format: $0.42 for small, $15 for large */
export declare function fmtDollar(v: number): string;
/** Calculate total estimated cost from model data */
export declare function calculateTotalCost(models: ModelBucket[]): number;
/**
 * Compact model breakdown — sidebar version.
 * Shows only: model name + single bar + percentage. No in/cache/out detail.
 */
export declare function renderCompactModelBreakdown(models: ModelBucket[], totalTokens: number): string;
/** Extract unique years from monthly data (newest first) */
export declare function getMonthlyYears(monthly: MonthlyBucket[]): number[];
export declare function renderMonthlySummary(monthly: MonthlyBucket[], filterYear?: number): string;
export declare function renderProviderBreakdown(providers: ProviderBucket[], totalTokens: number): string;
export declare function renderWeekdayChart(weekday: WeekdayBucket[]): string;
export declare function renderEnrichedCascadeList(cascades: CascadeBucket[], models: ModelBucket[], limit?: number, maxTitleLen?: number): string;
export declare function renderCostEstimate(models: ModelBucket[]): string;
export declare function renderRangeBar(activeRange: string, cssPrefix?: string): string;
export declare function rangeLabel(state: string): string;
