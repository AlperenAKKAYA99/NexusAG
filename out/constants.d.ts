export declare const CLIENT_ID = "1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com";
export declare const CLIENT_SECRET = "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";
export declare const TOKEN_URL = "https://oauth2.googleapis.com/token";
export declare const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export declare const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
export declare const OAUTH_SCOPES: string[];
export declare const QUOTA_API_ENDPOINTS: string[];
export declare const LOAD_CODE_ASSIST_ENDPOINTS: string[];
export declare const MODEL_DISPLAY_NAMES: Record<string, string>;
export declare const SECRETS_PREFIX = "ag.account.";
export declare const ACCOUNTS_LIST_KEY = "ag.trackedAccounts";
export declare const USER_AGENT = "Antigravity/4.1.29 Chrome/132.0.6834.160 Electron/39.2.3";
/** Minimum UI refresh polling interval */
export declare const POLL_INTERVAL_MS: number;
export declare const TOKEN_REFRESH_BUFFER_SECS = 300;
export declare const OAUTH_CALLBACK_TIMEOUT_MS = 120000;
/** Language Server endpoint request timeout */
export declare const LS_REQUEST_TIMEOUT_MS = 10000;
/** Default timeout for LS JSON/proto calls */
export declare const DEFAULT_LS_TIMEOUT_MS = 8000;
/** Timeout for process listing (ps/lsof) exec calls */
export declare const PROCESS_EXEC_TIMEOUT_MS = 8000;
/** Timeout for Windows WMIC exec calls */
export declare const WMIC_EXEC_TIMEOUT_MS = 5000;
/** Timeout for lsof port discovery */
export declare const LSOF_EXEC_TIMEOUT_MS = 5000;
/** Timeout for cascade probe during server discovery */
export declare const CASCADE_PROBE_TIMEOUT_MS = 3000;
/** Token renewal retry delay on transient failure */
export declare const RENEWAL_RETRY_DELAY_MS: number;
/** Bytes to read from file header for binary detection */
export declare const FILE_HEADER_READ_BYTES = 256;
export { CTX_WARNING_PCT, CTX_CRITICAL_PCT, QUOTA_HEALTHY_PCT, QUOTA_WARN_PCT, USAGE_HIGH_PCT, USAGE_MEDIUM_PCT, CASCADE_LIST_LIMIT, CASCADE_TITLE_MAX_LEN, CASCADE_ENRICHED_LIMIT, CASCADE_ENRICHED_TITLE_MAX_LEN, HOURS_IN_DAY, } from './shared/uiConstants';
/** gRPC service path for all Language Server endpoints — SSOT */
export declare const LS_SERVICE_PATH = "/exa.language_server_pb.LanguageServerService";
export { isMac, isLinux, isWindows, STATE_DB_PATH, LS_CERT_PATHS, LS_PROCESS_GREP, LS_PROCESS_GREP_LEGACY } from './shared/agPaths';
/** Unified CSRF token extraction regex — SSOT for process discovery */
export declare const CSRF_TOKEN_RE: RegExp;
export declare function isDiagEnabled(): boolean;
