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
exports.GoogleAuthService = void 0;
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const crypto = __importStar(require("crypto"));
const vscode = __importStar(require("vscode"));
const constants_1 = require("../constants");
const oauthSuccess_1 = require("../templates/oauthSuccess");
const logger_1 = require("../utils/logger");
/** Timeout for Google API HTTP requests (userinfo, token exchange) */
const GOOGLE_API_TIMEOUT_MS = 10_000;
const http_1 = require("../utils/http");
const log = (0, logger_1.createLogger)('GoogleAuth');
class GoogleAuthService {
    /** Exchange an authorization code for access + refresh tokens */
    async exchangeCode(code, redirectUri) {
        const body = new URLSearchParams({
            client_id: constants_1.CLIENT_ID,
            client_secret: constants_1.CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
        }).toString();
        return this.postForm(constants_1.TOKEN_URL, body);
    }
    /** Refresh an expired access token using the stored refresh token */
    async refreshAccessToken(refreshToken) {
        const body = new URLSearchParams({
            client_id: constants_1.CLIENT_ID,
            client_secret: constants_1.CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }).toString();
        return this.postForm(constants_1.TOKEN_URL, body);
    }
    /** Fetch Google user profile (email, name) */
    async fetchUserInfo(accessToken) {
        return new Promise((resolve, reject) => {
            const req = https.get(constants_1.USERINFO_URL, {
                headers: { Authorization: `Bearer ${accessToken}` },
                timeout: GOOGLE_API_TIMEOUT_MS,
            }, async (res) => {
                try {
                    const { status, body } = await (0, http_1.collectBody)(res);
                    if (status === 200) {
                        resolve(JSON.parse(body));
                    }
                    else {
                        reject(new Error(`UserInfo failed: HTTP ${status}`));
                    }
                }
                catch (e) {
                    reject(e);
                }
            });
            req.on('error', reject);
        });
    }
    /**
     * Full OAuth2 flow: open browser → local callback server → capture tokens.
     * Returns the raw token response and user info, or null on cancel/timeout.
     */
    async startOAuthFlow() {
        return new Promise((resolve) => {
            const port = 19876 + Math.floor(Math.random() * 100);
            const redirectUri = `http://127.0.0.1:${port}/callback`;
            const state = crypto.randomBytes(16).toString('hex');
            const authUrl = `${constants_1.AUTH_URL}?` + new URLSearchParams({
                client_id: constants_1.CLIENT_ID,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: constants_1.OAUTH_SCOPES.join(' '),
                access_type: 'offline',
                prompt: 'consent',
                state,
            }).toString();
            let server = null;
            const timeout = setTimeout(() => {
                server?.close();
                resolve(null);
            }, constants_1.OAUTH_CALLBACK_TIMEOUT_MS);
            server = http.createServer(async (req, res) => {
                if (!req.url?.startsWith('/callback')) {
                    res.writeHead(404);
                    res.end();
                    return;
                }
                const parsed = new URL(req.url, 'http://localhost');
                const code = parsed.searchParams.get('code') ?? '';
                const returnedState = parsed.searchParams.get('state') ?? '';
                if (!code || returnedState !== state) {
                    res.writeHead(400);
                    res.end('Invalid callback. Please try again.');
                    clearTimeout(timeout);
                    server?.close();
                    resolve(null);
                    return;
                }
                try {
                    const tokens = await this.exchangeCode(code, redirectUri);
                    const userInfo = await this.fetchUserInfo(tokens.access_token);
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end((0, oauthSuccess_1.getOAuthSuccessHtml)(userInfo.email));
                    clearTimeout(timeout);
                    server?.close();
                    resolve({ tokens, userInfo });
                }
                catch (err) {
                    log.error('OAuth error:', err);
                    res.writeHead(500);
                    res.end('Authentication failed: ' + err.message);
                    clearTimeout(timeout);
                    server?.close();
                    resolve(null);
                }
            });
            server.listen(port, '127.0.0.1', () => {
                vscode.env.openExternal(vscode.Uri.parse(authUrl));
                vscode.window.showInformationMessage('Browser opened for Google login. Complete the sign-in to add your account.');
            });
            server.on('error', (err) => {
                log.error('Callback server error:', err);
                clearTimeout(timeout);
                resolve(null);
            });
        });
    }
    // --- Private ---
    postForm(endpoint, body) {
        return new Promise((resolve, reject) => {
            const parsed = new URL(endpoint);
            const req = https.request({
                hostname: parsed.hostname,
                path: parsed.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(body),
                },
                timeout: GOOGLE_API_TIMEOUT_MS,
            }, async (res) => {
                try {
                    const { status, body: data } = await (0, http_1.collectBody)(res);
                    if (status === 200) {
                        resolve(JSON.parse(data));
                    }
                    else {
                        reject(new Error(`Token request failed: HTTP ${status} — ${data.substring(0, 200)}`));
                    }
                }
                catch (e) {
                    reject(e);
                }
            });
            req.on('error', reject);
            req.write(body);
            req.end();
        });
    }
}
exports.GoogleAuthService = GoogleAuthService;
//# sourceMappingURL=googleAuth.js.map