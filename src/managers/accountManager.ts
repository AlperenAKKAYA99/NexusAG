import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { TrackedAccount, StoredTokens, AccountQuota } from '../types';
import { SECRETS_PREFIX, ACCOUNTS_LIST_KEY, TOKEN_REFRESH_BUFFER_SECS } from '../constants';
import { GoogleAuthService } from '../services/googleAuth';
import { QuotaApiService } from '../services/quotaApi';
import { extractTokens } from '../shared/tokenExportFormatter';
import { createLogger } from '../utils/logger';

const log = createLogger('AccountManager');

export class AccountManager {
    private accounts: TrackedAccount[] = [];
    private quotaCache = new Map<string, AccountQuota>();

    private _onDidChange = new vscode.EventEmitter<void>();
    public readonly onDidChange = this._onDidChange.event;

    private readonly authService = new GoogleAuthService();
    private readonly quotaApi = new QuotaApiService();

    constructor(private readonly context: vscode.ExtensionContext) {}

    getAuthService(): GoogleAuthService { return this.authService; }

    // --- Lifecycle ---

    async initialize(): Promise<void> {
        this.accounts = this.context.globalState.get<TrackedAccount[]>(ACCOUNTS_LIST_KEY, []);
    }

    // --- Account CRUD ---

    getAccounts(): TrackedAccount[] {
        return [...this.accounts];
    }

    getQuotaCache(): Map<string, AccountQuota> {
        return this.quotaCache;
    }

    async addAccount(): Promise<boolean> {
        const result = await this.authService.startOAuthFlow();
        if (!result) return false;

        const { tokens, userInfo } = result;
        await this.upsertAccount(userInfo.email, userInfo.name, tokens);
        return true;
    }

    async removeAccount(accountId: string): Promise<void> {
        const account = this.accounts.find(a => a.id === accountId);
        if (!account) return;

        await this.context.secrets.delete(SECRETS_PREFIX + account.email);
        this.accounts = this.accounts.filter(a => a.id !== accountId);
        await this.context.globalState.update(ACCOUNTS_LIST_KEY, this.accounts);
        this.quotaCache.delete(accountId);
        this._onDidChange.fire();
    }

    // --- Quota Fetching ---

