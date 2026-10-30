"use strict";
/**
 * Shared Usage Stats render components — SSOT for sidebar & detail panel.
 * Pure HTML-string generators. No DOM, no Node APIs, no side effects.
 * Used by: webview/renderers/usage.ts (sidebar) & providers/usageStatsPanel.ts (detail panel)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUsageTranslator = setUsageTranslator;
exports.tu = tu;
exports.usageTotal = usageTotal;
exports.kpiCard = kpiCard;
exports.renderDailyBars = renderDailyBars;
exports.renderHourlyHeatmap = renderHourlyHeatmap;
exports.renderDailyGrid = renderDailyGrid;
exports.getAvailableYears = getAvailableYears;
exports.renderYearSelector = renderYearSelector;
exports.renderModelBreakdown = renderModelBreakdown;
exports.renderCascadeList = renderCascadeList;
exports.setExternalPricingResolver = setExternalPricingResolver;
exports.updatePricing = updatePricing;
exports.getPricing = getPricing;
exports.matchPricing = matchPricing;
exports.fmtDollar = fmtDollar;
exports.calculateTotalCost = calculateTotalCost;
exports.renderCompactModelBreakdown = renderCompactModelBreakdown;
exports.getMonthlyYears = getMonthlyYears;
exports.renderMonthlySummary = renderMonthlySummary;
exports.renderProviderBreakdown = renderProviderBreakdown;
exports.renderWeekdayChart = renderWeekdayChart;
exports.renderEnrichedCascadeList = renderEnrichedCascadeList;
exports.renderCostEstimate = renderCostEstimate;
exports.renderRangeBar = renderRangeBar;
exports.rangeLabel = rangeLabel;
const helpers_1 = require("./helpers");
const uiConstants_1 = require("./uiConstants");
let activeTranslator = (key) => key;
function setUsageTranslator(fn) {
    activeTranslator = fn;
}
function tu(key, params) {
    return activeTranslator(key, params);
}
/** All token telemetry for a bucket/model/month. */
function usageTotal(u) {
    return u.input + u.output + (u.cache || 0) + (u.cacheWrite || 0) + (u.reasoning || 0);
}
// ═══════════════════════════════════════════
//  KPI Cards
// ═══════════════════════════════════════════
function kpiCard(_icon, value, label, color = '') {
    const style = color ? ` style="border-color:${color}33"` : '';
    const dot = color ? `<span class="deep-kpi-dot" style="background:${color}"></span>` : '';
    return `<div class="deep-kpi"${style}>`
        + '<div class="deep-kpi-val">' + value + '</div>'
        + '<div class="deep-kpi-label">' + dot + label + '</div>'
        + '</div>';
}
// ═══════════════════════════════════════════
//  Daily Breakdown Bars
// ═══════════════════════════════════════════
function renderDailyBars(daily, costPerToken = 0) {
    if (!daily || daily.length === 0)
        return '<div class="deep-empty">' + tu('usage.noDataPeriod') + '</div>';
    const sorted = [...daily].sort((a, b) => b.date.localeCompare(a.date));
    const maxTokens = Math.max(...sorted.map(d => usageTotal(d)), 1);
    let html = '<div class="deep-daily-chart">';
    for (const d of sorted) {
        const total = usageTotal(d);
        const barW = (total / maxTokens) * 100;
        const inPct = total > 0 ? (d.input / total * barW) : 0;
        const caPct = total > 0 ? (d.cache / total * barW) : 0;
        const ouPct = total > 0 ? (d.output / total * barW) : 0;
        const rePct = total > 0 ? ((d.reasoning || 0) / total * barW) : 0;
        let tipText = (0, helpers_1.fmtShortDate)(d.date) + '&#10;' + tu('dashboard.costInput') + ': ' + (0, helpers_1.fmtBig)(d.input) + '&#10;' + tu('dashboard.costCache') + ': ' + (0, helpers_1.fmtBig)(d.cache) + '&#10;' + tu('dashboard.costOutput') + ': ' + (0, helpers_1.fmtBig)(d.output) + '&#10;' + tu('dashboard.costTotal') + ': ' + (0, helpers_1.fmtBig)(total) + ' (' + (0, helpers_1.fmtNum)(d.calls) + ' ' + tu('common.calls') + ')';
        if (costPerToken > 0) {
            tipText += '&#10;' + tu('usage.estCost') + ': ' + fmtDollar(total * costPerToken);
        }
        html += '<div class="deep-daily-row" data-tip="' + tipText + '">';
        html += '<span class="deep-daily-date">' + (0, helpers_1.fmtShortDate)(d.date) + '</span>';
        html += '<div class="deep-daily-bar">';
        if (inPct > 0)
            html += '<div class="usage-bar-seg usage-c-input" style="width:' + inPct.toFixed(1) + '%"></div>';
        if (caPct > 0)
            html += '<div class="usage-bar-seg usage-c-cache" style="width:' + caPct.toFixed(1) + '%"></div>';
        if (ouPct > 0)
            html += '<div class="usage-bar-seg usage-c-output" style="width:' + ouPct.toFixed(1) + '%"></div>';
        if (rePct > 0)
            html += '<div class="usage-bar-seg usage-c-reasoning" style="width:' + rePct.toFixed(1) + '%"></div>';
        html += '</div>';
        html += '<span class="deep-daily-total">' + (0, helpers_1.fmtBig)(total) + '</span>';
        html += '</div>';
    }
    html += '</div>';
    return html;
}
// ═══════════════════════════════════════════
//  Hourly Heatmap (24-hour pattern)
// ═══════════════════════════════════════════
function renderHourlyHeatmap(hourly, costPerToken = 0) {
    if (!hourly || hourly.length === 0)
        return '';
    const maxTokens = Math.max(...hourly.map(h => usageTotal(h)), 1);
    const peakHour = hourly.reduce((best, cur) => usageTotal(cur) > usageTotal(best) ? cur : best, hourly[0]);
    let html = '<div class="deep-heatmap-wrap">';
    html += '<div class="deep-heatmap">';
    for (const h of hourly) {
        const total = usageTotal(h);
        const intensity = maxTokens > 0 ? (total / maxTokens) : 0;
        const isPeak = h.hour === peakHour.hour;
        const cls = isPeak ? ' deep-heatmap-peak' : '';
        const tipCls = h.hour <= 2 ? ' tip-right' : h.hour >= 22 ? ' tip-left' : '';
        let tipText = `${String(h.hour).padStart(2, '0')}:00`;
        tipText += `&#10;${tu('dashboard.totalTokens')}: ${(0, helpers_1.fmtBig)(total)}`;
        tipText += `&#10;${tu('common.calls')}: ${(0, helpers_1.fmtNum)(h.calls)}`;
        if (total > 0) {
            tipText += `&#10;${tu('dashboard.costInput')}: ${(0, helpers_1.fmtBig)(h.input)}`;
            tipText += `&#10;${tu('dashboard.costCache')}: ${(0, helpers_1.fmtBig)(h.cache)}`;
            tipText += `&#10;${tu('dashboard.costOutput')}: ${(0, helpers_1.fmtBig)(h.output)}`;
        }
        if (costPerToken > 0 && total > 0) {
            tipText += `&#10;${tu('usage.estCost')}: ~${fmtDollar(total * costPerToken)}`;
        }
        html += `<div class="deep-heatmap-cell${cls}${tipCls}" style="--intensity:${intensity.toFixed(3)}" data-tip="${tipText}">`;
        html += '<span class="deep-heatmap-hour">' + h.hour + '</span>';
        html += '</div>';
    }
    html += '</div>';
    html += '<div class="deep-heatmap-info">' + tu('dashboard.peak') + ' <strong>' + String(peakHour.hour).padStart(2, '0') + ':00</strong> (' + (0, helpers_1.fmtBig)(usageTotal(peakHour)) + ')</div>';
    html += '</div>';
    return html;
}
// ═══════════════════════════════════════════
//  GitHub-style Daily Contribution Grid
// ═══════════════════════════════════════════
const DAY_KEYS = ['dashboard.days.mon', '', 'dashboard.days.wed', '', 'dashboard.days.fri', '', ''];
const MONTH_KEYS = [
    'dashboard.months.jan', 'dashboard.months.feb', 'dashboard.months.mar',
    'dashboard.months.apr', 'dashboard.months.may', 'dashboard.months.jun',
    'dashboard.months.jul', 'dashboard.months.aug', 'dashboard.months.sep',
    'dashboard.months.oct', 'dashboard.months.nov', 'dashboard.months.dec',
];
/**
 * @param large — if true, uses gh-grid-lg class for bigger cells (detail panel)
 * @param year — which year to render (defaults to current year)
 * @param costPerToken — blended cost per token for cost estimation
 */
