import * as vscode from 'vscode';
import { GoogleAuthService } from './googleAuth';
import { SwitchAccountOptions } from '../types';
import { AuthSwitchResult } from './auth';
/**
 * AccountSwitchService — Coordinates IDE account switching across both
 * Antigravity ≥ 2.27 (`AgyHubBackend`) and pre-2.27 (`LegacyUssBackend`).
 */
export declare class AccountSwitchService {
    private readonly context;
    private readonly authService;
    private renewalTimer;
    private activeRefreshToken;
    private activeEmail;
    private switchGeneration;
    /** Buffer before expiry to trigger refresh (10 minutes in seconds) */
    private static readonly RENEWAL_BUFFER_SECS;
    /** Minimum delay to prevent tight loops on clock skew (30 seconds) */
    private static readonly MIN_RENEWAL_DELAY_MS;
    /** Maximum safe setTimeout delay — Node.js caps at 2^31-1 ms (~24.8 days) */
    private static readonly MAX_TIMEOUT_MS;
    constructor(context: vscode.ExtensionContext, authService: GoogleAuthService);
    /** Clean up the renewal timer on extension deactivation */
    dispose(): void;
    /** Returns the active refresh token in memory if known */
    getActiveRefreshToken(): string | null;
    switchAccount(opts: SwitchAccountOptions): Promise<AuthSwitchResult>;
    private scheduleTokenRenewal;
    private executeRenewal;
    buildUserStatusProto(name: string, email: string): string;
    writeAuthStatusToDb(name: string, email: string, apiKey: string): Promise<boolean>;
    testApiAccess(): Promise<boolean>;
}
