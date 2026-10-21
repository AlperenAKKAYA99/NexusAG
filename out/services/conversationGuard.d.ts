/**
 * Conversation Guard — Detection & Fix Orchestrator
 * Detects missing conversations by comparing .pb files on disk
 * with the sidebar index in state.vscdb, and spawns a detached
 * worker to rebuild the index when requested.
 */
import * as vscode from 'vscode';
export interface MissingConversationDetail {
    id: string;
    title: string;
    date: string;
}
export interface ConversationStatus {
    onDisk: number;
    inIndex: number;
    missing: number;
    missingIds: string[];
}
export declare class ConversationGuard implements vscode.Disposable {
    private readonly context;
    private _dismissedCount;
    private _lastStatus;
    private _dbAvailable;
    private _onStatusChange;
    readonly onStatusChange: vscode.Event<ConversationStatus>;
    constructor(context: vscode.ExtensionContext);
    /** Run detection after a delay (non-blocking) */
    startDelayedDetection(delayMs?: number): void;
    /** Get the last detection result */
    getLastStatus(): ConversationStatus | null;
    /**
     * Detect missing conversations via ID-level set diff.
     * A simple count comparison (100 disk == 100 index) can hide
     * mismatches where ghost entries mask missing ones.
     */
    detect(): Promise<ConversationStatus | null>;
    /** Extract conversation IDs from the trajectory summaries protobuf index.
     *  Delegates to titleResolver.getGlobalIndexData() — SSOT for protobuf parsing.
     *  Uses allIds (not titleMap) to include title-less indexed conversations. */
    private _readIndexIds;
    /** Dismiss the current missing count (don't nag again for the same number) */
    dismiss(): void;
    /** Check if the current missing count was already dismissed */
    isDismissed(): boolean;
    /** Resolve titles & dates for missing conversations (for UI display).
     *  lsTitles: optional map from GetAllCascadeTrajectories LS endpoint (highest fidelity) */
    resolveMissingDetails(ids: string[], lsTitles?: Map<string, string>): MissingConversationDetail[];
    /** Spawn detached worker to fix conversations — AG will quit */
    runFix(extraRelaunchInfo?: Record<string, any>): void;
    dispose(): void;
}
