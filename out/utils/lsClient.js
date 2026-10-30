"use strict";
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
exports.getWindowsProcessLines = getWindowsProcessLines;
exports.extractCommandLineArgumentValues = extractCommandLineArgumentValues;
exports.pathsEqual = pathsEqual;
exports.getAgyExtensionEndpoint = getAgyExtensionEndpoint;
exports.findLSEndpoints = findLSEndpoints;
exports.isAgyHubActive = isAgyHubActive;
exports.loadLSCert = loadLSCert;
exports.callLSEndpoint = callLSEndpoint;
exports.callLsJson = callLsJson;
exports.callLsProto = callLsProto;
exports.callLsHttpsJson = callLsHttpsJson;
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const constants_1 = require("../constants");
const http_1 = require("./http");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Returns raw command-line strings for all processes matching `grep` on Windows.
 * Prefers PowerShell (works on Win 11 22H2+ where wmic is removed), falls back to wmic.
 * Never throws — returns [] on any failure.
 */
async function getWindowsProcessLines(grep) {
    const ps = `powershell -NoProfile -Command "Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -like '*${grep}*' } | Select-Object -ExpandProperty CommandLine"`;
    const wmic = `wmic process where "CommandLine like '%${grep}%'" get CommandLine /format:value 2>nul`;
    try {
        const { stdout } = await execAsync(ps, { timeout: constants_1.PROCESS_EXEC_TIMEOUT_MS });
        return stdout.split('\n').map(l => l.trim()).filter(Boolean);
    }
    catch { /* expected: base64 decode may fail for non-protobuf data */
        try {
            const { stdout } = await execAsync(wmic, { timeout: constants_1.WMIC_EXEC_TIMEOUT_MS });
            // wmic /format:value emits "CommandLine=<value>" lines
            return stdout.split('\n')
                .map(l => l.replace(/^CommandLine=/i, '').trim())
                .filter(Boolean);
        }
        catch { /* expected: CSRF extraction heuristic — try next pattern */
            return [];
        }
    }
}
/** Extract all values for a process argument, preserving quoted paths with spaces. */
function extractCommandLineArgumentValues(commandLine, name) {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(?:^|\\s)--${escapedName}(?:=|\\s+)(?:"([^"]*)"|'([^']*)'|([^\\s]+))`, 'g');
    const values = [];
    for (const match of commandLine.matchAll(pattern)) {
        const value = match[1] ?? match[2] ?? match[3];
        if (value)
            values.push(value);
    }
    return values;
}
/** Compare paths using the active platform's path and case rules. */
function pathsEqual(left, right) {
    const normalizedLeft = path.normalize(left);
    const normalizedRight = path.normalize(right);
    return process.platform === 'win32'
        ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
        : normalizedLeft === normalizedRight;
}
/**
 * Read the current window's `agy --hub` endpoint directly from the built-in
 * `google.google-antigravity` extension exports (`{ csrfToken, port, client, getRpcClient }`).
 *
 * In Antigravity IDE ≥ 2.27.0, the built-in extension spawns `agy --hub` without `--add-dir`
 * and exposes its exact `port` and `csrfToken` via `extension.exports`. Reading this directly
 * avoids PowerShell/WMIC process scanning and guarantees window-scoped accuracy even when
 * multiple IDE windows are open.
 */