function renderDailyGrid(daily, large = false, year, costPerToken = 0) {
    const selectedYear = year ?? new Date().getFullYear();
    const today = new Date().toISOString().slice(0, 10);
    // Build date → tokens lookup
    const dateMap = new Map();
    for (const d of daily) {
        if (!d.date.startsWith(String(selectedYear)))
            continue; // filter to selected year
        const total = usageTotal(d);
        dateMap.set(d.date, { total, calls: d.calls });
    }
    // Full year: Jan 1 → Dec 31
    const gridStartDate = new Date(selectedYear, 0, 1); // Jan 1
    const gridEndDate = new Date(selectedYear, 11, 31); // Dec 31
    // Align start to Monday
    const startDay = gridStartDate.getDay();
    const mondayOffset = startDay === 0 ? -6 : 1 - startDay;
    const gridStart = new Date(gridStartDate);
    gridStart.setDate(gridStart.getDate() + mondayOffset);
    // Extend end to Sunday
    const endDay = gridEndDate.getDay();
    const sundayOffset = endDay === 0 ? 0 : 7 - endDay;
    const gridEnd = new Date(gridEndDate);
    gridEnd.setDate(gridEnd.getDate() + sundayOffset);
    const maxTokens = Math.max(...Array.from(dateMap.values()).map(v => v.total), 1);
    const weeks = [];
    let currentWeek = [];
    const cursor = new Date(gridStart);
    let peakDay = { date: '', total: 0, calls: 0 };
    while (cursor <= gridEnd) {
        const iso = cursor.toISOString().slice(0, 10);
        const data = dateMap.get(iso);
        const total = data?.total || 0;
        const calls = data?.calls || 0;
        const future = iso > today;
        currentWeek.push({ date: iso, total, calls, future });
        if (total > peakDay.total)
            peakDay = { date: iso, total, calls };
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
        cursor.setDate(cursor.getDate() + 1);
    }
    if (currentWeek.length > 0)
        weeks.push(currentWeek);
    // Month labels
    const lgCls = large ? ' gh-grid-lg' : '';
    let html = '<div class="gh-grid-wrap' + lgCls + '">';
    html += '<div class="gh-month-row"><span class="gh-day-label"></span>';
    let lastMonth = -1;
    for (const week of weeks) {
        const m = new Date(week[0].date + 'T00:00:00').getMonth();
        html += '<span class="gh-month-label">' + (m !== lastMonth ? tu(MONTH_KEYS[m]) : '') + '</span>';
        if (m !== lastMonth)
            lastMonth = m;
    }
    html += '</div>';
    // Grid
    html += '<div class="gh-grid">';
    html += '<div class="gh-day-col">';
    for (let row = 0; row < 7; row++)
        html += '<span class="gh-day-label">' + (DAY_KEYS[row] ? tu(DAY_KEYS[row]) : '') + '</span>';
    html += '</div>';
    for (const week of weeks) {
        html += '<div class="gh-week-col">';
        for (const cell of week) {
            const level = cell.future ? 0
                : cell.total === 0 ? 0
                    : (cell.total / maxTokens) < 0.15 ? 1
                        : (cell.total / maxTokens) < 0.35 ? 2
                            : (cell.total / maxTokens) < 0.65 ? 3 : 4;
            const costStr = (costPerToken > 0 && cell.total > 0) ? '&#10;~' + fmtDollar(cell.total * costPerToken) : '';
            const title = cell.future ? (0, helpers_1.fmtShortDate)(cell.date)
                : (0, helpers_1.fmtShortDate)(cell.date) + '&#10;' + (cell.total > 0 ? (0, helpers_1.fmtBig)(cell.total) + ' ' + tu('common.tokens') + '&#10;' + (0, helpers_1.fmtNum)(cell.calls) + ' ' + tu('common.calls') + costStr : tu('dashboard.noActivity'));
            html += '<div class="gh-cell gh-lvl-' + level + '" data-tip="' + title + '"></div>';
        }
        html += '</div>';
    }
    html += '</div>';
    // Legend + Peak
    html += '<div class="gh-footer">';
    html += '<span class="gh-legend">' + tu('dashboard.less') + ' <span class="gh-cell gh-lvl-0 gh-sm"></span><span class="gh-cell gh-lvl-1 gh-sm"></span><span class="gh-cell gh-lvl-2 gh-sm"></span><span class="gh-cell gh-lvl-3 gh-sm"></span><span class="gh-cell gh-lvl-4 gh-sm"></span> ' + tu('dashboard.moreLegend') + '</span>';
    if (peakDay.total > 0) {
        html += '<span class="gh-peak">' + tu('dashboard.peak') + ' <strong>' + (0, helpers_1.fmtShortDate)(peakDay.date) + '</strong> (' + (0, helpers_1.fmtBig)(peakDay.total) + ')</span>';
    }
    html += '</div>';
    html += '</div>';
    return html;
}
/** Extract available years from daily data (sorted descending) */
function getAvailableYears(daily) {
    if (!daily || daily.length === 0)
        return [new Date().getFullYear()];
    const years = new Set();
    for (const d of daily) {
        if (d.date.length >= 4)
            years.add(parseInt(d.date.slice(0, 4), 10));
    }
    return Array.from(years).sort((a, b) => b - a); // newest first
}
/** Year selector buttons */
function renderYearSelector(years, activeYear) {
    if (years.length <= 1)
        return ''; // single year — no need for selector
    let html = '<div class="gh-year-bar">';
    for (const y of years) {
        const active = y === activeYear ? ' active' : '';
        html += '<button class="gh-year-btn' + active + '" data-action="set-grid-year" data-year="' + y + '">' + y + '</button>';
    }
    html += '</div>';
    return html;
}
// ═══════════════════════════════════════════
//  Model Breakdown
// ═══════════════════════════════════════════
function renderModelBreakdown(models, totalTokens) {
    if (!models || models.length === 0)
        return '';
    let html = '';
    for (const m of models) {
        const mTotal = usageTotal(m);
        const pct = totalTokens > 0 ? (mTotal / totalTokens * 100).toFixed(1) : '0';
        const barPct = totalTokens > 0 ? (mTotal / totalTokens * 100) : 0;
        html += '<div class="deep-model">';
        // Header: name + total + pct
        html += '<div class="deep-model-hdr">';
        html += '<span class="deep-model-name">' + (0, helpers_1.escHtml)(m.displayName) + '</span>';
        html += '<span class="deep-model-stats">' + (0, helpers_1.fmtNum)(mTotal) + ' <span class="deep-model-pct">' + pct + '%</span></span>';
        html += '</div>';
        // Stacked progress bar (input + cache + output)
        html += '<div class="deep-model-bar">';
        if (mTotal > 0) {
            const inW = (m.input / mTotal * 100).toFixed(1);
            const caW = (m.cache / mTotal * 100).toFixed(1);
            const ouW = (m.output / mTotal * 100).toFixed(1);
            const reW = ((m.reasoning || 0) / mTotal * 100).toFixed(1);
            html += '<div class="usage-bar-seg usage-c-input" style="width:' + inW + '%"></div>';
            html += '<div class="usage-bar-seg usage-c-cache" style="width:' + caW + '%"></div>';
            html += '<div class="usage-bar-seg usage-c-output" style="width:' + ouW + '%"></div>';
            if ((m.reasoning || 0) > 0)
                html += '<div class="usage-bar-seg usage-c-reasoning" style="width:' + reW + '%"></div>';
        }
        else {
            html += '<div class="deep-model-fill" style="width:0%"></div>';
        }
        html += '</div>';
        // Detail: ● input · ● cache · ● output
        html += '<div class="deep-model-detail">';
        html += '<span><span class="usage-dot usage-c-input"></span>' + (0, helpers_1.fmtNum)(m.input) + ' ' + tu('dashboard.in') + '</span>';
        html += '<span><span class="usage-dot usage-c-cache"></span>' + (0, helpers_1.fmtNum)(m.cache) + ' ' + tu('dashboard.cache') + '</span>';
        html += '<span><span class="usage-dot usage-c-output"></span>' + (0, helpers_1.fmtNum)(m.output) + ' ' + tu('dashboard.out') + '</span>';
        if ((m.reasoning || 0) > 0) {
            html += '<span><span class="usage-dot usage-c-reasoning"></span>' + (0, helpers_1.fmtNum)(m.reasoning) + ' ' + tu('dashboard.reas') + '</span>';
        }
        html += '</div>';
        html += '<div class="deep-model-calls">' + (0, helpers_1.fmtNum)(m.calls) + ' ' + tu('dashboard.calls') + '</div>';
        html += '</div>';
    }
    return html;
}
// ═══════════════════════════════════════════
//  Cascade / Conversation List
// ═══════════════════════════════════════════
function renderCascadeList(cascades, limit = uiConstants_1.CASCADE_LIST_LIMIT, maxTitleLen = uiConstants_1.CASCADE_TITLE_MAX_LEN) {
    const shown = cascades.slice(0, limit);
    let html = '<div class="deep-cascade-list">';
    for (const c of shown) {
        const total = usageTotal(c);
        const title = c.title || tu('dashboard.conversation');
        const short = title.length > maxTitleLen ? title.substring(0, maxTitleLen) + '…' : title;
        html += '<div class="deep-cascade-row">';
        html += '<span class="deep-cascade-title">' + (0, helpers_1.escHtml)(short) + '</span>';
        html += '<span class="deep-cascade-tokens">' + (0, helpers_1.fmtBig)(total) + '</span>';
        html += '</div>';
    }
    if (cascades.length > limit) {
        html += '<div class="deep-cascade-more">+' + (cascades.length - limit) + ' ' + tu('dashboard.more') + '</div>';
    }
    html += '</div>';
    return html;
}
/** External pricing resolver — injected by extension at boot (e.g. LiteLLM catalog) */
let externalResolver = null;
/** Register an external pricing resolver (e.g. LiteLLM dynamic catalog) */
function setExternalPricingResolver(resolver) {
    externalResolver = resolver;
}
let pricing = {
    // Claude family (Anthropic) — reasoning = output rate per Anthropic pricing
    opus: { input: 5.00, output: 25.00, cache: 0.50, reasoning: 25.00 },
    sonnet: { input: 3.00, output: 15.00, cache: 0.30, reasoning: 15.00 },
    haiku: { input: 1.00, output: 5.00, cache: 0.10, reasoning: 5.00 },
    // Gemini 3.8 family (Antigravity ≥ 2.27.0)
    'gemini-3.8-flash-high': { input: 0.60, output: 3.50, cache: 0.06, reasoning: 3.50 },
    'gemini-3.8-flash-medium': { input: 0.50, output: 3.00, cache: 0.05, reasoning: 3.00 },
    'gemini-3.8-flash-low': { input: 0.40, output: 2.50, cache: 0.04, reasoning: 2.50 },
    // Gemini 3.x family
    'gemini-3-pro': { input: 2.00, output: 12.00, cache: 0.20, reasoning: 12.00 },
    'gemini-3-flash': { input: 0.50, output: 3.00, cache: 0.05, reasoning: 3.00 },
    // Gemini 2.5 family (deprecated June 2026)
    'gemini-2-pro': { input: 1.25, output: 10.00, cache: 0.125, reasoning: 10.00 },
    'gemini-2-flash': { input: 0.30, output: 2.50, cache: 0.03, reasoning: 2.50 },
    'flash-lite': { input: 0.10, output: 0.40, cache: 0.01, reasoning: 0.40 },
    // Other
    'gpt-oss': { input: 2.50, output: 10.00, cache: 0.25, reasoning: 10.00 },
};
/** Override pricing at runtime (called from extension with VS Code settings) */
function updatePricing(overrides) {
    for (const [key, val] of Object.entries(overrides)) {
        if (val && typeof val.input === 'number') {
            pricing[key] = {
                input: val.input ?? pricing[key]?.input ?? 3,
                output: val.output ?? pricing[key]?.output ?? 15,
                cache: val.cache ?? pricing[key]?.cache ?? 0.3,
                reasoning: val.reasoning ?? val.output ?? pricing[key]?.reasoning ?? 15,
            };
        }
    }
}
/** Export current pricing for webview injection */
function getPricing() {
    return { ...pricing };
}
function matchPricing(displayName) {
    // 1. External resolver (LiteLLM dynamic catalog — highest priority after settings override)
    if (externalResolver) {
        const external = externalResolver(displayName);
        if (external)
            return external;
    }
    // 2. Hardcoded fallback — keyword-based heuristic matching
    const lower = displayName.toLowerCase();
    // Claude tiers
    if (lower.includes('opus'))
        return pricing['opus'];
    if (lower.includes('haiku'))
        return pricing['haiku'];
    if (lower.includes('sonnet'))
        return pricing['sonnet'];
    // Gemini tiers — version-aware (3.8 vs 3.x vs 2.5)
    if (lower.includes('flash lite') || lower.includes('flash-lite'))
        return pricing['flash-lite'];
    if (lower.includes('checkpoint'))
        return { input: 0, output: 0, cache: 0, reasoning: 0 };
    const is38 = lower.includes('3.8') || lower.includes('3_8');
    const is25 = lower.includes('2.5') || lower.includes('2_5');
    if (is38 && lower.includes('flash')) {
        if (lower.includes('high'))
            return pricing['gemini-3.8-flash-high'];
        if (lower.includes('low'))
            return pricing['gemini-3.8-flash-low'];
        return pricing['gemini-3.8-flash-medium'];
    }
    if (lower.includes('flash'))
        return pricing[is25 ? 'gemini-2-flash' : 'gemini-3-flash'];
    if (lower.includes('pro') || lower.includes('gemini'))
        return pricing[is25 ? 'gemini-2-pro' : 'gemini-3-pro'];
    // GPT
    if (lower.includes('gpt'))
        return pricing['gpt-oss'];
    return pricing['sonnet']; // fallback
}
/** Smart dollar format: $0.42 for small, $15 for large */
function fmtDollar(v) {
    if (v < 0.01)
        return '$0';
    if (v < 1)
        return '$' + v.toFixed(2);
    if (v < 10)
        return '$' + v.toFixed(1);
    return '$' + Math.round(v).toLocaleString();
}
/** Calculate total estimated cost from model data */
function calculateTotalCost(models) {
    if (!models || models.length === 0)
        return 0;
    let total = 0;
    for (const m of models) {
        const p = matchPricing(m.displayName);
        total += (m.input / 1e6) * p.input
            + ((m.cache || 0) / 1e6) * p.cache
            + ((m.cacheWrite || 0) / 1e6) * (p.input * 1.25)
            + (m.output / 1e6) * p.output
            + ((m.reasoning || 0) / 1e6) * p.reasoning;
    }
    return total;
}
/**
 * Compact model breakdown — sidebar version.
 * Shows only: model name + single bar + percentage. No in/cache/out detail.
 */
