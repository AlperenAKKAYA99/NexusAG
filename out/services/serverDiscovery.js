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
exports.ServerDiscoveryService = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const vscode = __importStar(require("vscode"));
const constants_1 = require("../constants");
const lsClient_1 = require("../utils/lsClient");
const logger_1 = require("../utils/logger");
const log = (0, logger_1.createLogger)('ServerDiscovery');
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class ServerDiscoveryService {
    /**
     * Discover the local Antigravity language server.
     *
     * Strategy (Antigravity ≥ 2.27.0):
     * 1. Process scan → find `agy.exe --hub` processes with --hub-port and --csrf_token
     * 2. Match workspace via --add-dir against vscode.workspace.workspaceFolders
     * 3. Port is directly known from --hub-port — no netstat scan needed
     * 4. Probe the known port+CSRF until GetUserStatus responds
     *
     * Fallback (pre-2.27.0):
     * 1. Find `language_server_*` processes
     * 2. Port scan via netstat
     * 3. Probe each candidate
     */
    async discover(workspaceId) {
        try {
            // ── Phase 0: Direct window-scoped endpoint from google.google-antigravity extension ──
            const extEndpoint = (0, lsClient_1.getAgyExtensionEndpoint)();
            if (extEndpoint) {
                try {
                    await this.probe({ port: extEndpoint.port, csrfToken: extEndpoint.csrf, protocol: 'http' });
                    log.diag(`discover: ✓ agy extension exports port=${extEndpoint.port}`);
                    return { port: extEndpoint.port, csrfToken: extEndpoint.csrf, protocol: 'http' };
                }
                catch (e) {
                    log.diag(`discover: agy extension exports port=${extEndpoint.port} probe failed: ${e?.message}`);
                }
            }
            let candidates = constants_1.isWindows
                ? await this.findCandidatesWindows()
                : await this.findCandidatesUnix();
            log.diag(`discover: ${candidates.length} candidates on ${constants_1.isWindows ? 'Windows' : 'Unix'} (wsFilter=${workspaceId ?? 'none'})`);
            if (candidates.length > 0) {
                log.diag(`discover: ${candidates.map(c => `pid=${c.pid} hub=${c.isAgyHub ?? false} addDirs=${c.addDirs?.join(',') ?? 'none'} wsId=${c.wsId ?? 'global'}`).join(' | ')}`);
            }
            // ── Workspace matching ──
            // New agy --hub: match via --add-dir (filesystem path)
            // Legacy: match via --workspace_id (UUID)
            const currentWorkspacePaths = (vscode.workspace.workspaceFolders ?? []).map(folder => folder.uri.fsPath);
            if (currentWorkspacePaths.length > 0 || workspaceId) {
                const matching = candidates.filter(c => {
                    // New agy --hub: compare --add-dir with current workspace path
                    if (c.addDirs?.length && currentWorkspacePaths.length > 0) {
                        return c.addDirs.some(directory => currentWorkspacePaths.some(workspace => (0, lsClient_1.pathsEqual)(directory, workspace)));
                    }
                    // Legacy: compare --workspace_id
                    if (c.wsId && workspaceId) {
                        return c.wsId === workspaceId;
                    }
                    return false;
                });
                log.diag(`discover: workspace filter → ${matching.length}/${candidates.length} match`);
                if (matching.length > 1 && matching.some(c => c.isAgyHub && c.addDirs?.length)) {
                    log.warn('discover: multiple agy Hubs matched the active workspace; refusing ambiguous selection');
                    return null;
                }
                if (matching.length > 0) {
                    candidates = matching;
                }
                else if (candidates.some(c => c.isAgyHub && c.addDirs?.length)) {
                    log.warn('discover: no agy Hub matched the active workspace; refusing to probe another window');
                    return null;
                }
            }
            else if (candidates.length > 1 && candidates.some(c => c.isAgyHub && c.addDirs?.length)) {
                log.warn('discover: multiple workspace-scoped agy Hubs found without an active workspace');
                return null;
            }
            for (const cand of candidates) {
                // ── New agy --hub: port is directly known ──
                if (cand.hubPort) {
                    try {
                        await this.probe({ port: cand.hubPort, csrfToken: cand.csrfToken, protocol: 'http' });
                        log.diag(`discover: ✓ hub-port ${cand.hubPort} pid=${cand.pid}`);
                        return { port: cand.hubPort, csrfToken: cand.csrfToken, protocol: 'http', httpsPort: cand.httpsPort };
                    }
                    catch (e) {
                        log.diag(`discover: hub-port ${cand.hubPort} failed: ${e?.message}`);
                    }
                    continue;
                }
                // ── Legacy: scan ports via netstat ──
                const ports = await this.getListeningPorts(cand.pid);
                log.diag(`discover: pid=${cand.pid} → ports: [${ports.join(', ')}]`);
                if (ports.length === 0) {
                    log.warn(`discover: pid=${cand.pid} has no listening TCP ports — skipping`);
                    continue;
                }
                for (const port of ports) {
                    try {
                        await this.probe({ port, csrfToken: cand.csrfToken, protocol: 'http' });
                        log.diag(`discover: ✓ port ${port} pid=${cand.pid}`);
                        return { port, csrfToken: cand.csrfToken, protocol: 'http', httpsPort: cand.httpsPort };
                    }
                    catch (e) {
                        log.diag(`discover: port ${port} failed`);
                    }
                }
            }
        }
        catch (e) {
            log.warn('discover: exception during discovery:', e?.message);
        }
        return null;
    }
    /**
     * Discover the LS instance that handles cascade/chat operations.
     *
     * Antigravity ≥ 2.27.0 architecture:
     *   Each IDE window spawns a SINGLE `agy --hub` instance that handles
     *   BOTH code completions AND cascade/chat — no separate Global LS.
     *   The hub-port is the same for workspace and cascade operations.
     *
     * Pre-2.27.0 architecture:
     *   Two separate LS instances (Workspace + Global). The Global LS
     *   holds cascade data. We probe all candidates to find the right one.
     *
     * Strategy: try ALL LS instances, probe each with GetCascadeTrajectory for the
     * given cascadeId, and return the one that has actual data (numTotalGeneratorMetadata > 0).
     * Falls back to the workspace LS if no cascade-specific LS is found.
     */
    async discoverCascadeServer(cascadeId, workspaceServer) {
        try {
            const extEndpoint = (0, lsClient_1.getAgyExtensionEndpoint)();
            if (extEndpoint) {
                return workspaceServer ?? { port: extEndpoint.port, csrfToken: extEndpoint.csrf, protocol: 'http' };
            }
            const candidates = constants_1.isWindows
                ? await this.findCandidatesWindows()
                : await this.findCandidatesUnix();
            // ── New architecture: agy --hub handles everything ──
            // If workspace server is already an agy hub, it's also the cascade server.
            const agyHubCandidates = candidates.filter(c => c.isAgyHub);
            if (agyHubCandidates.length > 0) {
                if (workspaceServer) {
                    log.diag(`discoverCascadeServer: agy hub detected — using workspace server (port=${workspaceServer.port})`);
                    return workspaceServer;
                }
                const resolvedHub = await this.discover();
                if (resolvedHub) {
                    log.diag(`discoverCascadeServer: agy hub detected — resolved workspace hub (port=${resolvedHub.port})`);
                    return resolvedHub;
                }
            }
            // ── Legacy: try Global LS (no wsId) first ──
            const globalCandidates = candidates.filter(c => !c.wsId && !c.isAgyHub);
            let firstReachableGlobal = null;
            for (const cand of globalCandidates) {
                const ports = cand.hubPort ? [cand.hubPort] : await this.getListeningPorts(cand.pid);
                if (ports.length === 0)
                    continue;
                for (const port of ports) {
                    try {
                        const info = { port, csrfToken: cand.csrfToken, protocol: 'http', httpsPort: cand.httpsPort };
                        const resp = await (0, lsClient_1.callLsJson)(info, 'GetCascadeTrajectory', { cascade_id: cascadeId }, constants_1.CASCADE_PROBE_TIMEOUT_MS);
                        const metaCount = parseInt(resp?.numTotalGeneratorMetadata || '0', 10);
                        if (!firstReachableGlobal)
                            firstReachableGlobal = info;
                        if (metaCount > 0)
                            return info;
                    }
                    catch { /* port doesn't respond */ }
                }
            }
            if (firstReachableGlobal)
                return firstReachableGlobal;
        }
        catch { /* expected: HTTP probe may fail if port not listening */
            // Discovery failed
        }
        // Fallback: return workspace server only if no Global LS is reachable
        return workspaceServer ?? null;
    }
    /** macOS / Linux: use ps to find candidates */
    async findCandidatesUnix() {
        const candidates = [];
        // ── New: agy --hub processes ──
        try {
            const { stdout } = await execAsync(`ps -A -ww -o pid,args | grep "${constants_1.LS_PROCESS_GREP}" | grep -- "--hub" | grep -v grep`);
            candidates.push(...this.parsePsOutput(stdout, true));
            log.info(`findCandidatesUnix: found ${candidates.length} agy hub candidate(s)`);
        }
        catch { /* no agy processes — expected on older AG versions */ }
        // ── Legacy fallback: language_server_* processes ──
        if (candidates.length === 0) {
            try {
                const { stdout } = await execAsync(`ps -A -ww -o pid,args | grep "${constants_1.LS_PROCESS_GREP_LEGACY}" | grep -v grep`);
                candidates.push(...this.parsePsOutput(stdout, false));
                log.info(`findCandidatesUnix: found ${candidates.length} legacy LS candidate(s)`);
            }
            catch { /* no legacy processes either */ }
        }
        return candidates;
    }
    /**
     * Windows: use PowerShell + wmic fallback to find candidates (with PID).
     *
     * Searches for BOTH agy.exe --hub (new) and language_server_win (legacy).
     * Prefers agy hub candidates when both are present.
     */
    async findCandidatesWindows() {
        const candidates = [];
        // ── Phase 1: Search for new agy --hub processes ──
        candidates.push(...await this.findWindowsProcessesByGrep(constants_1.LS_PROCESS_GREP, true));
        // ── Phase 2: Legacy fallback if no agy candidates found ──
        if (candidates.length === 0) {
            log.info('findCandidatesWindows: no agy hub processes — trying legacy language_server_win');
            candidates.push(...await this.findWindowsProcessesByGrep(constants_1.LS_PROCESS_GREP_LEGACY, false));
        }
        return candidates;
    }
    /**
     * Find Windows processes matching `grep` pattern and parse their command lines.
     * Prefers PowerShell Get-WmiObject, falls back to wmic CSV, then CommandLine-only.
     */
    async findWindowsProcessesByGrep(grep, isAgyHub) {
        // Emit "PID|||CommandLine" per process so we can capture the real PID.
        // Triple-pipe separator is safe — never appears in process command lines.
        const ps = `powershell -NoProfile -Command "Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -like '*${grep}*' } | ForEach-Object { ($_.ProcessId.ToString() + '|||' + $_.CommandLine) }"`;
        const wmicFallback = `wmic process where "CommandLine like '%${grep}%'" get ProcessId,CommandLine /format:csv 2>nul`;
        let rawLines = [];
        try {
            const { stdout } = await execAsync(ps, { timeout: constants_1.PROCESS_EXEC_TIMEOUT_MS });
            rawLines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
            log.info(`findWindowsProcesses(${grep}): PowerShell returned ${rawLines.length} line(s)`);
        }
        catch (e) {
            log.warn(`findWindowsProcesses(${grep}): PowerShell failed (${e?.message}) — trying wmic CSV fallback`);
            try {
                const { stdout } = await execAsync(wmicFallback, { timeout: constants_1.PROCESS_EXEC_TIMEOUT_MS });
                const csvLines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
                for (const line of csvLines.slice(1)) {
                    const cols = line.split(',');
                    if (cols.length >= 3) {
                        const pid = cols[cols.length - 1].trim();
                        const cmdLine = cols.slice(1, -1).join(',').trim();
                        rawLines.push(`${pid}|||${cmdLine}`);
                    }
                }
                log.info(`findWindowsProcesses(${grep}): wmic CSV returned ${rawLines.length} line(s)`);
            }
            catch (e2) {
                log.warn(`findWindowsProcesses(${grep}): wmic also failed (${e2?.message}) — falling back to CommandLine-only (pid=0)`);
                rawLines = (await (0, lsClient_1.getWindowsProcessLines)(grep)).map(l => `0|||${l}`);
            }
        }
        return rawLines.flatMap(line => {
            const sepIdx = line.indexOf('|||');
            let pid = '0';
            let cmdLine = line;
            if (sepIdx > 0) {
                const maybePid = line.substring(0, sepIdx).trim();
                if (/^\d+$/.test(maybePid)) {
                    pid = maybePid;
                    cmdLine = line.substring(sepIdx + 3);
                }
            }
            const csrf = cmdLine.match(constants_1.CSRF_TOKEN_RE)?.[1];
            if (!csrf)
                return [];
            // ── agy --hub: filter to only --hub instances ──
            if (isAgyHub && !cmdLine.includes('--hub'))
                return [];
            // ── Extract port ──
            // New: --hub-port=PORT (agy ≥ 2.27.0)
            const hubPortMatch = cmdLine.match(/--hub-port[=\s]+(\d+)/);
            // Legacy: --https_server_port=PORT
            const httpsPortMatch = cmdLine.match(/--https_server_port[\s=]+(\d+)/);
            // ── Extract workspace ──
            // New: --add-dir=PATH (may be quoted)
            const addDirs = (0, lsClient_1.extractCommandLineArgumentValues)(cmdLine, 'add-dir');
            // Legacy: --workspace_id=UUID
            const wsIdMatch = cmdLine.match(/--workspace_id[\s=]+(\S+)/);
            const candidate = {
                pid,
                csrfToken: csrf,
                isAgyHub,
                hubPort: hubPortMatch ? parseInt(hubPortMatch[1], 10) : undefined,
                httpsPort: httpsPortMatch ? parseInt(httpsPortMatch[1], 10) : undefined,
                addDirs: addDirs.length > 0 ? addDirs : undefined,
                wsId: wsIdMatch?.[1],
            };
            log.info(`findWindowsProcesses(${grep}): candidate pid=${pid} hub=${isAgyHub} port=${candidate.hubPort ?? 'discover'} dirs=${candidate.addDirs?.join(',') ?? 'none'} wsId=${candidate.wsId ?? 'global'} csrf=${csrf.substring(0, 8)}...`);
            return [candidate];
        });
    }
    /** Parse `ps` stdout into candidates */
    parsePsOutput(stdout, isAgyHub) {
        const candidates = [];
        for (const line of stdout.split('\n')) {
            if (!line.trim())
                continue;
            const pidMatch = line.trim().match(/^(\d+)\s/);
            if (!pidMatch)
                continue;
            const tokenMatch = line.match(constants_1.CSRF_TOKEN_RE);
            if (!tokenMatch)
                continue;
            // Filter to only --hub instances for agy search
            if (isAgyHub && !line.includes('--hub'))
                continue;
            const hubPortMatch = line.match(/--hub-port[\s=]+(\d+)/);
            const httpsPortMatch = line.match(/--https_server_port\s+(\d+)/);
            const addDirs = (0, lsClient_1.extractCommandLineArgumentValues)(line, 'add-dir');
            const wsMatch = line.match(/--workspace_id\s+(\S+)/);
            candidates.push({
                pid: pidMatch[1],
                csrfToken: tokenMatch[1],
                isAgyHub,
                hubPort: hubPortMatch ? parseInt(hubPortMatch[1], 10) : undefined,
                httpsPort: httpsPortMatch ? parseInt(httpsPortMatch[1], 10) : undefined,
                addDirs: addDirs.length > 0 ? addDirs : undefined,
                wsId: wsMatch?.[1],
            });
        }
        return candidates;
    }
    /** Get TCP listening ports for a specific PID */
    async getListeningPorts(pid) {
        try {
            const ports = [];
            if (constants_1.isWindows) {
                // netstat -ano shows PID in last column
                const { stdout } = await execAsync(`netstat -ano -p TCP 2>nul`);
                for (const line of stdout.split('\n')) {
                    if (!line.includes('LISTENING'))
                        continue;
                    const parts = line.trim().split(/\s+/);
                    if (parts[parts.length - 1] !== pid)
                        continue;
                    const portMatch = parts[1]?.match(/:(\d+)$/);
                    if (portMatch)
                        ports.push(parseInt(portMatch[1], 10));
                }
            }
            else {
                const { stdout } = await execAsync(`lsof -Pan -p ${pid} -i TCP -sTCP:LISTEN 2>/dev/null`);
                for (const line of stdout.split('\n')) {
                    const match = line.match(/:(\d+)\s+\(LISTEN\)/);
                    if (match)
                        ports.push(parseInt(match[1], 10));
                }
            }
            return ports;
        }
        catch { /* expected: discovery may fail under heavy load */
            return [];
        }
    }
    /** Fetch GetUserStatus from the local language server */
    fetchLocalQuota(serverInfo) {
        return (0, lsClient_1.callLsJson)(serverInfo, 'GetUserStatus', {
            metadata: { ideName: 'antigravity', extensionName: 'antigravity', locale: 'en' },
        }, constants_1.CASCADE_PROBE_TIMEOUT_MS);
    }
    /** Quick probe to validate a server candidate */
    probe(serverInfo) {
        return this.fetchLocalQuota(serverInfo).then(() => { });
    }
}
exports.ServerDiscoveryService = ServerDiscoveryService;
//# sourceMappingURL=serverDiscovery.js.map