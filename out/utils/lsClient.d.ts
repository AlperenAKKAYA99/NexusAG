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
}
/**
 * Find active Language Server processes and extract their HTTPS port + CSRF token
 * directly from process arguments (--https_server_port, --csrf_token).
 *
 * Cross-platform: ps on macOS/Linux, wmic on Windows.
 * Returns an empty array (never throws) so callers can safely ignore LS absence.
 */
export declare function findLSEndpoints(): Promise<LsEndpoint[]>;
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
