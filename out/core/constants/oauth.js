"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAUTH_CALLBACK_TIMEOUT_MS = exports.TOKEN_REFRESH_BUFFER_SECS = exports.ACCOUNTS_LIST_KEY = exports.SECRETS_PREFIX = exports.OAUTH_SCOPES = exports.USERINFO_URL = exports.AUTH_URL = exports.TOKEN_URL = exports.CLIENT_SECRET = exports.CLIENT_ID = void 0;
// ─── OAuth Client Credentials (SUSP-04 / Informational) ───────────────
// Antigravity's public desktop OAuth client credentials (RFC 8252 — OAuth 2.0 for Native Apps).
// Note: Desktop/native clients cannot securely conceal client secrets; these match the open-source
// Antigravity IDE distribution and redirect solely to local loopback (127.0.0.1).
// User access/refresh tokens are stored in encrypted OS SecretStorage, never hardcoded.
exports.CLIENT_ID = '1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com';
exports.CLIENT_SECRET = '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';
// Google OAuth endpoints
exports.TOKEN_URL = 'https://oauth2.googleapis.com/token';
exports.AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
exports.USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
exports.OAUTH_SCOPES = [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/cclog',
    'https://www.googleapis.com/auth/experimentsandconfigs',
];
// Secrets storage key prefix
exports.SECRETS_PREFIX = 'ag.account.';
exports.ACCOUNTS_LIST_KEY = 'ag.trackedAccounts';
exports.TOKEN_REFRESH_BUFFER_SECS = 300; // refresh 5 min before expiry
exports.OAUTH_CALLBACK_TIMEOUT_MS = 120_000; // 2 min
//# sourceMappingURL=oauth.js.map