import { vscode } from './context';
import { t } from '../i18n/i18nClient';
import { extractTokens } from '../shared/tokenExportFormatter';

let isSubmitting = false;

function esc(str: string): string {
    return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function parseTokens(text: string): string[] {
    return extractTokens(text);
}

export function initTokenModal(): void {
    const textarea = document.getElementById('tokenInputArea') as HTMLTextAreaElement | null;
    const modal = document.getElementById('tokenModal');
    if (!textarea || !modal) return;

    textarea.addEventListener('input', () => {
        updateCounter();
    });

    textarea.addEventListener('keydown', (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            submitTokens();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeTokenModal();
        }
    });

    // Close when clicking on backdrop outside the modal dialog box
    modal.addEventListener('click', (e: MouseEvent) => {
        if (e.target === modal && !isSubmitting) {
            closeTokenModal();
        }
    });
}

function updateCounter(): void {
    const textarea = document.getElementById('tokenInputArea') as HTMLTextAreaElement | null;
    const counter = document.getElementById('tokenCounter');
    const submitBtn = document.getElementById('submitTokensBtn') as HTMLButtonElement | null;
    if (!textarea || !counter || !submitBtn) return;

    const tokens = parseTokens(textarea.value);
    const count = tokens.length;

    if (count === 0) {
        counter.textContent = t('modal.tokensDetected_zero');
        counter.classList.remove('badge-highlight');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i><span>' + t('modal.addAccounts') + '</span>';
    } else if (count === 1) {
        counter.innerHTML = '<span class="badge-highlight">' + t('modal.tokensDetected_one') + '</span>';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i><span>' + t('modal.addOne') + '</span>';
    } else {
        counter.innerHTML = '<span class="badge-highlight">' + t('modal.tokensDetected_other', { count }) + '</span>';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i><span>' + t('modal.addCount', { count }) + '</span>';
    }
}

export function openTokenModal(): void {
    const modal = document.getElementById('tokenModal');
    const textarea = document.getElementById('tokenInputArea') as HTMLTextAreaElement | null;
    const status = document.getElementById('tokenModalStatus');
    if (!modal) return;

    modal.style.display = 'flex';
    modal.classList.remove('hidden');
    if (status) {
        status.style.display = 'none';
        status.className = 'ag-modal-status';
        status.innerHTML = '';
    }

    isSubmitting = false;
    updateCounter();

    if (textarea) {
        textarea.disabled = false;
        setTimeout(() => textarea.focus(), 60);
    }
}

export function closeTokenModal(): void {
    if (isSubmitting) return; // Prevent closing while in flight
    const modal = document.getElementById('tokenModal');
    const textarea = document.getElementById('tokenInputArea') as HTMLTextAreaElement | null;
    const status = document.getElementById('tokenModalStatus');
    if (!modal) return;

    modal.style.display = 'none';
    modal.classList.add('hidden');
    if (textarea) {
        textarea.value = '';
        textarea.disabled = false;
    }
    if (status) {
        status.style.display = 'none';
        status.innerHTML = '';
    }
    updateCounter();
}

export function submitTokens(): void {
    const textarea = document.getElementById('tokenInputArea') as HTMLTextAreaElement | null;
    const submitBtn = document.getElementById('submitTokensBtn') as HTMLButtonElement | null;
    const status = document.getElementById('tokenModalStatus');
    if (!textarea || !submitBtn || isSubmitting) return;

    const tokens = parseTokens(textarea.value);
    if (tokens.length === 0) return;

    isSubmitting = true;
    textarea.disabled = true;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i><span>${t('modal.adding', { count: tokens.length })}</span>`;

    if (status) {
        status.className = 'ag-modal-status loading';
        status.style.display = 'flex';
        status.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i><span>${t('modal.verifying', { count: tokens.length })}</span>`;
    }

    vscode.postMessage({
        type: 'addAccountsByTokens',
        tokens,
    });
}

export function onTokensProcessed(result: {
    total: number;
    successCount: number;
    failedCount: number;
    results: Array<{ token: string; email?: string; success: boolean; error?: string }>;
}): void {
    isSubmitting = false;
    const textarea = document.getElementById('tokenInputArea') as HTMLTextAreaElement | null;
    const submitBtn = document.getElementById('submitTokensBtn') as HTMLButtonElement | null;
    const status = document.getElementById('tokenModalStatus');
    if (!status) return;

    status.style.display = 'flex';

    if (result.successCount > 0 && result.failedCount === 0) {
        // All tokens succeeded
        status.className = 'ag-modal-status success';
        const emails = esc(result.results.filter(r => r.success).map(r => r.email).join(', '));
        const successMsg = result.successCount === 1
            ? t('modal.successAll_one', { count: 1 })
            : t('modal.successAll_other', { count: result.successCount });
        status.innerHTML = `<i class="fa-solid fa-circle-check"></i><div><strong>${successMsg}</strong><div style="font-size:10px;opacity:.85;margin-top:2px">${emails}</div></div>`;

        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fa-solid fa-check"></i><span>' + t('common.done') + '</span>';
        }
        if (textarea) textarea.value = '';

        setTimeout(() => {
            closeTokenModal();
        }, 1800);
    } else if (result.successCount > 0 && result.failedCount > 0) {
        // Partial success
        status.className = 'ag-modal-status warning';
        const successful = esc(result.results.filter(r => r.success).map(r => r.email).join(', '));
        const failedTokens = result.results.filter(r => !r.success).map(r => r.token);

        status.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i><div><strong>${t('modal.partialSuccess', { success: result.successCount, failed: result.failedCount })}</strong><div style="font-size:10px;opacity:.85;margin-top:2px">${successful}</div></div>`;

        if (textarea) {
            textarea.disabled = false;
            // Leave only failed tokens in textarea so user can inspect / fix them
            textarea.value = failedTokens.join('\n');
            textarea.focus();
        }
        updateCounter();
    } else {
        // All failed
        status.className = 'ag-modal-status error';
        const firstErr = result.results.find(r => !r.success)?.error || t('modal.verificationFailed');
        status.innerHTML = `<i class="fa-solid fa-circle-xmark"></i><div><strong>${t('modal.allFailed', { count: result.failedCount })}</strong><div style="font-size:10px;opacity:.85;margin-top:2px">${firstErr}</div></div>`;

        if (textarea) {
            textarea.disabled = false;
            textarea.focus();
        }
        updateCounter();
    }
}