    /** Refresh quota for ALL tracked accounts in parallel */
    async refreshAllQuotas(): Promise<AccountQuota[]> {
        const results = await Promise.allSettled(
            this.accounts.map(account => this.refreshSingleQuota(account))
        );

        const quotas: AccountQuota[] = [];
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result.status === 'fulfilled') {
                quotas.push(result.value);
            } else {
                quotas.push({
                    account: this.accounts[i],
                    models: [],
                    tier: null,
                    tierName: null,
                    isForbidden: false,
                    isError: true,
                    errorMessage: result.reason?.message || 'Unknown error',
                    lastUpdated: Date.now(),
                });
            }
        }

        return quotas;
    }

    /** Get valid (auto-refreshed if needed) tokens for a tracked account */
    async getValidTokensForAccount(email: string, forceRefresh = false): Promise<StoredTokens | null> {
        try {
            return await this.getValidTokens(email, forceRefresh);
        } catch { // EXPECTED: token refresh failed — caller handles null return
            return null;
        }
    }

    // --- Private ---

    private async refreshSingleQuota(account: TrackedAccount): Promise<AccountQuota> {
        const tokens = await this.getValidTokens(account.email);
        const result = await this.quotaApi.fetchRemoteQuota(tokens.access_token);

        const quota: AccountQuota = {
            account,
            models: result.models,
            tier: result.tier,
            tierName: result.tierName,
            isForbidden: result.isForbidden,
            isError: result.isError,
            errorMessage: result.errorMessage,
            lastUpdated: Date.now(),
        };

        this.quotaCache.set(account.id, quota);
        return quota;
    }

    private async getValidTokens(email: string, forceRefresh = false): Promise<StoredTokens> {
        const json = await this.context.secrets.get(SECRETS_PREFIX + email);
        if (!json) throw new Error(`No tokens found for ${email}`);

        let tokens: StoredTokens;
        try {
            tokens = JSON.parse(json);
        } catch { /* expected: token refresh can fail for revoked accounts */
            throw new Error(`Corrupted token data for ${email}`);
        }

        // Auto-refresh if expired (with buffer) or if force-refresh requested (e.g. switch)
        if (forceRefresh || Date.now() / 1000 > tokens.expiry_timestamp - TOKEN_REFRESH_BUFFER_SECS) {
            const refreshed = await this.authService.refreshAccessToken(tokens.refresh_token);
            const updated: StoredTokens = {
                access_token: refreshed.access_token,
                // Google may rotate refresh_token — always prefer new one if returned
                refresh_token: refreshed.refresh_token || tokens.refresh_token,
                expiry_timestamp: Math.floor(Date.now() / 1000) + (refreshed.expires_in || 3600),
            };
            await this.context.secrets.store(SECRETS_PREFIX + email, JSON.stringify(updated));
            return updated;
        }

        return tokens;
    }

    private async storeTokens(email: string, tokens: { access_token: string; refresh_token: string; expires_in: number }): Promise<void> {
        const stored: StoredTokens = {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_timestamp: Math.floor(Date.now() / 1000) + (tokens.expires_in || 3600),
        };
        await this.context.secrets.store(SECRETS_PREFIX + email, JSON.stringify(stored));
    }

    // --- Token Login & Export ---

    /**
     * Add multiple accounts from a list or string of refresh tokens.
     * Tokens can be an array of strings, or a multi-line / delimited string.
     */
    async addAccountsByTokens(input: string[] | string): Promise<{
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
    }> {
        const tokens = Array.isArray(input)
            ? [...new Set(input.flatMap(t => extractTokens(t)))]
            : extractTokens(input);

        if (tokens.length === 0) {
            return { total: 0, successCount: 0, failedCount: 0, results: [] };
        }

        const results: Array<{
            token: string;
            maskedToken: string;
            email?: string;
            name?: string;
            success: boolean;
            error?: string;
            status?: 'added' | 'updated';
        }> = [];

        let successCount = 0;
        let failedCount = 0;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Adding ${tokens.length} account${tokens.length > 1 ? 's' : ''} via tokens...`,
            cancellable: false,
        }, async (progress) => {
            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                const masked = token.length > 10 ? `${token.slice(0, 6)}...${token.slice(-4)}` : '***';
                progress.report({
                    message: `(${i + 1}/${tokens.length}) Verifying ${masked}...`,
                    increment: (1 / tokens.length) * 100,
                });

                try {
                    // 1. Exchange refresh_token → access_token
                    const refreshResult = await this.authService.refreshAccessToken(token);

                    // 2. Fetch user identity
                    const userInfo = await this.authService.fetchUserInfo(refreshResult.access_token);

                    // 3. Upsert account (silent = true to avoid separate popup per account; skip notify event until loop ends)
                    const tokenData = {
                        access_token: refreshResult.access_token,
                        refresh_token: token,
                        expires_in: refreshResult.expires_in || 3600,
                    };
                    const status = await this.upsertAccount(userInfo.email, userInfo.name, tokenData, true, true);

                    successCount++;
                    results.push({
                        token,
                        maskedToken: masked,
                        email: userInfo.email,
                        name: userInfo.name,
                        success: true,
                        status,
                    });
                } catch (err: any) {
                    failedCount++;
                    const msg = err.message || String(err);
                    log.error(`Failed to add account via token (${masked}):`, msg);
                    results.push({
                        token,
                        maskedToken: masked,
                        success: false,
                        error: msg,
                    });
                }
            }
        });

        // Fire single change event for the entire batch if any accounts were added/updated
        if (successCount > 0) {
            this._onDidChange.fire();
        }

        // Summary notification
        if (tokens.length === 1) {
            const res = results[0];
            if (res.success) {
                vscode.window.showInformationMessage(`✅ ${res.status === 'updated' ? 'Token refreshed' : 'Account added'}: ${res.email}`);
            } else {
                vscode.window.showErrorMessage(`❌ Token login failed: ${res.error}`);
            }
        } else {
            const addedEmails = results.filter(r => r.success).map(r => r.email).join(', ');
            if (failedCount === 0) {
                vscode.window.showInformationMessage(`✅ Successfully added/refreshed ${successCount} accounts: ${addedEmails}`);
            } else if (successCount > 0) {
                vscode.window.showWarningMessage(`⚠️ ${successCount} accounts processed (${addedEmails}), but ${failedCount} token(s) failed.`);
            } else {
                vscode.window.showErrorMessage(`❌ Failed to add accounts. All ${failedCount} token(s) were invalid or rejected.`);
            }
        }

        return {
            total: tokens.length,
            successCount,
            failedCount,
            results,
        };
    }

    /** Add account(s) by pasting refresh token(s) via InputBox */
    async addAccountByToken(): Promise<boolean> {
        const input = await vscode.window.showInputBox({
            title: '🔑 Add Account(s) via Token',
            prompt: 'Paste one or more refresh tokens (separated by newline or space):',
            placeHolder: '1//0e... (paste single or multiple tokens)',
            ignoreFocusOut: true,
        });

        if (!input?.trim()) return false;

        const outcome = await this.addAccountsByTokens(input);
        return outcome.successCount > 0;
    }

    /** Get refresh token for an account (for clipboard copy / sharing) */
    async getRefreshToken(accountIdOrEmail: string): Promise<string | null> {
        if (!accountIdOrEmail) return null;
        const cleanId = accountIdOrEmail.replace(/^active:/, '').trim().toLowerCase();

        // 1. Find by id or email in memory accounts list
        const account = this.accounts.find(a =>
            a.id.toLowerCase() === cleanId ||
            (a.email && a.email.toLowerCase() === cleanId)
        );

        const email = account?.email || (cleanId.includes('@') ? cleanId : null);
        if (email) {
            const json = await this.context.secrets.get(SECRETS_PREFIX + email);
            if (json) {
                try {
                    const tokens: StoredTokens = JSON.parse(json);
                    if (tokens.refresh_token) return tokens.refresh_token;
                } catch { /* expected: token retrieval may fail for expired accounts */
                    log.warn(`Corrupted token data for ${email}`);
                    return null;
                }
            }
        }

        return null;
    }

    /**
     * Get refresh tokens for multiple accounts in bulk.
     * Parallel lookup without network calls (reads from OS SecretStorage).
     */
    async getRefreshTokensBulk(idsOrEmails: string[]): Promise<Array<{
        id: string;
        email?: string;
        name?: string;
        token: string | null;
        error?: string;
    }>> {
        return Promise.all(
            idsOrEmails.map(async (idOrEmail) => {
                const cleanId = idOrEmail.replace(/^active:/, '').trim().toLowerCase();
                const account = this.accounts.find(a =>
                    a.id.toLowerCase() === cleanId ||
                    (a.email && a.email.toLowerCase() === cleanId)
                );
                const email = account?.email || (cleanId.includes('@') ? cleanId : undefined);
                const name = account?.name;
                const id = account?.id || idOrEmail;

                try {
                    const token = await this.getRefreshToken(idOrEmail);
                    return { id, email, name, token };
                } catch (err: any) {
                    return { id, email, name, token: null, error: err?.message || String(err) };
                }
            })
        );
    }

    // --- DRY Helpers ---

    /**
     * Create or update an account with fresh tokens.
     * Shared by addAccount (OAuth flow) and addAccountByToken (paste flow).
     */
    private async upsertAccount(
        email: string,
        name: string | undefined,
        tokens: { access_token: string; refresh_token: string; expires_in: number },
        silent: boolean = false,
        skipNotifyEvent: boolean = false,
    ): Promise<'added' | 'updated'> {
        const existing = this.accounts.find(a => a.email === email);
        let status: 'added' | 'updated';

        if (existing) {
            await this.storeTokens(email, tokens);
            if (!silent) vscode.window.showInformationMessage(`✅ Token refreshed for ${email}`);
            status = 'updated';
        } else {
            const account: TrackedAccount = {
                id: crypto.randomBytes(8).toString('hex'),
                email,
                name: name || email,
                addedAt: Date.now(),
            };
            this.accounts.push(account);
            await this.context.globalState.update(ACCOUNTS_LIST_KEY, this.accounts);
            await this.storeTokens(account.email, tokens);
            if (!silent) vscode.window.showInformationMessage(`✅ Account added: ${email}`);
            status = 'added';
        }

        if (!skipNotifyEvent) {
            this._onDidChange.fire();
        }
        return status;
    }
}
