"use strict";
/**
 * Runtime type guards for Language Server protobuf responses.
 *
 * Replaces `status.userTier || {} as any` patterns with safe,
 * validated wrappers that prevent silent undefined access when
 * the LS response shape changes.
 *
 * Zero external dependencies — manual guards (Zod-lite pattern).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseUserTier = parseUserTier;
exports.parsePlanStatus = parsePlanStatus;
function parseUserTier(raw) {
    if (!raw || typeof raw !== 'object') {
        return { name: null, id: null, availableCredits: [] };
    }
    const r = raw;
    return {
        name: typeof r.name === 'string' ? r.name : null,
        id: typeof r.id === 'string' ? r.id : null,
        availableCredits: Array.isArray(r.availableCredits)
            ? r.availableCredits.filter((c) => c && typeof c === 'object' && typeof c.creditType === 'string')
            : [],
    };
}
function parsePlanStatus(raw) {
    if (!raw || typeof raw !== 'object') {
        return {
            availablePromptCredits: null,
            availableFlowCredits: null,
            planInfo: { monthlyPromptCredits: null, monthlyFlowCredits: null },
        };
    }
    const r = raw;
    const pi = (r.planInfo && typeof r.planInfo === 'object')
        ? r.planInfo
        : {};
    return {
        availablePromptCredits: typeof r.availablePromptCredits === 'number'
            ? r.availablePromptCredits : null,
        availableFlowCredits: typeof r.availableFlowCredits === 'number'
            ? r.availableFlowCredits : null,
        planInfo: {
            monthlyPromptCredits: typeof pi.monthlyPromptCredits === 'number'
                ? pi.monthlyPromptCredits : null,
            monthlyFlowCredits: typeof pi.monthlyFlowCredits === 'number'
                ? pi.monthlyFlowCredits : null,
        },
    };
}
//# sourceMappingURL=lsTypes.js.map