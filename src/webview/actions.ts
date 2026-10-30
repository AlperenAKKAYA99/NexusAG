/**
 * User action handlers — thin wrappers around vscode.postMessage().
 * Each function corresponds to a UI interaction (button click, toggle, etc.)
 */

import { vscode, updateInterval, pinnedModels, lastRenderArgs } from './context';
import { renderAll } from './renderers/accounts';

// ─── Helpers ───

function spinAndCall(id: string, fn: () => void): void {
    const el = document.getElementById(id);
    if (el) { el.classList.add('spinning'); setTimeout(() => el.classList.remove('spinning'), 1200); }
    fn();
}

function activateOne(selector: string, el: HTMLElement): void {
    document.querySelectorAll(selector).forEach(b => b.classList.remove('active'));
    el.classList.add('active');
}

// ─── Actions ───

export function refresh(): void {
    vscode.postMessage({ type: 'refresh', manual: false });
}

export function addAccount(): void {
    vscode.postMessage({ type: 'addAccount' });
}

export function addAccountByToken(): void {
    vscode.postMessage({ type: 'addAccountByToken' });
}

export function removeAccount(id: string): void {
    vscode.postMessage({ type: 'removeAccount', accountId: id });
}

export function switchAccount(id: string): void {
    vscode.postMessage({ type: 'switchAccount', accountId: id });
}

export function copyToken(id: string): void {
    vscode.postMessage({ type: 'copyToken', accountId: id });
}

export function toggleModel(modelId: string, isVisible: boolean): void {
    vscode.postMessage({ type: 'toggleModel', modelId, isVisible });
}

export function pinModel(accountKey: string, rawModelId: string): void {
    const modelId = decodeURIComponent(rawModelId);
    const isCurrentlyPinned = pinnedModels[accountKey] === modelId;
    if (isCurrentlyPinned) {
        delete pinnedModels[accountKey];
        vscode.postMessage({ type: 'setPinnedModel', accountKey, modelId: null });
    } else {
        pinnedModels[accountKey] = modelId;
        vscode.postMessage({ type: 'setPinnedModel', accountKey, modelId });
    }
    renderAll(lastRenderArgs[0] as any[], lastRenderArgs[1] as Record<string, string>);
}

export const doRefresh = () => spinAndCall('refreshBtn', () =>
    vscode.postMessage({ type: 'refresh', manual: true }));
export const doRefreshTokenOnly = () => spinAndCall('tokenRefreshBtn', () =>
    vscode.postMessage({ type: 'refreshTokenOnly' }));
export const doRefreshUsage = () => spinAndCall('usageRefreshBtn', () =>
    vscode.postMessage({ type: 'refresh' }));

let _prevTab = 'accounts';

export function switchTab(tabId: string, el: HTMLElement): void {
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) settingsBtn.classList.remove('active');
    activateOne('.tab-btn', el);
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const target = document.getElementById('tab-' + tabId);
    if (target) target.classList.add('active');
    vscode.setState({ ...vscode.getState(), activeTab: tabId });
}

export function openSettings(): void {
    const activeBtn = document.querySelector('.tab-btn.active') as HTMLElement | null;
    if (activeBtn?.dataset.tab && activeBtn.dataset.tab !== 'settings') {
        _prevTab = activeBtn.dataset.tab;
    }
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const target = document.getElementById('tab-settings');
    if (target) target.classList.add('active');
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) settingsBtn.classList.add('active');
    vscode.setState({ ...vscode.getState(), activeTab: 'settings' });
}

export function closeSettings(): void {
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) settingsBtn.classList.remove('active');
    const prevBtn = document.querySelector('.tab-btn[data-tab="' + _prevTab + '"]') as HTMLElement | null;
    if (prevBtn) {
        switchTab(_prevTab, prevBtn);
    } else {
        const firstTab = document.querySelector('.tab-btn') as HTMLElement | null;
        if (firstTab?.dataset.tab) switchTab(firstTab.dataset.tab, firstTab);
    }
}

export function pickInterval(el: HTMLElement): void {
    activateOne('.iv-btn', el);
    const msAttr = el.dataset.ms || '60000';
    updateInterval(msAttr === 'live' ? 'live' : parseInt(msAttr, 10));
}

export function toggleOpen(el: HTMLElement): void {
    el.parentElement!.classList.toggle('open');
}

export function changeLocale(locale: string): void {
    vscode.postMessage({ type: 'changeLocale', locale });
}

