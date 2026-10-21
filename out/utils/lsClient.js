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
exports.findLSEndpoints = findLSEndpoints;
exports.loadLSCert = loadLSCert;
exports.callLSEndpoint = callLSEndpoint;
exports.callLsJson = callLsJson;
exports.callLsProto = callLsProto;
exports.callLsHttpsJson = callLsHttpsJson;
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
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
// ==================== Process Discovery ====================
/**
 * Find active Language Server processes and extract their HTTPS port + CSRF token
 * directly from process arguments (--https_server_port, --csrf_token).
 *
 * Cross-platform: ps on macOS/Linux, wmic on Windows.
 * Returns an empty array (never throws) so callers can safely ignore LS absence.
 */
async function findLSEndpoints() {
    try {
        let lines;
        if (constants_1.isWindows) {
            lines = await getWindowsProcessLines(constants_1.LS_PROCESS_GREP);
        }
        else {
            const { stdout } = await execAsync(`ps -A -ww -o args | grep "${constants_1.LS_PROCESS_GREP}" | grep -v grep`, { timeout: constants_1.LSOF_EXEC_TIMEOUT_MS });
            lines = stdout.trim().split('\n').filter(Boolean);
        }
        return lines.flatMap(line => {
            const port = line.match(/--https_server_port[=\s]+(\d+)/)?.[1];
            const csrf = line.match(constants_1.CSRF_TOKEN_RE)?.[1];
            const wsId = line.match(/--workspace_id[=\s]+(\S+)/)?.[1];
            return port && csrf ? [{ port: +port, csrf, wsId }] : [];
        });
    }
    catch { /* expected: JSON parse failure — raw text response */
        return [];
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
/**
 * Make a ConnectRPC-style POST to a Language Server endpoint.
 *
 * @param ls       - Endpoint info (port + CSRF token)
 * @param endpoint - Full gRPC path, e.g.
 *                   '/exa.language_server_pb.LanguageServerService/RegisterGdmUser'
 * @param ca       - Optional CA cert.  If omitted TLS verification is skipped.
 */
function callLSEndpoint(ls, endpoint, ca) {
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