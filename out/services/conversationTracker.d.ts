/**
 * ConversationTracker — Reactive USS topic listeners for conversation switches and data updates.
 * Encapsulates all USS subscription logic (activeCascade, trajectorySummaries, userStatus).
 *
 * Window isolation strategy:
 *  - Boot: workspaceState (per-workspace, per-window) restores the last cascade instantly.
 *  - Runtime: USS onDidChange + vscode.window.state.focused guard ensures only THIS
 *    window's conversation switches are accepted.
 *  - Persist: Every accepted switch is saved to workspaceState for reliable next-boot.
 */
import * as vscode from 'vscode';
import { QuotaManager } from '../managers/quotaManager';
export declare class ConversationTracker implements vscode.Disposable {
    private readonly quotaManager;
    private readonly context;
    private activeCascadeRunning;
    private lastActiveCascadeId;
    private readonly disposables;
    private bootPollTimer;
    constructor(quotaManager: QuotaManager, context: vscode.ExtensionContext);
    start(): Promise<void>;
    dispose(): void;
    private startActiveCascadeTracking;
    private startTrajectorySummariesListener;
    private startUserStatusListener;
    /** Extract UUID from a single base64-encoded protobuf value or raw string */
    private extractUuidFromValue;
    /** Extract the first UUID found in any USS state row */
    private extractFirstUuid;
    private extractEmail;
    private timeout;
}
