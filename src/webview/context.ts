/**
 * Shared webview context — breaks circular dependencies between modules.
 * All modules import from here; this file imports from nobody.
 */

// ─── API ───
export const vscode = acquireVsCodeApi();
export const wlog = (m: string) => vscode.postMessage({ type: 'weblog', msg: m });

// ─── Shared State ───
export let pinnedModels: Record<string, string> = {};
export let lastRenderArgs: unknown[] = [];
export const setPinnedModels = (m: Record<string, string>) => { pinnedModels = m; };
export const setLastRenderArgs = (a: unknown[]) => { lastRenderArgs = a; };

// ─── Refresh Timer ───
let _timer: ReturnType<typeof setInterval> | null = null;
let _fn: (() => void) | null = null;
export let intervalMs: number | string = 60000;

function applyInterval(val: number | string): void {
    if (_timer) {
        clearInterval(_timer);
        _timer = null;
    }
    if (val === 'live') {
        vscode.postMessage({ type: 'setRefreshMode', mode: 'live' });
        // In "Anlık" mode: updates are reactive and event-driven.
        // A gentle 20s safety heartbeat runs in case no chat events occur.
        if (_fn) _timer = setInterval(_fn, 20000);
    } else {
        const ms = typeof val === 'number' ? val : parseInt(val, 10) || 60000;
        vscode.postMessage({ type: 'setRefreshMode', mode: 'interval', ms });
        if (_fn) _timer = setInterval(_fn, ms);
    }
}

/** Call once at init — registers the refresh callback and starts the timer. */
export function initTimer(fn: () => void, ms: number | string): void {
    _fn = fn;
    intervalMs = ms;
    applyInterval(ms);
}

/** Updates the refresh interval and persists to webview state. */
export function updateInterval(ms: number | string): void {
    intervalMs = ms;
    applyInterval(ms);
    vscode.setState({ ...vscode.getState(), intervalMs: ms });
}

// Instant reactive refresh when user switches back to panel tab / IDE focus
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && intervalMs === 'live') {
            _fn?.();
        }
    });
}

