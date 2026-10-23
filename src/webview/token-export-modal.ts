/**
 * Token Export Modal — handles bulk refresh token selection and copying to clipboard.
 * Reads current accounts from lastRenderArgs and posts message to extension host.
 * Tokens are NEVER sent to or processed by the webview.
 */
import { vscode, lastRenderArgs } from './context';
import { t } from '../i18n/i18nClient';
import { shortTierName, dotClass } from '../shared/helpers';
import type { TokenExportFormat } from '../shared/tokenExportFormatter';

let isExporting = false;
let currentFormat: TokenExportFormat = 'plain';

function esc(str: string): string {
    return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function initTokenExportModal(): void {
    const modal = document.getElementById('tokenExportModal');
    if (!modal) return;

    modal.addEventListener('keydown', (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            submitTokenExport();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeTokenExportModal();
        }
    });

    // Close when clicking on backdrop outside modal dialog
    modal.addEventListener('click', (e: MouseEvent) => {
        if (e.target === modal && !isExporting) {
            closeTokenExportModal();
        }
    });

    // Event delegation for checkboxes inside the list
    const list = document.getElementById('exportAccountList');
    if (list) {
        list.addEventListener('change', (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target && target.classList.contains('export-acct-chk')) {
                const row = target.closest('.ag-export-row');
                if (row) {
                    row.classList.toggle('is-selected', target.checked);
                }
                updateExportCounter();
            }
        });
    }
}

export function setExportFormat(format: TokenExportFormat): void {
    currentFormat = format;
    const formatBtns = document.querySelectorAll('.ag-format-btn');
    formatBtns.forEach(btn => {
        const f = (btn as HTMLElement).dataset.format;
        btn.classList.toggle('active', f === format);
    });
}

export function selectExportAccounts(mode: 'all' | 'none' | 'healthy'): void {
    const list = document.getElementById('exportAccountList');
    if (!list) return;

    const checkboxes = list.querySelectorAll<HTMLInputElement>('.export-acct-chk');
    checkboxes.forEach(chk => {
        const isHealthy = chk.dataset.healthy === 'true';
        let shouldCheck = false;
        if (mode === 'all') shouldCheck = true;
        else if (mode === 'none') shouldCheck = false;
        else if (mode === 'healthy') shouldCheck = isHealthy;

        chk.checked = shouldCheck;
        const row = chk.closest('.ag-export-row');
        if (row) row.classList.toggle('is-selected', shouldCheck);
    });

    updateExportCounter();
}

function updateExportCounter(): void {
    const list = document.getElementById('exportAccountList');
    const counter = document.getElementById('exportCounter');
    const submitBtn = document.getElementById('submitExportBtn') as HTMLButtonElement | null;
    if (!list || !counter || !submitBtn) return;

    const checkboxes = list.querySelectorAll<HTMLInputElement>('.export-acct-chk');
    const total = checkboxes.length;
    const selected = Array.from(checkboxes).filter(c => c.checked).length;

    counter.innerHTML = `<span class="badge-highlight">${t('export.selected', { selected, total })}</span>`;
    submitBtn.disabled = selected === 0;

    if (selected === 0) {
        submitBtn.innerHTML = `<i class="fa-solid fa-copy"></i><span>${t('export.copy_other', { count: 0 })}</span>`;
    } else if (selected === 1) {
        submitBtn.innerHTML = `<i class="fa-solid fa-copy"></i><span>${t('export.copy_one')}</span>`;
    } else {
        submitBtn.innerHTML = `<i class="fa-solid fa-copy"></i><span>${t('export.copy_other', { count: selected })}</span>`;
    }
}