function renderCompactModelBreakdown(models, totalTokens) {
    if (!models || models.length === 0)
        return '';
    let html = '';
    for (const m of models) {
        const mTotal = usageTotal(m);
        const pct = totalTokens > 0 ? (mTotal / totalTokens * 100).toFixed(1) : '0';
        const barPct = totalTokens > 0 ? (mTotal / totalTokens * 100) : 0;
        html += '<div class="deep-model-compact">';
        html += '<div class="deep-model-hdr">';
        html += '<span class="deep-model-name">' + (0, helpers_1.escHtml)(m.displayName) + '</span>';
        html += '<span class="deep-model-pct">' + pct + '%</span>';
        html += '</div>';
        html += '<div class="deep-model-bar"><div class="usage-bar-seg usage-c-input" style="width:' + barPct.toFixed(1) + '%"></div></div>';
        html += '<div class="deep-model-detail">';
        html += '<span><span class="usage-dot usage-c-input"></span>' + (0, helpers_1.fmtBig)(m.input) + '</span>';
        html += '<span><span class="usage-dot usage-c-cache"></span>' + (0, helpers_1.fmtBig)(m.cache || 0) + '</span>';
        html += '<span><span class="usage-dot usage-c-output"></span>' + (0, helpers_1.fmtBig)(m.output) + '</span>';
        if ((m.reasoning || 0) > 0) {
            html += '<span><span class="usage-dot usage-c-reasoning"></span>' + (0, helpers_1.fmtBig)(m.reasoning) + ' ' + tu('dashboard.reas') + '</span>';
        }
        html += '</div>';
        html += '</div>';
    }
    return html;
}
// ═══════════════════════════════════════════
//  Monthly Column Chart (calendar year, filter-independent)
// ═══════════════════════════════════════════
/** Estimate cost for a single month bucket using per-model pricing */
function estimateTopModelCosts(m) {
    return m.topModels.map(tm => {
        const p = matchPricing(tm.displayName);
        const cost = (tm.inp * p.input + tm.cache * p.cache + (tm.cacheWrite || 0) * (p.input * 1.25) + tm.out * p.output + tm.reas * p.reasoning) / 1_000_000;
        return { ...tm, cost };
    });
}
/** Extract unique years from monthly data (newest first) */
function getMonthlyYears(monthly) {
    if (!monthly || monthly.length === 0)
        return [new Date().getFullYear()];
    const years = new Set();
    for (const m of monthly) {
        if (m.key.length >= 4)
            years.add(parseInt(m.key.slice(0, 4), 10));
    }
    return Array.from(years).sort((a, b) => b - a); // newest first
}
function renderMonthlySummary(monthly, filterYear) {
    if (!monthly || monthly.length === 0)
        return '';
    // Filter to selected year (if provided), otherwise show all
    const MNAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let displayMonths;
    if (filterYear) {
        // Build full Jan-Dec for the year, filling gaps with empties
        const yearMap = new Map();
        for (const m of monthly) {
            if (m.key.startsWith(String(filterYear))) {
                yearMap.set(parseInt(m.key.slice(5, 7), 10) - 1, m);
            }
        }
        displayMonths = [];
        for (let i = 0; i < 12; i++) {
            displayMonths.push(yearMap.get(i) || {
                key: `${filterYear}-${String(i + 1).padStart(2, '0')}`,
                label: MNAMES[i],
                input: 0, output: 0, cache: 0, cacheWrite: 0, reasoning: 0, calls: 0,
                total: 0, cost: 0, topModels: [],
            });
        }
    }
    else {
        displayMonths = monthly;
    }
    if (displayMonths.length === 0)
        return '';
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const maxTotal = Math.max(...displayMonths.map(m => m.total), 1);
    const BAR_HEIGHT = 110;
    let html = '<div class="deep-mchart">';
    for (const m of displayMonths) {
        const topModels = estimateTopModelCosts(m);
        const isCurrent = m.key === currentMonthKey;
        const isEmpty = m.total === 0;
        const totalH = (m.total / maxTotal) * BAR_HEIGHT;
        const inH = m.total > 0 ? (m.input / m.total * totalH) : 0;
        const caH = m.total > 0 ? (m.cache / m.total * totalH) : 0;
        const ouH = m.total > 0 ? (m.output / m.total * totalH) : 0;
        const reH = m.total > 0 ? ((m.reasoning || 0) / m.total * totalH) : 0;
        const colCls = 'deep-mcol' + (isCurrent ? ' deep-mcol-current' : '') + (isEmpty ? ' deep-mcol-empty' : '');
        html += '<div class="' + colCls + '">';
        // Custom floating tooltip
        if (!isEmpty) {
            html += '<div class="deep-mcol-tip">';
            html += '<div class="deep-mcol-tip-hdr">' + m.label + (isCurrent ? ' <span class="deep-mcol-tip-badge">' + tu('dashboard.current') + '</span>' : '') + '</div>';
            html += '<div class="deep-mcol-tip-row"><span>' + tu('dashboard.totalTokens') + '</span><span>' + (0, helpers_1.fmtBig)(m.total) + '</span></div>';
            html += '<div class="deep-mcol-tip-row"><span>' + tu('usage.estCost') + '</span><span class="deep-mcol-tip-cost">' + fmtDollar(m.cost) + '</span></div>';
            html += '<div class="deep-mcol-tip-row"><span>' + tu('dashboard.calls') + '</span><span>' + (0, helpers_1.fmtNum)(m.calls) + '</span></div>';
            html += '<div class="deep-mcol-tip-sep"></div>';
            html += '<div class="deep-mcol-tip-row"><span class="deep-mcol-tip-dotlabel"><span class="deep-mcol-tip-dot" style="background:#4f9cf7"></span>' + tu('dashboard.costInput') + '</span><span>' + (0, helpers_1.fmtBig)(m.input) + '</span></div>';
            html += '<div class="deep-mcol-tip-row"><span class="deep-mcol-tip-dotlabel"><span class="deep-mcol-tip-dot" style="background:#a78bfa"></span>' + tu('dashboard.costCache') + '</span><span>' + (0, helpers_1.fmtBig)(m.cache) + '</span></div>';
            html += '<div class="deep-mcol-tip-row"><span class="deep-mcol-tip-dotlabel"><span class="deep-mcol-tip-dot" style="background:#4ade80"></span>' + tu('dashboard.costOutput') + '</span><span>' + (0, helpers_1.fmtBig)(m.output) + '</span></div>';
            if (m.reasoning > 0) {
                html += '<div class="deep-mcol-tip-row"><span class="deep-mcol-tip-dotlabel"><span class="deep-mcol-tip-dot" style="background:#f59e0b"></span>' + tu('dashboard.costReas') + '</span><span>' + (0, helpers_1.fmtBig)(m.reasoning) + '</span></div>';
            }
            if (topModels.length > 0) {
                html += '<div class="deep-mcol-tip-sep"></div>';
                html += '<div class="deep-mcol-tip-models-hdr">' + tu('dashboard.costModel') + 's</div>';
                for (const tm of topModels.slice(0, 5)) {
                    html += '<div class="deep-mcol-tip-model">';
                    html += '<span>' + (0, helpers_1.escHtml)(tm.displayName) + '</span>';
                    html += '<span>' + (0, helpers_1.fmtBig)(tm.tokens) + ' · ' + fmtDollar(tm.cost) + '</span>';
                    html += '</div>';
                }
            }
            html += '</div>';
        }
        // Value above bar
        if (!isEmpty) {
            html += '<div class="deep-mcol-val">' + fmtDollar(m.cost) + '</div>';
        }
        else {
            html += '<div class="deep-mcol-val deep-mcol-val-empty">—</div>';
        }
        // Stacked bar
        html += '<div class="deep-mcol-stack" style="height:' + BAR_HEIGHT + 'px">';
        if (!isEmpty) {
            if (reH > 0)
                html += '<div class="deep-mcol-seg" style="height:' + reH.toFixed(1) + 'px;background:#f59e0b"></div>';
            html += '<div class="deep-mcol-seg" style="height:' + ouH.toFixed(1) + 'px;background:#4ade80"></div>';
            html += '<div class="deep-mcol-seg" style="height:' + caH.toFixed(1) + 'px;background:#a78bfa"></div>';
            html += '<div class="deep-mcol-seg" style="height:' + inH.toFixed(1) + 'px;background:#4f9cf7"></div>';
        }
        else {
            html += '<div class="deep-mcol-seg deep-mcol-ghost" style="height:4px"></div>';
        }
        html += '</div>';
        // Month label
        html += '<div class="deep-mcol-lbl">' + m.label + '</div>';
        // Call count
        if (!isEmpty) {
            html += '<div class="deep-mcol-sub">' + (0, helpers_1.fmtBig)(m.total) + '</div>';
        }
        html += '</div>';
    }
    // Legend
    html += '</div>';
    html += '<div class="deep-mchart-legend">';
    html += '<span class="deep-mchart-legend-item"><span class="usage-dot usage-c-input"></span><span>' + tu('dashboard.costInput') + '</span></span>';
    html += '<span class="deep-mchart-legend-item"><span class="usage-dot usage-c-cache"></span><span>' + tu('dashboard.costCache') + '</span></span>';
    html += '<span class="deep-mchart-legend-item"><span class="usage-dot usage-c-output"></span><span>' + tu('dashboard.costOutput') + '</span></span>';
    html += '<span class="deep-mchart-legend-item"><span class="usage-dot usage-c-reasoning"></span><span>' + tu('dashboard.costReas') + '</span></span>';
    html += '</div>';
    return html;
}
// ═══════════════════════════════════════════
//  Provider Breakdown
// ═══════════════════════════════════════════
const PROVIDER_COLORS = {
    'Claude (Vertex)': '#a78bfa', // purple for Anthropic
    'Gemini': '#4f9cf7', // blue for Google
    'OpenAI': '#4ade80', // green for OpenAI
};
function renderProviderBreakdown(providers, totalTokens) {
    if (!providers || providers.length === 0)
        return '<div class="deep-empty">' + tu('dashboard.noData') + '</div>';
    let html = '<div class="provider-breakdown">';
    // Stacked horizontal bar
    html += '<div class="provider-stack-bar">';
    for (const p of providers) {
        const total = usageTotal(p);
        const pct = totalTokens > 0 ? (total / totalTokens * 100) : 0;
        if (pct < 0.5)
            continue;
        const color = PROVIDER_COLORS[p.displayName] || '#666';
        html += `<div class="provider-stack-seg" style="width:${pct.toFixed(1)}%;background:${color}" title="${(0, helpers_1.escHtml)(p.displayName)}: ${pct.toFixed(1)}%"></div>`;
    }
    html += '</div>';
    // Legend rows
    for (const p of providers) {
        const total = usageTotal(p);
        const pct = totalTokens > 0 ? (total / totalTokens * 100).toFixed(1) : '0';
        const color = PROVIDER_COLORS[p.displayName] || '#666';
        html += '<div class="provider-row">';
        html += `<span class="provider-dot" style="background:${color}"></span>`;
        html += `<span class="provider-name">${(0, helpers_1.escHtml)(p.displayName)}</span>`;
        html += `<span class="provider-pct">${pct}%</span>`;
        html += `<span class="provider-tokens">${(0, helpers_1.fmtBig)(total)}</span>`;
        html += `<span class="provider-calls">${(0, helpers_1.fmtNum)(p.calls)} ${tu('dashboard.calls')}</span>`;
        html += '</div>';
    }
    html += '</div>';
    return html;
}
// ═══════════════════════════════════════════
//  Day-of-Week Distribution
// ═══════════════════════════════════════════
function renderWeekdayChart(weekday) {
    if (!weekday || weekday.length === 0)
        return '<div class="deep-empty">' + tu('dashboard.noData') + '</div>';
    const maxCalls = Math.max(...weekday.map(w => w.calls), 1);
    const peakDay = weekday.reduce((a, b) => b.calls > a.calls ? b : a);
    const BAR_H = 80;
    let html = '<div class="weekday-chart">';
    for (const w of weekday) {
        const h = (w.calls / maxCalls) * BAR_H;
        const total = w.input + w.output + w.cache;
        const isPeak = w.day === peakDay.day;
        const cls = 'weekday-col' + (isPeak ? ' weekday-peak' : '');
        html += `<div class="${cls}">`;
        html += `<div class="weekday-val">${(0, helpers_1.fmtNum)(w.calls)}</div>`;
        html += `<div class="weekday-bar-wrap" style="height:${BAR_H}px">`;
        html += `<div class="weekday-bar" style="height:${h.toFixed(1)}px"></div>`;
        html += '</div>';
        html += `<div class="weekday-lbl">${w.label}</div>`;
        html += '</div>';
    }
    html += '</div>';
    // Summary line
    const weekdayCalls = weekday.filter(w => w.day < 5).reduce((s, w) => s + w.calls, 0);
    const weekendCalls = weekday.filter(w => w.day >= 5).reduce((s, w) => s + w.calls, 0);
    const total = weekdayCalls + weekendCalls;
    const weekdayPct = total > 0 ? Math.round(weekdayCalls / total * 100) : 0;
    const weekendPct = 100 - weekdayPct;
    html += `<div class="weekday-summary">${tu('dashboard.weekdaySummary', { weekdayPct, weekendPct, peak: peakDay.label })}</div>`;
    return html;
}
// ═══════════════════════════════════════════
//  Enriched Cascade List (with cost + mini bar)
// ═══════════════════════════════════════════
/** Render a single cascade row — shared between shown and overflow sections */
function renderCascadeRow(c, cpt, maxTokens, maxTitleLen) {
    const total = usageTotal(c);
    const cost = total * cpt;
    const title = c.title || tu('dashboard.conversation');
    const short = title.length > maxTitleLen ? title.substring(0, maxTitleLen) + '…' : title;
    const barW = (total / maxTokens * 100);
    const inPct = total > 0 ? (c.input / total * barW) : 0;
    const caPct = total > 0 ? (c.cache / total * barW) : 0;
    const ouPct = total > 0 ? (c.output / total * barW) : 0;
    const rePct = total > 0 ? ((c.reasoning || 0) / total * barW) : 0;
    let html = '<div class="cascade-row">';
    html += '<div class="cascade-header">';
    html += `<span class="cascade-title">${(0, helpers_1.escHtml)(short)}</span>`;
    html += `<span class="cascade-cost">${fmtDollar(cost)}</span>`;
    html += '</div>';
    html += '<div class="cascade-meta">';
    html += '<div class="cascade-bar">';
    if (inPct > 0)
        html += `<div class="usage-bar-seg usage-c-input" style="width:${inPct.toFixed(1)}%"></div>`;
    if (caPct > 0)
        html += `<div class="usage-bar-seg usage-c-cache" style="width:${caPct.toFixed(1)}%"></div>`;
    if (ouPct > 0)
        html += `<div class="usage-bar-seg usage-c-output" style="width:${ouPct.toFixed(1)}%"></div>`;
    if (rePct > 0)
        html += `<div class="usage-bar-seg usage-c-reasoning" style="width:${rePct.toFixed(1)}%"></div>`;
    html += '</div>';
    html += `<span class="cascade-stats">${(0, helpers_1.fmtBig)(total)} · ${(0, helpers_1.fmtNum)(c.calls)} ${tu('dashboard.calls')}</span>`;
    html += '</div>';
    html += '</div>';
    return html;
}
function renderEnrichedCascadeList(cascades, models, limit = uiConstants_1.CASCADE_ENRICHED_LIMIT, maxTitleLen = uiConstants_1.CASCADE_ENRICHED_TITLE_MAX_LEN) {
    const shown = cascades.slice(0, limit);
    if (shown.length === 0)
        return '<div class="deep-empty">' + tu('dashboard.noConversations') + '</div>';
    // Compute average cost-per-token from model data for estimation
    const totalCost = calculateTotalCost(models);
    const totalT = models.reduce((s, m) => s + usageTotal(m), 0);
    const cpt = totalT > 0 ? totalCost / totalT : 0;
    const maxTokens = Math.max(...shown.map(c => usageTotal(c)), 1);
    let html = '<div class="cascade-enriched">';
    for (const c of shown)
        html += renderCascadeRow(c, cpt, maxTokens, maxTitleLen);
    // Render overflow items (hidden by default)
    if (cascades.length > limit) {
        const overflow = cascades.slice(limit);
        html += '<div class="cascade-overflow" style="display:none">';
        for (const c of overflow)
            html += renderCascadeRow(c, cpt, maxTokens, maxTitleLen);
        html += '</div>';
        html += `<button class="cascade-more-btn" data-cascade-toggle="true" data-overflow-count="${overflow.length}" data-show-less="${tu('dashboard.showLess')}" data-show-more="${tu('dashboard.more')}">+${overflow.length} ${tu('dashboard.more')}</button>`;
    }
    html += '</div>';
    return html;
}
function renderCostEstimate(models) {
    if (!models || models.length === 0)
        return '<div class="deep-empty">' + tu('dashboard.noModelData') + '</div>';
    let html = '<div class="deep-cost-table">';
    html += '<div class="deep-cost-row deep-cost-header">';
    html += '<span class="deep-cost-model">' + tu('dashboard.costModel') + '</span>';
    html += '<span class="deep-cost-val">' + tu('dashboard.costInput') + '</span>';
    html += '<span class="deep-cost-val">' + tu('dashboard.costCache') + '</span>';
    html += '<span class="deep-cost-val">' + tu('dashboard.costOutput') + '</span>';
    html += '<span class="deep-cost-val">' + tu('dashboard.costReas') + '</span>';
    html += '<span class="deep-cost-val deep-cost-total">' + tu('dashboard.costTotal') + '</span>';
    html += '</div>';
    let grandTotal = 0;
    for (const m of models) {
        const p = matchPricing(m.displayName);
        const inputCost = (m.input / 1e6) * p.input;
        const cacheCost = ((m.cache || 0) / 1e6) * p.cache;
        const outputCost = (m.output / 1e6) * p.output;
        const reasonCost = ((m.reasoning || 0) / 1e6) * p.reasoning;
        const rowTotal = inputCost + cacheCost + outputCost + reasonCost;
        grandTotal += rowTotal;
        if (rowTotal < 0.01)
            continue;
        html += '<div class="deep-cost-row">';
        html += '<span class="deep-cost-model">' + (0, helpers_1.escHtml)(m.displayName) + '</span>';
        html += '<span class="deep-cost-val">' + fmtDollar(inputCost) + '</span>';
        html += '<span class="deep-cost-val">' + fmtDollar(cacheCost) + '</span>';
        html += '<span class="deep-cost-val">' + fmtDollar(outputCost) + '</span>';
        html += '<span class="deep-cost-val">' + fmtDollar(reasonCost) + '</span>';
        html += '<span class="deep-cost-val deep-cost-total">' + fmtDollar(rowTotal) + '</span>';
        html += '</div>';
    }
    html += '<div class="deep-cost-row deep-cost-grand">';
    html += '<span class="deep-cost-model">' + tu('dashboard.costGrandTotal') + '</span>';
    html += '<span class="deep-cost-val"></span><span class="deep-cost-val"></span><span class="deep-cost-val"></span><span class="deep-cost-val"></span>';
    html += '<span class="deep-cost-val deep-cost-total">' + fmtDollar(grandTotal) + '</span>';
    html += '</div></div>';
    html += '<div class="deep-cost-note">' + tu('dashboard.costNote') + '</div>';
    return html;
}
// ═══════════════════════════════════════════
//  Range Bar
// ═══════════════════════════════════════════
const RANGES = [
    { id: '24h', label: '24h' },
    { id: '7d', label: '7d' },
    { id: '30d', label: '30d' },
    { id: 'all', label: 'All Time' },
];
function renderRangeBar(activeRange, cssPrefix = 'deep') {
    let html = `<div class="${cssPrefix}-range-bar" id="usageRangeBar">`;
    for (const r of RANGES) {
        const active = activeRange === r.id ? ' active' : '';
        const label = r.id === 'all' ? tu('dashboard.allTime') : r.label;
        html += `<button class="${cssPrefix}-range-btn${active}" data-action="set-usage-range" data-range="${r.id}">${label}</button>`;
    }
    html += '</div>';
    return html;
}
function rangeLabel(state) {
    switch (state) {
        case '24h': return tu('dashboard.ranges.last24h');
        case '7d': return tu('dashboard.ranges.last7d');
        case '30d': return tu('dashboard.ranges.last30d');
        case 'today': return tu('dashboard.ranges.today');
        case 'this-week': return tu('dashboard.ranges.thisWeek');
        case 'this-month': return tu('dashboard.ranges.thisMonth');
        case 'last-month': return tu('dashboard.ranges.lastMonth');
        default: return tu('dashboard.ranges.allTime');
    }
}
//# sourceMappingURL=usage-components.js.map