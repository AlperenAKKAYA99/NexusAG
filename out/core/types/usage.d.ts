/** Time-bucketed token usage */
export interface TokenBucket {
    input: number;
    output: number;
    cache: number;
    cacheWrite: number;
    reasoning: number;
    calls: number;
}
/** Daily breakdown entry */
export interface DailyBucket extends TokenBucket {
    date: string;
}
/** Hourly breakdown entry (aggregated across all days) */
export interface HourlyBucket extends TokenBucket {
    hour: number;
}
/** Model breakdown entry */
export interface ModelBucket extends TokenBucket {
    displayName: string;
}
/** Cascade/conversation breakdown */
export interface CascadeBucket extends TokenBucket {
    id: string;
    title: string;
}
/** Provider breakdown entry */
export interface ProviderBucket extends TokenBucket {
    provider: string;
    displayName: string;
}
/** Day-of-week aggregation (Mon=0 .. Sun=6) */
export interface WeekdayBucket extends TokenBucket {
    day: number;
    label: string;
}
/** Monthly breakdown per model (for tooltip) */
export interface MonthlyModelEntry {
    displayName: string;
    tokens: number;
    cost: number;
    inp: number;
    out: number;
    cache: number;
    cacheWrite?: number;
    reas: number;
}
/** Calendar month bucket (filter-independent) */
export interface MonthlyBucket extends TokenBucket {
    key: string;
    label: string;
    total: number;
    cost: number;
    topModels: MonthlyModelEntry[];
}
/** Full deep analytics stats */
export interface DeepUsageStats {
    totalTokens: number;
    totalInput: number;
    totalOutput: number;
    totalCache: number;
    totalCacheWrite: number;
    totalReasoning: number;
    totalCalls: number;
    daysActive: number;
    cacheRate: number;
    dateRange: {
        from: string;
        to: string;
    };
    daily: DailyBucket[];
    hourly: HourlyBucket[];
    models: ModelBucket[];
    cascades: CascadeBucket[];
    providers: ProviderBucket[];
    weekday: WeekdayBucket[];
    monthly: MonthlyBucket[];
}
