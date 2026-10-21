/**
 * Account tab renderer — pure HTML rendering from pre-processed AccountCard[].
 * ZERO data logic — all merging, deduplication, classification, and sorting
 * is done in quotaManager.buildAccountCards() on the extension host side.
 */

import { dotClass, fillClass, timeLeft, shortModelName, shortTierName, fmtNum } from '../../shared/helpers';
import { t } from '../../i18n/i18nClient';

// Font Awesome icon constants for tracked account action buttons
const SWITCH_SVG = '<i class="fa-solid fa-right-left"></i>';
const KEY_SVG = '<i class="fa-solid fa-key"></i>';
const TRASH_SVG = '<i class="fa-solid fa-trash-can"></i>';

/** Track previous active email to detect account switches and auto-collapse */
let _lastActiveEmail = '';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function renderAll(cards: any[], pinnedModels: Record<string, string>): void {
    const list = document.getElementById('accountList')!;
    const healthWrap = document.getElementById('healthBarWrap');
    const healthFill = document.getElementById('healthBarFill');
    const healthPctEl = document.getElementById('healthPct');
    const label = document.getElementById('summaryLabel')!;

    if (!cards || cards.length === 0) {
        if (healthWrap) healthWrap.style.display = 'none';
        label.textContent = t('accounts.count_other', { count: 0 });
        list.innerHTML = `<div class="empty-state"><div class="em-icon"><i class="fa-solid fa-tower-broadcast"></i></div><div class="em-title">${t('accounts.noAccounts')}</div><div class="em-desc">${t('accounts.addToStart')}</div></div>`;
        return;
    }

    if (healthWrap) healthWrap.style.display = 'flex';

    // ─── Health Capacity Loading Bar ───
    let totalPct = 0;
    let healthyCount = 0;
    let warnCount = 0;
    let critCount = 0;

    for (const a of cards) {
        const minPct = a.bottleneck ? a.bottleneck.pct : (a.isError ? 0 : 100);
        totalPct += minPct;
        if (a.isError || minPct < 30) critCount++;
        else if (minPct < 70) warnCount++;
        else healthyCount++;
    }

    const avgPct = Math.round(totalPct / cards.length);
    const cls = dotClass(avgPct);

    if (healthFill && healthPctEl) {
        healthFill.style.width = avgPct + '%';
        healthFill.className = 'health-bar-fill ' + cls;
        healthPctEl.textContent = avgPct + '%';
        healthPctEl.className = 'health-pct ' + cls;
        if (healthWrap) {
            const parts: string[] = [];
            if (healthyCount > 0) parts.push(healthyCount + ' ' + t('accounts.healthy'));
            if (warnCount > 0) parts.push(warnCount + ' ' + t('accounts.warning'));
            if (critCount > 0) parts.push(critCount + ' ' + t('accounts.exhausted'));
            healthWrap.title = t('accounts.avgCapacity', { pct: avgPct, details: parts.join(', '), total: cards.length });
        }
    }

    let nearestReset = '';
    for (const a of cards) {
        const tl = timeLeft(a.resetTime);
        if (tl && tl !== 'Reset' && (!nearestReset || tl < nearestReset)) nearestReset = tl;
    }
    const countStr = cards.length === 1
        ? t('accounts.count_one', { count: cards.length })
        : t('accounts.count_other', { count: cards.length });
    label.textContent = countStr
        + (nearestReset ? ' \u00b7 ' + nearestReset + ' ' + t('accounts.resetSuffix') : '');

    // ─── Preserve open states by EMAIL (stable across re-renders) ───
    const openStates: Record<string, boolean> = {};
    document.querySelectorAll('.acct[data-email]').forEach(el => {
        openStates[(el as HTMLElement).dataset.email!] = el.classList.contains('open');
    });

    // Detect account switch — when active email changes, reset open states
    const activeCard = cards.find((c: any) => c.isActive);
    const newActiveEmail = activeCard?.email || '';
    const switched = newActiveEmail && newActiveEmail !== _lastActiveEmail;
    if (newActiveEmail) _lastActiveEmail = newActiveEmail;

    // ─── Account cards ───
    let html = '';
    for (const a of cards) {
        // On switch: active card opens, others collapse. Normal re-render: preserve state.
        const wasOpen = switched
            ? a.isActive
            : (openStates[a.email] !== undefined ? openStates[a.email] : a.isActive);
        const minPct = a.bottleneck ? a.bottleneck.pct : 0;
        const dotCls = a.isError ? 'x' : dotClass(minPct);
        const openCls = wasOpen ? ' open' : '';

        // Action buttons:
        // On active card: Switch and Remove are disabled/passive, Copy Token is ACTIVE.
        // On inactive cards: All actions are enabled.
        const trackingId = a.trackingId || a.email;
        const actionBtns = trackingId
            ? '<div class="acct-actions" data-action="drawer-noop">'
              + (a.isActive
                  ? '<button class="acct-switch is-disabled" disabled title="' + t('accounts.switchDisabled') + '" aria-disabled="true">' + SWITCH_SVG + '</button>'
                  : '<button class="acct-switch" title="' + t('accounts.switch') + '" data-action="switch-account" data-id="' + trackingId + '">' + SWITCH_SVG + '</button>')
              + '<button class="acct-key" title="' + t('accounts.copyToken') + '" data-action="copy-token" data-id="' + trackingId + '">' + KEY_SVG + '</button>'
              + (a.isActive
                  ? '<button class="acct-del is-disabled" disabled title="' + t('accounts.removeDisabled') + '" aria-disabled="true">' + TRASH_SVG + '</button>'
                  : '<button class="acct-del" title="' + t('accounts.remove') + '" data-action="remove-account" data-id="' + trackingId + '">' + TRASH_SVG + '</button>')
              + '</div>'
            : '';

        const activeBadge = a.isActive ? '<span class="active-tag">' + t('accounts.active') + '</span>' : '';
        const transitionBadge = a.isTransitioning && a.pendingEmail
            ? '<span class="transition-tag">→ ' + a.pendingEmail + '</span>'
            : '';
        const tierBadge = a.tierName ? '<span class="tier-tag">' + shortTierName(a.tierName) + '</span>' : '';

        // Credits as pill badges
        let creditsLine = '';
        if (a.aiCredits != null || a.promptCredits != null || a.flowCredits != null) {
            let chips = '';
            if (a.aiCredits != null) chips += '<span class="cr-chip"><span class="cr-icon">CR</span>' + fmtNum(a.aiCredits) + '</span>';
            if (a.promptCredits != null) {
                const pmx = a.promptCreditsMax ? '/' + fmtNum(a.promptCreditsMax) : '';
                chips += '<span class="cr-chip cr-prompt">P ' + fmtNum(a.promptCredits) + pmx + '</span>';
            }
            if (a.flowCredits != null) {
                const fmx = a.flowCreditsMax ? '/' + fmtNum(a.flowCreditsMax) : '';
                chips += '<span class="cr-chip cr-flow">F ' + fmtNum(a.flowCredits) + fmx + '</span>';
            }
            creditsLine = '<div class="acct-credits">' + chips + '</div>';
        }

        // Pinned or bottleneck for collapsed view
        let subBlock = '';
        if (a.isError) {
            subBlock = '<div class="acct-sub"><span style="color:var(--error)"><i class="fa-solid fa-triangle-exclamation"></i> ' + (a.errorMessage || t('common.error')) + '</span></div>';
        } else {
            const pinnedLabel = pinnedModels[a.email];
            const displayModel = pinnedLabel
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ? (a.models.find((m: any) => m.label === pinnedLabel) || a.bottleneck)
                : a.bottleneck;
            if (displayModel) {
                const bnLabel = displayModel.label || shortModelName(displayModel.id);
                const pctCls = fillClass(displayModel.pct);
                const tl = timeLeft(displayModel.resetTime);
                subBlock = '<div class="acct-sub">'
                    + '<span class="bn-model">' + bnLabel + '</span> \u00b7 '
                    + '<span class="bn-pct ' + pctCls + '">' + displayModel.pct + '%</span>'
                    + (tl ? ' <span class="bn-sep">\u00b7</span> ' + tl : '')
                    + '</div>';
            } else {
                subBlock = '<div class="acct-sub">' + t('accounts.noModelData') + '</div>';
            }
        }

        const activeCls = a.isActive ? ' acct-active' : '';
        html += '<div class="acct' + activeCls + openCls + '" data-email="' + a.email + '">';
        html += '<div class="acct-hdr" data-action="toggle-open">';
        html += '<div class="acct-dot ' + dotCls + '"></div>';
        html += '<div class="acct-info">';
        html += '<div class="acct-email">' + a.email + ' ' + activeBadge + ' ' + tierBadge + transitionBadge + '</div>';
        html += subBlock;
        html += creditsLine;
        html += '</div>';
        html += actionBtns;
        html += '<i class="fa-solid fa-chevron-right acct-chev"></i>';
        html += '</div>';

        // Model details (expanded content)
        html += '<div class="m-details">';
        if (a.models.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const m of a.models as any[]) {
                const fCls = fillClass(m.pct);
                const mTl = timeLeft(m.resetTime);
                const acctKey = a.email;
                const isPinned = pinnedModels[acctKey] === m.label;
                const starCls = isPinned ? 'star-btn pinned' : 'star-btn';
                const starIcon = isPinned ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
                const safeModelId = encodeURIComponent(m.label);
                html += '<div class="m-item">';
                html += '<button class="' + starCls + '" title="' + t('accounts.pinToCollapsed') + '" data-action="pin-model" data-account-key="' + acctKey + '" data-model-id="' + safeModelId + '">'
                    + starIcon + '</button>';
                html += '<div class="m-content">';
                html += '<div class="m-top">';
                html += '<span class="m-label">' + m.label + '</span>';
                html += '<div class="m-right">';
                html += '<span class="m-pct">' + m.pct + '%</span>';
                if (m.isLocal) {
                    const chk = a.selectedModels.includes(m.id) ? ' checked' : '';
                    html += '<label class="sb-t" title="' + t('accounts.statusBar') + '"><input type="checkbox" data-id="' + m.id + '" data-action="toggle-model"' + chk + '><span class="sb-s"></span></label>';
                }
                html += '</div></div>';
                html += '<div class="m-track"><div class="m-fill ' + fCls + '" style="width:' + m.pct + '%"></div></div>';
                if (mTl) html += '<div class="m-reset-inline">' + t('common.reset') + ' ' + mTl + '</div>';
                html += '</div></div>';
            }
        } else if (a.isError) {
            html += '<div class="acct-err"><i class="fa-solid fa-triangle-exclamation"></i> ' + (a.errorMessage || t('accounts.connectionError')) + '</div>';
        } else {
            html += '<div class="acct-err" style="color:var(--muted)">' + t('accounts.noQuotaData') + '</div>';
        }
        html += '</div></div>';
    }

    list.innerHTML = html;
}
