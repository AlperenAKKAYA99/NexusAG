export declare class GoogleAuthService {
    /** Exchange an authorization code for access + refresh tokens */
    exchangeCode(code: string, redirectUri: string): Promise<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
    }>;
    /** Refresh an expired access token using the stored refresh token */
    refreshAccessToken(refreshToken: string): Promise<{
        access_token: string;
        expires_in: number;
        refresh_token?: string;
    }>;
    /** Fetch Google user profile (email, name) */
    fetchUserInfo(accessToken: string): Promise<{
        email: string;
        name: string;
    }>;
    /**
     * Full OAuth2 flow: open browser → local callback server → capture tokens.
     * Returns the raw token response and user info, or null on cancel/timeout.
     */
    startOAuthFlow(): Promise<{
        tokens: {
            access_token: string;
            refresh_token: string;
            expires_in: number;
        };
        userInfo: {
            email: string;
            name: string;
        };
    } | null>;
    private postForm;
}
