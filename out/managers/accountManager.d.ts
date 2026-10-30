import * as vscode from 'vscode';
import { TrackedAccount, StoredTokens, AccountQuota } from '../types';
import { GoogleAuthService } from '../services/googleAuth';
export declare class AccountManager {
    private readonly context;
    private accounts;
    private quotaCache;
    private _onDidChange;
    readonly onDidChange: vscode.Event<void>;
    private readonly authService;
    private readonly quotaApi;
    constructor(context: vscode.ExtensionContext);
    getAuthService(): GoogleAuthService;
    initialize(): Promise<void>;
    getAccounts(): TrackedAccount[];
    getQuotaCache(): Map<string, AccountQuota>;
    addAccount(): Promise<boolean>;
    removeAccount(accountId: string): Promise<void>;
    /** Refresh quota for ALL tracked accounts in parallel */
    refreshAllQuotas(): Promise<AccountQuota[]>;
    /** Get valid (auto-refreshed if needed) tokens for a tracked account */
    getValidTokensForAccount(email: string, forceRefresh?: boolean): Promise<StoredTokens | null>;
    private refreshSingleQuota;
    private getValidTokens;
    private storeTokens;
    /**
     * Add multiple accounts from a list or string of refresh tokens.
     * Tokens can be an array of strings, or a multi-line / delimited string.
     */
    addAccountsByTokens(input: string[] | string): Promise<{
        total: number;
        successCount: number;
        failedCount: number;
        results: Array<{
            token: string;
            maskedToken: string;
            email?: string;
            name?: string;
            success: boolean;
            error?: string;
            status?: 'added' | 'updated';
        }>;
    }>;
    /** Add account(s) by pasting refresh token(s) via InputBox */
    addAccountByToken(): Promise<boolean>;
    /** Get refresh token for an account (for clipboard copy / sharing) */
    getRefreshToken(accountIdOrEmail: string): Promise<string | null>;
    /**
     * Create or update an account with fresh tokens.
     * Shared by addAccount (OAuth flow) and addAccountByToken (paste flow).
     */
    private upsertAccount;
}