export function openTokenExportModal(): void {
    const modal = document.getElementById('tokenExportModal');
    const list = document.getElementById('exportAccountList');
    const status = document.getElementById('exportModalStatus');
    const submitBtn = document.getElementById('submitExportBtn') as HTMLButtonElement | null;
    if (!modal || !list) return;

    isExporting = false;
    currentFormat = 'plain';
    setExportFormat('plain');

    if (status) {
        status.style.display = 'none';
        status.className = 'ag-modal-status';
        status.innerHTML = '';
    }

    // Populate account list from last rendered cards
    const cards = (lastRenderArgs[0] as any[]) || [];
    if (cards.length === 0) {
        list.innerHTML = `<div class="ag-export-empty">${t('export.noneFound')}</div>`;
        if (submitBtn) submitBtn.disabled = true;
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        return;
    }

    let rowsHtml = '';
    for (const card of cards) {
        const id = card.trackingId || card.email;
        const email = esc(card.email);
        const name = card.name && card.name !== card.email ? esc(card.name) : '';
        const minPct = card.bottleneck ? card.bottleneck.pct : (card.isError ? 0 : 100);
        const dotCls = card.isError ? 'x' : dotClass(minPct);
        const isHealthy = !card.isError && minPct >= 30;

        const activeTag = card.isActive ? `<span class="active-tag">${t('accounts.active')}</span>` : '';
        const tierTag = card.tierName ? `<span class="tier-tag">${esc(shortTierName(card.tierName))}</span>` : '';

        rowsHtml += `
            <label class="ag-export-row is-selected" data-id="${id}">
                <input type="checkbox" class="export-acct-chk" data-id="${id}" data-healthy="${isHealthy}" checked />
                <div class="acct-dot ${dotCls}"></div>
                <div class="ag-export-row-info">
                    <div class="ag-export-row-email">
                        ${email} ${activeTag} ${tierTag}
                    </div>
                    ${name ? `<div class="ag-export-row-name">${name}</div>` : ''}
                </div>
            </label>
        `;
    }

    list.innerHTML = rowsHtml;
    updateExportCounter();

    modal.style.display = 'flex';
    modal.classList.remove('hidden');
}

export function closeTokenExportModal(): void {
    if (isExporting) return;
    const modal = document.getElementById('tokenExportModal');
    const status = document.getElementById('exportModalStatus');
    if (!modal) return;

    modal.style.display = 'none';
    modal.classList.add('hidden');

    if (status) {
        status.style.display = 'none';
        status.innerHTML = '';
    }
}

export function submitTokenExport(): void {
    if (isExporting) return;
    const list = document.getElementById('exportAccountList');
    const submitBtn = document.getElementById('submitExportBtn') as HTMLButtonElement | null;
    const status = document.getElementById('exportModalStatus');
    if (!list || !submitBtn) return;

    const checkboxes = list.querySelectorAll<HTMLInputElement>('.export-acct-chk:checked');
    const accountIds = Array.from(checkboxes).map(c => c.dataset.id!).filter(Boolean);
    if (accountIds.length === 0) return;

    isExporting = true;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i><span>${t('common.loading')}</span>`;

    if (status) {
        status.className = 'ag-modal-status loading';
        status.style.display = 'flex';
        status.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i><span>${t('common.loading')}</span>`;
    }

    vscode.postMessage({
        type: 'copyTokens',
        accountIds,
        format: currentFormat,
    });
}

export function onTokensCopied(result: {
    total: number;
    copiedCount: number;
    missingCount: number;
    copiedEmails: string[];
    missingEmails: string[];
}): void {
    isExporting = false;
    const submitBtn = document.getElementById('submitExportBtn') as HTMLButtonElement | null;
    const status = document.getElementById('exportModalStatus');
    if (!status) return;

    status.style.display = 'flex';

    if (result.copiedCount > 0 && result.missingCount === 0) {
        status.className = 'ag-modal-status success';
        const msg = result.copiedCount === 1
            ? t('export.success_one')
            : t('export.success_other', { count: result.copiedCount });
        const emails = esc(result.copiedEmails.join(', '));
        status.innerHTML = `<i class="fa-solid fa-circle-check"></i><div><strong>${msg}</strong><div style="font-size:10px;opacity:.85;margin-top:2px">${emails}</div></div>`;

        if (submitBtn) {
            submitBtn.innerHTML = `<i class="fa-solid fa-check"></i><span>${t('common.done')}</span>`;
        }

        setTimeout(() => {
            closeTokenExportModal();
        }, 1800);
    } else if (result.copiedCount > 0 && result.missingCount > 0) {
        status.className = 'ag-modal-status warning';
        const copiedList = esc(result.copiedEmails.join(', '));
        const missingList = esc(result.missingEmails.join(', '));
        status.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i><div><strong>${t('export.partial', { copied: result.copiedCount, missing: result.missingCount })}</strong><div style="font-size:10px;opacity:.85;margin-top:2px">✓ ${copiedList}<br/>✗ ${missingList}</div></div>`;

        if (submitBtn) {
            submitBtn.disabled = false;
            updateExportCounter();
        }
    } else {
        status.className = 'ag-modal-status error';
        status.innerHTML = `<i class="fa-solid fa-circle-xmark"></i><div><strong>${t('export.noneFound')}</strong></div>`;

        if (submitBtn) {
            submitBtn.disabled = false;
            updateExportCounter();
        }
    }
}
