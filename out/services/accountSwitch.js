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
exports.AccountSwitchService = void 0;
const vscode = __importStar(require("vscode"));
const uss_1 = require("../utils/uss");
const logger_1 = require("../utils/logger");
const lsClient_1 = require("../utils/lsClient");
const constants_1 = require("../constants");
const auth_1 = require("./auth");
const log = (0, logger_1.createLogger)('AccountSwitch');
/**
 * AccountSwitchService — Coordinates IDE account switching across both
 * Antigravity ≥ 2.27 (`AgyHubBackend`) and pre-2.27 (`LegacyUssBackend`).
 */
class AccountSwitchService {
    context;
    authService;
    // Proactive Token Renewal state (used only on LegacyUssBackend)
    renewalTimer = null;
    activeRefreshToken = null;
    activeEmail = null;
    // Monotonically increasing counter per switch call to abort stale polls.
    switchGeneration = 0;
    /** Buffer before expiry to trigger refresh (10 minutes in seconds) */
    static RENEWAL_BUFFER_SECS = 10 * 60;
    /** Minimum delay to prevent tight loops on clock skew (30 seconds) */
    static MIN_RENEWAL_DELAY_MS = 30_000;
    /** Maximum safe setTimeout delay — Node.js caps at 2^31-1 ms (~24.8 days) */
    static MAX_TIMEOUT_MS = 2_147_483_647;
    constructor(context, authService) {
        this.context = context;
        this.authService = authService;
    }
    /** Clean up the renewal timer on extension deactivation */
    dispose() {
        if (this.renewalTimer) {
            clearTimeout(this.renewalTimer);
            this.renewalTimer = null;
        }
        this.switchGeneration++; // Abort any running polls
        this.activeRefreshToken = null;
        this.activeEmail = null;
        log.info('Token renewal stopped');
    }
    /** Returns the active refresh token in memory if known */
    getActiveRefreshToken() {
        return this.activeRefreshToken;
    }
    async switchAccount(opts) {
        const { email, refreshToken, expiryTimestamp } = opts;
        // Bump generation FIRST — aborts any in-flight polling from previous switch
        this.switchGeneration++;
        const generation = this.switchGeneration;
        const isCancelled = () => generation !== this.switchGeneration;
        try {
            await (0, auth_1.suppressTermsNotice)(email, this.context);
            const backend = await (0, auth_1.resolveAuthBackend)(this.context);
            log.info(`switchAccount: using backend=${backend.type} for ${email}`);
            const result = await backend.switchAccount(opts, isCancelled);
            // Schedule proactive token renewal ONLY for confirmed legacy-uss switches.
            // In Antigravity ≥ 2.27 (`agy-hub`), the Hub manages its own token lifecycle.
            if (result.confirmed && result.backend === 'legacy-uss') {
                this.scheduleTokenRenewal(refreshToken, expiryTimestamp, email);
            }
            else {
                if (this.renewalTimer) {
                    clearTimeout(this.renewalTimer);
                    this.renewalTimer = null;
                }
                if (result.confirmed) {
                    this.activeRefreshToken = refreshToken;
                    this.activeEmail = email;
                }
                log.info(`Token renewal skipped (confirmed=${result.confirmed}, backend=${result.backend})`);
            }
            if (result.confirmed) {
                vscode.window.showInformationMessage(`✅ Switched to ${email}`);
            }
            return result;
        }
        catch (err) {
            vscode.window.showErrorMessage(`Failed to switch account: ${err?.message || err}`);
            log.error('Switch failed:', err);
            return { confirmed: false, backend: (await (0, lsClient_1.isAgyHubActive)()) ? 'agy-hub' : 'legacy-uss' };
        }
    }
    // ==================== Proactive Token Renewal (Legacy USS Only) ====================
    scheduleTokenRenewal(refreshToken, expiryTimestamp, email) {
        if (this.renewalTimer) {
            clearTimeout(this.renewalTimer);
            this.renewalTimer = null;
        }
        this.activeRefreshToken = refreshToken;
        this.activeEmail = email;
        const nowSecs = Math.floor(Date.now() / 1000);
        const renewAtSecs = expiryTimestamp - AccountSwitchService.RENEWAL_BUFFER_SECS;
        const delayMs = Math.min(Math.max((renewAtSecs - nowSecs) * 1000, AccountSwitchService.MIN_RENEWAL_DELAY_MS), AccountSwitchService.MAX_TIMEOUT_MS);
        const delayMins = Math.round(delayMs / 60_000);
        log.info(`Token renewal scheduled in ${delayMins}m for ${email} (expiry in ${Math.round((expiryTimestamp - nowSecs) / 60)}m)`);
        this.renewalTimer = setTimeout(() => this.executeRenewal(), delayMs);
    }
    async executeRenewal() {
        if (!this.activeRefreshToken || !this.activeEmail)
            return;
        // If IDE upgraded or switched to agy --hub, stop legacy renewal loop
        if (await (0, lsClient_1.isAgyHubActive)()) {
            log.info('agy --hub detected; stopping legacy USS token renewal');
            return;
        }
        try {
            const refreshed = await this.authService.refreshAccessToken(this.activeRefreshToken);
            const newExpiry = Math.floor(Date.now() / 1000) + (refreshed.expires_in || 3600);
            if (refreshed.refresh_token) {
                this.activeRefreshToken = refreshed.refresh_token;
            }
            const uss = (0, uss_1.getUSS)();
            if (uss) {
                await uss.OAuthPreferences.setOAuthTokenInfo({
                    accessToken: refreshed.access_token,
                    refreshToken: this.activeRefreshToken,
                    expiryDateSeconds: newExpiry,
                    tokenType: 'Bearer',
                    isGcpTos: false,
                });
            }
            const endpoints = await (0, lsClient_1.findLSEndpoints)();
            if (endpoints.length > 0) {
                const ca = (0, lsClient_1.loadLSCert)();
                await Promise.allSettled(endpoints.map(ls => (0, lsClient_1.callLSEndpoint)(ls, `${constants_1.LS_SERVICE_PATH}/RegisterGdmUser`, ca)));
            }
            log.info(`✅ Token renewed for ${this.activeEmail}, next in ~${Math.round((refreshed.expires_in || 3600) / 60) - 10}m`);
            this.scheduleTokenRenewal(this.activeRefreshToken, newExpiry, this.activeEmail);
        }
        catch (err) {
            log.error(`❌ Token renewal failed for ${this.activeEmail}:`, err?.message || err);
            this.renewalTimer = setTimeout(() => this.executeRenewal(), constants_1.RENEWAL_RETRY_DELAY_MS);
        }
    }
    // ==================== Shared Public Helpers ====================
    buildUserStatusProto(name, email) {
        return (0, auth_1.buildUserStatusProto)(name, email);
    }
    async writeAuthStatusToDb(name, email, apiKey) {
        return (0, auth_1.writeAuthStatusToDb)(name, email, apiKey);
    }
    async testApiAccess() {
        try {
            if (await (0, lsClient_1.isAgyHubActive)())
                return true;
            const uss = (0, uss_1.getUSS)();
            if (!uss)
                return false;
            await uss.OAuthPreferences.getOAuthTokenInfo();
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.AccountSwitchService = AccountSwitchService;
//# sourceMappingURL=accountSwitch.js.map