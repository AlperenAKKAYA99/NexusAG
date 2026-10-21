/**
 * StatusBarService — manages the VS Code status bar item for quota display.
 * Includes context window percentage inline with the active model.
 */
import * as vscode from 'vscode';
import { LocalQuotaData } from '../types';
export declare class StatusBarService {
    private readonly statusBarItem;
    private lastQuotaData;
    private lastSelectedIds;
    private ctxUsed;
    private ctxMax;
    private ctxModel;
    private ctxHideTimer;
    constructor(context: vscode.ExtensionContext);
    /** Set error state on status bar */
    setError(text: string, tooltip?: string): void;
    /** Update status bar from quota data */
    update(data: LocalQuotaData, selectedIds: string[]): void;
    /** Update context window info (shown inline with quota) */
    updateContext(usedTokens: number, maxTokens: number, model: string): void;
    private _render;
}