function getAgyExtensionEndpoint() {
    try {
        const ext = vscode.extensions.getExtension('google.google-antigravity');
        if (!ext || !ext.isActive || !ext.exports)
            return null;
        const exportsObj = ext.exports;
        const rawPort = typeof exportsObj.port === 'function'
            ? exportsObj.port()
            : (exportsObj.port ?? exportsObj.client?.port);
        const csrf = exportsObj.csrfToken ?? exportsObj.client?.csrfToken;
        if (typeof rawPort === 'number' && Number.isInteger(rawPort) && rawPort > 0 && rawPort <= 65535 && csrf) {
            return {
                port: rawPort,
                csrf,
                wsId: 'global',
                isHub: true,
            };
        }
    }
    catch { /* ignore */ }
    return null;
}
// ==================== Process Discovery ====================
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
async function findLSEndpoints() {
    try {
        // ── Phase 0: Direct window-scoped endpoint from google.google-antigravity extension ──
        const extEndpoint = getAgyExtensionEndpoint();
        if (extEndpoint) {
            return [extEndpoint];
        }
        // ── Phase 1: Try new agy --hub processes ──
        let lines;
        if (constants_1.isWindows) {
            lines = await getWindowsProcessLines(constants_1.LS_PROCESS_GREP);
        }
        else {
            const { stdout } = await execAsync(`ps -A -ww -o args | grep "${constants_1.LS_PROCESS_GREP}" | grep -v grep`, { timeout: constants_1.LSOF_EXEC_TIMEOUT_MS });
            lines = stdout.trim().split('\n').filter(Boolean);
        }
        // Parse agy --hub lines: --hub-port gives us the port
        const agyEndpoints = lines.flatMap(line => {
            if (!line.includes('--hub'))
                return [];
            const rawPort = extractCommandLineArgumentValues(line, 'hub-port')[0];
            const port = rawPort ? Number(rawPort) : 0;
            const csrf = line.match(constants_1.CSRF_TOKEN_RE)?.[1];
            const workspaceDirs = extractCommandLineArgumentValues(line, 'add-dir');
            return Number.isInteger(port) && port > 0 && port <= 65535 && csrf
                ? [{ port, csrf, workspaceDirs, isHub: true }]
                : [];
        });
        if (agyEndpoints.length > 0) {
            const workspacePaths = (vscode.workspace.workspaceFolders ?? []).map(folder => folder.uri.fsPath);
            if (workspacePaths.length > 0 && agyEndpoints.some(endpoint => endpoint.workspaceDirs?.length)) {
                const matching = agyEndpoints.filter(endpoint => endpoint.workspaceDirs?.some(directory => workspacePaths.some(workspace => pathsEqual(directory, workspace))));
                if (matching.length === 1)
                    return matching;
                return [];
            }
            if (agyEndpoints.length > 1 && workspacePaths.length === 0 &&
                agyEndpoints.some(endpoint => endpoint.workspaceDirs?.length)) {
                return [];
            }
            return agyEndpoints;
        }
        // ── Phase 2: Legacy fallback ──
        let legacyLines;
        if (constants_1.isWindows) {
            legacyLines = await getWindowsProcessLines(constants_1.LS_PROCESS_GREP_LEGACY);
        }
        else {
            const { stdout } = await execAsync(`ps -A -ww -o args | grep "${constants_1.LS_PROCESS_GREP_LEGACY}" | grep -v grep`, { timeout: constants_1.LSOF_EXEC_TIMEOUT_MS });
            legacyLines = stdout.trim().split('\n').filter(Boolean);
        }
        return legacyLines.flatMap(line => {
            const port = line.match(/--https_server_port[=\s]+(\d+)/)?.[1];
            const csrf = line.match(constants_1.CSRF_TOKEN_RE)?.[1];
            const wsId = line.match(/--workspace_id[=\s]+(\S+)/)?.[1];
            return port && csrf ? [{ port: +port, csrf, wsId, isHub: false }] : [];
        });
    }
    catch { /* expected: process scan may fail */
        return [];
    }
}
/**
 * Returns true if any Antigravity ≥ 2.27 `agy --hub` process is currently running.
 */
async function isAgyHubActive() {
    try {
        const endpoints = await findLSEndpoints();
        if (endpoints.some(e => e.isHub))
            return true;
        let lines;
        if (constants_1.isWindows) {
            lines = await getWindowsProcessLines(constants_1.LS_PROCESS_GREP);
        }
        else {
            const { stdout } = await execAsync(`ps -A -ww -o args | grep "${constants_1.LS_PROCESS_GREP}" | grep -v grep`, { timeout: constants_1.LSOF_EXEC_TIMEOUT_MS });
            lines = stdout.trim().split('\n').filter(Boolean);
        }
        return lines.some(line => line.includes('--hub'));
    }
    catch {
        return false;
    }
}
// ==================== Certificate ====================
/**
 * Load the Language Server's self-signed TLS certificate.
 * Tries a dynamic path relative to the LS binary first, then falls back to
 * platform-specific installation paths defined in LS_CERT_PATHS.
 *
 * Returns undefined (never throws) — callers should fall back to
 * `rejectUnauthorized: false` when no cert is found.
 */
