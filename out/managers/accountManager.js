"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountManager = void 0;
const vscode = __importStar(require("vscode"));
const crypto = __importStar(require("crypto"));
const constants_1 = require("../constants");
const googleAuth_1 = require("../services/googleAuth");
const quotaApi_1 = require("../services/quotaApi");
const logger_1 = require("../utils/logger");
const log = (0, logger_1.createLogger)('AccountManager');
class AccountManager {
    context;
    accounts = [];
    quotaCache = new Map();
    _onDidChange = new vscode.EventEmitter();
    onDidChange = this._onDidChange.event;
    authService = new googleAuth_1.GoogleAuthService();
    quotaApi = new quotaApi_1.QuotaApiService();
    constructor(context) {
        this.context = context;
    }
    getAuthService() { return this.authService; }
    // --- Lifecycle ---
    async initialize() {
        this.accounts = this.context.globalState.get(constants_1.ACCOUNTS_LIST_KEY, []);
    }
    // --- Account CRUD ---
    getAccounts() {
        return [...this.accounts];
    }
    getQuotaCache() {
        return this.quotaCache;
    }
    async addAccount() {
        const result = await this.authService.startOAuthFlow();
        if (!result)
            return false;
        const { tokens, userInfo } = result;
        await this.upsertAccount(userInfo.email, userInfo.name, tokens);
        return true;
    }
    async removeAccount(accountId) {
        const account = this.accounts.find(a => a.id === accountId);
        if (!account)
            return;
        await this.context.secrets.delete(constants_1.SECRETS_PREFIX + account.email);
        this.accounts = this.accounts.filter(a => a.id !== accountId);
        await this.context.globalState.update(constants_1.ACCOUNTS_LIST_KEY, this.accounts);
        this.quotaCache.delete(accountId);
        this._onDidChange.fire();
    }
    // --- Quota Fetching ---
    /** Refresh quota for ALL tracked accounts in parallel */
    async refreshAllQuotas() {
        const results = await Promise.allSettled(this.accounts.map(account => this.refreshSingleQuota(account)));
        const quotas = [];
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result.status === 'fulfilled') {
                quotas.push(result.value);
            }
            else {
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
    async getValidTokensForAccount(email, forceRefresh = false) {
        try {
            return await this.getValidTokens(email, forceRefresh);
        }
        catch { // EXPECTED: token refresh failed — caller handles null return
            return null;
        }
    }
    // --- Private ---
    async refreshSingleQuota(account) {
        const tokens = await this.getValidTokens(account.email);
        const result = await this.quotaApi.fetchRemoteQuota(tokens.access_token);
        const quota = {
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
    async getValidTokens(email, forceRefresh = false) {
        const json = await this.context.secrets.get(constants_1.SECRETS_PREFIX + email);
        if (!json)
            throw new Error(`No tokens found for ${email}`);
        let tokens;
        try {
            tokens = JSON.parse(json);
        }
        catch { /* expected: token refresh can fail for revoked accounts */
            throw new Error(`Corrupted token data for ${email}`);
        }
        // Auto-refresh if expired (with buffer) or if force-refresh requested (e.g. switch)
        if (forceRefresh || Date.now() / 1000 > tokens.expiry_timestamp - constants_1.TOKEN_REFRESH_BUFFER_SECS) {
            const refreshed = await this.authService.refreshAccessToken(tokens.refresh_token);
            const updated = {
                access_token: refreshed.access_token,
                // Google may rotate refresh_token — always prefer new one if returned
                refresh_token: refreshed.refresh_token || tokens.refresh_token,
                expiry_timestamp: Math.floor(Date.now() / 1000) + (refreshed.expires_in || 3600),
            };
            await this.context.secrets.store(constants_1.SECRETS_PREFIX + email, JSON.stringify(updated));
            return updated;
        }
        return tokens;
    }
    async storeTokens(email, tokens) {
        const stored = {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_timestamp: Math.floor(Date.now() / 1000) + (tokens.expires_in || 3600),
        };
        await this.context.secrets.store(constants_1.SECRETS_PREFIX + email, JSON.stringify(stored));
    }
    // --- Token Login & Export ---
    /**
     * Add multiple accounts from a list or string of refresh tokens.
     * Tokens can be an array of strings, or a multi-line / delimited string.
     */
    async addAccountsByTokens(input) {
        const rawTokens = (Array.isArray(input) ? input : input.split(/[\r\n\s,;]+/))
            .map(t => t.trim())
            .filter(t => t.length > 0);
        // Deduplicate tokens
        const tokens = [...new Set(rawTokens)];
        if (tokens.length === 0) {
            return { total: 0, successCount: 0, failedCount: 0, results: [] };
        }
        const results = [];
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
                }
                catch (err) {
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
            }
            else {
                vscode.window.showErrorMessage(`❌ Token login failed: ${res.error}`);
            }
        }
        else {
            const addedEmails = results.filter(r => r.success).map(r => r.email).join(', ');
            if (failedCount === 0) {
                vscode.window.showInformationMessage(`✅ Successfully added/refreshed ${successCount} accounts: ${addedEmails}`);
            }
            else if (successCount > 0) {
                vscode.window.showWarningMessage(`⚠️ ${successCount} accounts processed (${addedEmails}), but ${failedCount} token(s) failed.`);
            }
            else {
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
    async addAccountByToken() {
        const input = await vscode.window.showInputBox({
            title: '🔑 Add Account(s) via Token',
            prompt: 'Paste one or more refresh tokens (separated by newline or space):',
            placeHolder: '1//0e... (paste single or multiple tokens)',
            ignoreFocusOut: true,
        });
        if (!input?.trim())
            return false;
        const outcome = await this.addAccountsByTokens(input);
        return outcome.successCount > 0;
    }
    /** Get refresh token for an account (for clipboard copy / sharing) */
    async getRefreshToken(accountIdOrEmail) {
        if (!accountIdOrEmail)
            return null;
        const cleanId = accountIdOrEmail.replace(/^active:/, '').trim().toLowerCase();
        // 1. Find by id or email in memory accounts list
        const account = this.accounts.find(a => a.id.toLowerCase() === cleanId ||
            (a.email && a.email.toLowerCase() === cleanId));
        const email = account?.email || (cleanId.includes('@') ? cleanId : null);
        if (email) {
            const json = await this.context.secrets.get(constants_1.SECRETS_PREFIX + email);
            if (json) {
                try {
                    const tokens = JSON.parse(json);
                    if (tokens.refresh_token)
                        return tokens.refresh_token;
                }
                catch { /* expected: token retrieval may fail for expired accounts */
                    log.warn(`Corrupted token data for ${email}`);
                    return null;
                }
            }
        }
        return null;
    }
    // --- DRY Helpers ---
    /**
     * Create or update an account with fresh tokens.
     * Shared by addAccount (OAuth flow) and addAccountByToken (paste flow).
     */
    async upsertAccount(email, name, tokens, silent = false, skipNotifyEvent = false) {
        const existing = this.accounts.find(a => a.email === email);
        let status;
        if (existing) {
            await this.storeTokens(email, tokens);
            if (!silent)
                vscode.window.showInformationMessage(`✅ Token refreshed for ${email}`);
            status = 'updated';
        }
        else {
            const account = {
                id: crypto.randomBytes(8).toString('hex'),
                email,
                name: name || email,
                addedAt: Date.now(),
            };
            this.accounts.push(account);
            await this.context.globalState.update(constants_1.ACCOUNTS_LIST_KEY, this.accounts);
            await this.storeTokens(account.email, tokens);
            if (!silent)
                vscode.window.showInformationMessage(`✅ Account added: ${email}`);
            status = 'added';
        }
        if (!skipNotifyEvent) {
            this._onDidChange.fire();
        }
        return status;
    }
}
exports.AccountManager = AccountManager;
//# sourceMappingURL=accountManager.js.map