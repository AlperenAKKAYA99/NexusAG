// ==================== USS Topic Types ====================

/** Reverse-engineered USS row shape: { value: base64_protobuf, eTag: bigint } */
export interface USSRow {
    value: string;
    eTag: bigint;
    $typeName?: string;
}

/** USS topic subscription (reverse-engineered from IDE internals) */
export interface USSTopic {
    getState(): Record<string, USSRow> | null;
    onDidChange(handler: () => void): { dispose(): void };
}

// ==================== IDE Internal Types ====================

/** OAuth token info for USS uss-oauth topic */
export interface OAuthTokenInfo {
    accessToken: string;
    refreshToken: string;
    expiryDateSeconds: number;
    tokenType: string;
    isGcpTos: boolean;
}

/**
 * Typed accessor for the IDE's antigravityUnifiedStateSync API.
 * This API is injected by the IDE and is not part of the official vscode API.
 */
export interface USSApi {
    OAuthPreferences: {
        setOAuthTokenInfo(info: OAuthTokenInfo): Promise<void>;
        getOAuthTokenInfo(): Promise<string | null>;
    };
    UserStatus: {
        getUserStatus(): Promise<string | null>;
    };
    pushSerializedUpdateIPC(data: string): Promise<void>;
}

/** Typed HTTP error with status code (replaces monkey-patched Error) */
export class HttpError extends Error {
    constructor(public readonly statusCode: number, message: string) {
        super(message);
        this.name = 'HttpError';
    }
}
