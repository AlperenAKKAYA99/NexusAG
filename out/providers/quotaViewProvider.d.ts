import * as vscode from 'vscode';
import { ViewState } from '../types';
import { QuotaManager } from '../managers/quotaManager';
import { AccountManager } from '../managers/accountManager';
import { ConversationGuard } from '../services/conversationGuard';
export declare class QuotaViewProvider implements vscode.WebviewViewProvider {
    private readonly extensionUri;
    private readonly quotaManager;
    private readonly accountManager;
    private readonly convGuard?;
    private _view?;
    constructor(extensionUri: vscode.Uri, quotaManager: QuotaManager, accountManager: AccountManager, convGuard?: ConversationGuard | undefined);
    resolveWebviewView(webviewView: vscode.WebviewView, _context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken): void;
    setLoading(): void;
    setError(message: string): void;
    updateData(state: ViewState): void;
    /** Push context window data to webview (separate from main update) */
    postContextWindow(data: any): void;
    /** Generic message passthrough to webview */
    postMessage(msg: Record<string, any>): void;
    /** Push locale and translation dictionary to webview */
    pushLocale(locale: string, translations: Record<string, string>): void;
    private handleUsageRange;
}
