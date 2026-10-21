/**
 * Runtime type guards for Language Server protobuf responses.
 *
 * Replaces `status.userTier || {} as any` patterns with safe,
 * validated wrappers that prevent silent undefined access when
 * the LS response shape changes.
 *
 * Zero external dependencies — manual guards (Zod-lite pattern).
 */
/** Validated LS UserTier — replaces `status.userTier || {} as any` */
export interface SafeUserTier {
    name: string | null;
    id: string | null;
    availableCredits: Array<{
        creditType: string;
        creditAmount: string;
    }>;
}
export declare function parseUserTier(raw: unknown): SafeUserTier;
/** Validated LS PlanStatus — replaces `status.planStatus || {} as any` */
export interface SafePlanStatus {
    availablePromptCredits: number | null;
    availableFlowCredits: number | null;
    planInfo: {
        monthlyPromptCredits: number | null;
        monthlyFlowCredits: number | null;
    };
}
export declare function parsePlanStatus(raw: unknown): SafePlanStatus;
