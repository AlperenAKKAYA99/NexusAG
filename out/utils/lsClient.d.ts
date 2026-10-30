/**
 * Language Server HTTP client utilities — shared across all LS callers.
 *
 * Previously duplicated in accountSwitch.ts and tokenBase.ts.
 * Centralised here so each fix only needs to happen once.
 *
 * Process-discovery strategy:
 *   - macOS/Linux: `ps -A -ww -o args` + grep
 *   - Windows:     `wmic process … get CommandLine`
 *
 * Both approaches read --https_server_port and --csrf_token directly from
 * the process argv, which is faster than going via lsof/netstat (that is
 * serverDiscovery.ts's concern, which resolves the separate API port).
 */
/**
 * Returns raw command-line strings for all processes matching `grep` on Windows.
 * Prefers PowerShell (works on Win 11 22H2+ where wmic is removed), falls back to wmic.
 * Never throws — returns [] on any failure.
 */
export declare function getWindowsProcessLines(grep: string): Promise<string[]>;
/** { port, csrf, wsId } tuple extracted from a running Language Server process */
export interface LsEndpoint {
    port: number;
    csrf: string;
    /** workspace_id from LS process args — used to match the active workspace */
    wsId?: string;
    /** Workspace paths from agy --add-dir arguments */
    workspaceDirs?: string[];
    /** True when the endpoint belongs to an Antigravity ≥ 2.27 `agy --hub` process */
    isHub?: boolean;
}
/** Extract all values for a process argument, preserving quoted paths with spaces. */
export declare function extractCommandLineArgumentValues(commandLine: string, name: string): string[];
/** Compare paths using the active platform's path and case rules. */
export declare function pathsEqual(left: string, right: string): boolean;
/**
 * Read the current window's `agy --hub` endpoint directly from the built-in
 * `google.google-antigravity` extension exports (`{ csrfToken, port, client, getRpcClient }`).
 *
 * In Antigravity IDE ≥ 2.27.0, the built-in extension spawns `agy --hub` without `--add-dir`
 * and exposes its exact `port` and `csrfToken` via `extension.exports`. Reading this directly
 * avoids PowerShell/WMIC process scanning and guarantees window-scoped accuracy even when
 * multiple IDE windows are open.
 */
export declare function getAgyExtensionEndpoint(): LsEndpoint | null;
/**
 * Find active Language Server processes and extract their HTTPS port + CSRF token
 * directly from process arguments.
 *
 * Antigravity ≥ 2.27.0:
 *   1. Fast path: read `{ port, csrfToken }` directly from `google.google-antigravity` extension exports.
 *   2. Process fallback: `agy.exe --hub --hub-port=PORT --csrf_token=TOKEN`
 * Pre-2.27.0: `language_server_win --https_server_port=PORT --csrf_token=TOKEN`
 *   → uses --https_server_port as the HTTPS-only port.
 *
 * Cross-platform: ps on macOS/Linux, wmic on Windows.
 * Returns an empty array (never throws) so callers can safely ignore LS absence.
 */
export declare function findLSEndpoints(): Promise<LsEndpoint[]>;
/**
 * Returns true if any Antigravity ≥ 2.27 `agy --hub` process is currently running.
 */
export declare function isAgyHubActive(): Promise<boolean>;
/**
 * Load the Language Server's self-signed TLS certificate.
 * Tries a dynamic path relative to the LS binary first, then falls back to
 * platform-specific installation paths defined in LS_CERT_PATHS.
 *
 * Returns undefined (never throws) — callers should fall back to
 * `rejectUnauthorized: false` when no cert is found.
 */
export declare function loadLSCert(): Buffer | undefined;
/**
 * Make a ConnectRPC-style POST to a Language Server endpoint.
 *
 * Antigravity ≥ 2.27.0 (`ls.isHub === true`): `agy --hub` serves plain HTTP
 * on `--hub-port` with no TLS cert, so we use HTTP directly and avoid wasted
 * TLS handshake failures.
 * Pre-2.27.0: tries HTTPS first, then falls back to HTTP.
 *
 * @param ls       - Endpoint info (port + CSRF token)
 * @param endpoint - Full gRPC path, e.g.
 *                   '/exa.language_server_pb.LanguageServerService/RegisterGdmUser'
 * @param ca       - Optional CA cert.  If omitted TLS verification is skipped.
 */
export declare function callLSEndpoint(ls: LsEndpoint, endpoint: string, ca?: Buffer): Promise<Buffer>;
import { ServerInfo } from '../types';
/**
 * POST JSON to a Language Server HTTP endpoint and return parsed JSON.
 * This is the SSOT for all JSON-based LS communication.
 *
 * @param serverInfo  - Server connection info (port + csrf)
 * @param method      - RPC method name, e.g. 'GetAllCascadeTrajectories'
 * @param body        - JSON body to send (default: {})
 * @param timeoutMs   - Request timeout (default: 8000ms)
 */
export declare function callLsJson(serverInfo: ServerInfo, method: string, body?: Record<string, unknown>, timeoutMs?: number): Promise<any>;
/**
 * POST to a Language Server HTTP endpoint and return raw Buffer (for proto responses).
 * This is the SSOT for all proto-binary LS communication.
 */
export declare function callLsProto(serverInfo: ServerInfo, endpointPath: string, timeoutMs?: number): Promise<Buffer>;
/**
 * POST JSON to a Language Server HTTPS endpoint (for RPC Direct calls).
 * This is the SSOT for all HTTPS JSON-based LS communication.
 */
export declare function callLsHttpsJson(httpsPort: number, csrfToken: string, path: string, body?: Record<string, unknown>, timeoutMs?: number): Promise<any>;