function loadLSCert() {
    const dynamicPath = path.join(path.dirname(require.main?.filename || ''), '..', 'languageServer', 'cert.pem');
    for (const p of [dynamicPath, ...constants_1.LS_CERT_PATHS]) {
        try {
            return fs.readFileSync(p);
        }
        catch { /* try next candidate */ }
    }
    return undefined;
}
// ==================== HTTP ====================
function callLSEndpointHttp(ls, endpoint) {
    return new Promise((resolve, reject) => {
        const httpReq = http.request({
            hostname: '127.0.0.1',
            port: ls.port,
            path: endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/proto',
                'Connect-Protocol-Version': '1',
                'x-codeium-csrf-token': ls.csrf,
                'Content-Length': '0',
            },
        }, async (res) => {
            try {
                const { status, body } = await (0, http_1.collectBuffer)(res);
                if (status === 200) {
                    resolve(body);
                }
                else {
                    reject(new Error(`HTTP ${status}: ${body.toString().substring(0, 200)}`));
                }
            }
            catch (e) {
                reject(e);
            }
        });
        httpReq.on('error', reject);
        httpReq.setTimeout(constants_1.LS_REQUEST_TIMEOUT_MS, () => httpReq.destroy(new Error('LS HTTP request timed out')));
        httpReq.end();
    });
}
function callLSEndpointHttps(ls, endpoint, ca) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'localhost',
            port: ls.port,
            path: endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/proto',
                'Connect-Protocol-Version': '1',
                'x-codeium-csrf-token': ls.csrf,
                'Content-Length': '0',
            },
            ...(ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false }),
        }, async (res) => {
            try {
                const { status, body } = await (0, http_1.collectBuffer)(res);
                if (status === 200) {
                    resolve(body);
                }
                else {
                    reject(new Error(`HTTP ${status}: ${body.toString().substring(0, 200)}`));
                }
            }
            catch (e) {
                reject(e);
            }
        });
        req.on('error', reject);
        req.setTimeout(constants_1.LS_REQUEST_TIMEOUT_MS, () => req.destroy(new Error('LS request timed out')));
        req.end();
    });
}
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
async function callLSEndpoint(ls, endpoint, ca) {
    if (ls.isHub) {
        try {
            return await callLSEndpointHttp(ls, endpoint);
        }
        catch {
            return callLSEndpointHttps(ls, endpoint, ca);
        }
    }
    try {
        return await callLSEndpointHttps(ls, endpoint, ca);
    }
    catch {
        return callLSEndpointHttp(ls, endpoint);
    }
}
/**
 * POST JSON to a Language Server HTTP endpoint and return parsed JSON.
 * This is the SSOT for all JSON-based LS communication.
 *
 * @param serverInfo  - Server connection info (port + csrf)
 * @param method      - RPC method name, e.g. 'GetAllCascadeTrajectories'
 * @param body        - JSON body to send (default: {})
 * @param timeoutMs   - Request timeout (default: 8000ms)
 */
function callLsJson(serverInfo, method, body = {}, timeoutMs = constants_1.DEFAULT_LS_TIMEOUT_MS) {
    const fullPath = method.startsWith('/') ? method : `${constants_1.LS_SERVICE_PATH}/${method}`;
    return new Promise((resolve, reject) => {
        const bodyStr = JSON.stringify(body);
        const req = http.request({
            hostname: '127.0.0.1',
            port: serverInfo.port,
            path: fullPath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
                'Connect-Protocol-Version': '1',
                'X-Codeium-Csrf-Token': serverInfo.csrfToken,
            },
            timeout: timeoutMs,
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const status = res.statusCode ?? 0;
                if (status >= 200 && status < 300) {
                    try {
                        resolve(JSON.parse(data));
                    }
                    catch {
                        resolve(null);
                    }
                }
                else {
                    reject(new Error(`${method} HTTP ${status}: ${data.substring(0, 200)}`));
                }
            });
            res.on('error', reject);
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error(`${method} timeout`)); });
        req.write(bodyStr);
        req.end();
    });
}
/**
 * POST to a Language Server HTTP endpoint and return raw Buffer (for proto responses).
 * This is the SSOT for all proto-binary LS communication.
 */
function callLsProto(serverInfo, endpointPath, timeoutMs = constants_1.DEFAULT_LS_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: serverInfo.port,
            path: endpointPath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/proto',
                'Content-Length': '0',
                'Connect-Protocol-Version': '1',
                'X-Codeium-Csrf-Token': serverInfo.csrfToken,
            },
            timeout: timeoutMs,
        }, async (res) => {
            try {
                const { status, body } = await (0, http_1.collectBuffer)(res);
                if (status === 200) {
                    resolve(body);
                }
                else {
                    reject(new Error(`HTTP ${status}: ${body.toString().substring(0, 100)}`));
                }
            }
            catch (e) {
                reject(e);
            }
        });
        req.on('error', reject);
        req.on('timeout', () => req.destroy(new Error('timeout')));
        req.end();
    });
}
/**
 * POST JSON to a Language Server HTTPS endpoint (for RPC Direct calls).
 * This is the SSOT for all HTTPS JSON-based LS communication.
 */
function callLsHttpsJson(httpsPort, csrfToken, path, body = {}, timeoutMs = constants_1.DEFAULT_LS_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
        const bodyStr = JSON.stringify(body);
        const req = https.request({
            hostname: '127.0.0.1',
            port: httpsPort,
            path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
                'Connect-Protocol-Version': '1',
                'X-Codeium-Csrf-Token': csrfToken,
            },
            timeout: timeoutMs,
            rejectUnauthorized: false,
        }, (res) => {
            let data = '';
            res.on('data', (c) => { data += c; });
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    }
                    catch {
                        reject(new Error(`Invalid JSON from ${path}`));
                    }
                }
                else {
                    reject(new Error(`${path} returned ${res.statusCode}`));
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error(`${path} timeout`)); });
        req.write(bodyStr);
        req.end();
    });
}
//# sourceMappingURL=lsClient.js.map