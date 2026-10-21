"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerDiscoveryService = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const constants_1 = require("../constants");
const lsClient_1 = require("../utils/lsClient");
const logger_1 = require("../utils/logger");
const log = (0, logger_1.createLogger)('ServerDiscovery');
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class ServerDiscoveryService {
    /**
     * Discover the local Antigravity language server.
     *
     * Strategy:
     * 1. Process scan → find language_server PIDs + LSP CSRF tokens
     * 2. Port scan → find actual TCP listening ports for each PID
     * 3. Probe each port+CSRF combination until GetUserStatus responds
     *
     * macOS/Linux: uses `ps` + `lsof`
     * Windows:     uses `wmic` + `netstat`
     */
    async discover(workspaceId) {
        try {
            let candidates = constants_1.isWindows
                ? await this.findCandidatesWindows()
                : await this.findCandidatesUnix();
            log.diag(`discover: ${candidates.length} candidates on ${constants_1.isWindows ? 'Windows' : 'Unix'} (wsFilter=${workspaceId ?? 'none'})`);
            if (candidates.length > 0) {
                log.diag(`discover: ${candidates.map(c => `pid=${c.pid} wsId=${c.wsId ?? 'global'}`).join(' | ')}`);
            }
            // STRICT workspace isolation: if workspaceId is provided,
            // ONLY try candidates from the same workspace.
            // Falling through to other workspaces causes wrong-LS contamination.
            if (workspaceId) {
                const matching = candidates.filter(c => c.wsId === workspaceId);
                log.diag(`discover: workspace filter '${workspaceId}' → ${matching.length}/${candidates.length} match`);
                if (matching.length > 0) {
                    candidates = matching; // Only probe our workspace's LS
                }
                // If no match found, fall through to all candidates (cold start)
            }
            for (const cand of candidates) {
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
     * The IDE runs TWO LS processes:
     *   1. Workspace LS (--workspace_id, --enable_lsp) → code completions, quota
     *   2. Global LS (no workspace_id) → cascade/chat inference, generator metadata
     *
     * Context window data (GetCascadeTrajectory, generator metadata) lives on the
     * GLOBAL LS. Standard discover() finds the workspace LS, which returns empty
     * trajectory data for cascades it doesn't manage.
     *
     * Strategy: try ALL LS instances, probe each with GetCascadeTrajectory for the
     * given cascadeId, and return the one that has actual data (numTotalGeneratorMetadata > 0).
     * Falls back to the workspace LS if no cascade-specific LS is found.
     */
    async discoverCascadeServer(cascadeId, workspaceServer) {
        try {
            const candidates = constants_1.isWindows
                ? await this.findCandidatesWindows()
                : await this.findCandidatesUnix();
            // Prioritize Global LS (no wsId) over Workspace LS (has wsId).
            // The Global LS holds live cascade/chat inference data;
            // Workspace LS only has a stale snapshot.
            const globalCandidates = candidates.filter(c => !c.wsId);
            // Track the first reachable Global LS — even if it has no data for this
            // cascade yet (brand new conversation), it's still the correct target
            // because inference runs on the Global LS.
            let firstReachableGlobal = null;
            for (const cand of globalCandidates) {
                const ports = await this.getListeningPorts(cand.pid);
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
            // Brand new cascade: Global LS is reachable but has no metadata yet.
            // Return it anyway — data will appear once inference starts.
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
        const { stdout } = await execAsync(`ps -A -ww -o pid,args | grep "${constants_1.LS_PROCESS_GREP}" | grep -v grep`);
        return this.parsePsOutput(stdout);
    }
    /** Windows: use PowerShell + wmic fallback to find candidates (with PID) */
    async findCandidatesWindows() {
        // Emit "PID|||CommandLine" per process so we can capture the real PID.
        // Triple-pipe separator is safe — never appears in process command lines.
        const ps = `powershell -NoProfile -Command "Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -like '*${constants_1.LS_PROCESS_GREP}*' } | ForEach-Object { ($_.ProcessId.ToString() + '|||' + $_.CommandLine) }"`;
        const wmicFallback = `wmic process where "CommandLine like '%${constants_1.LS_PROCESS_GREP}%'" get ProcessId,CommandLine /format:csv 2>nul`;
        let rawLines = [];
        try {
            const { stdout } = await execAsync(ps, { timeout: constants_1.PROCESS_EXEC_TIMEOUT_MS });
            rawLines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
            log.info(`findCandidatesWindows: PowerShell returned ${rawLines.length} line(s)`);
        }
        catch (e) {
            log.warn(`findCandidatesWindows: PowerShell failed (${e?.message}) — trying wmic CSV fallback`);
            try {
                // wmic CSV: "Node,CommandLine,ProcessId" header + data rows
                const { stdout } = await execAsync(wmicFallback, { timeout: constants_1.PROCESS_EXEC_TIMEOUT_MS });
                const csvLines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
                // Skip header row, convert "Node,CmdLine,PID" → "PID|||CmdLine"
                for (const line of csvLines.slice(1)) {
                    const cols = line.split(',');
                    if (cols.length >= 3) {
                        const pid = cols[cols.length - 1].trim();
                        const cmdLine = cols.slice(1, -1).join(',').trim();
                        rawLines.push(`${pid}|||${cmdLine}`);
                    }
                }
                log.info(`findCandidatesWindows: wmic CSV returned ${rawLines.length} line(s)`);
            }
            catch (e2) {
                log.warn(`findCandidatesWindows: wmic also failed (${e2?.message}) — falling back to CommandLine-only (pid=0)`);
                rawLines = (await (0, lsClient_1.getWindowsProcessLines)(constants_1.LS_PROCESS_GREP)).map(l => `0|||${l}`);
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
            const wsId = cmdLine.match(/--workspace_id[\s=]+(\S+)/)?.[1];
            const httpsPortMatch = cmdLine.match(/--https_server_port[\s=]+(\d+)/);
            if (csrf) {
                log.info(`findCandidatesWindows: candidate pid=${pid} wsId=${wsId ?? 'global'} httpsPort=${httpsPortMatch?.[1] ?? 'none'} csrf=${csrf.substring(0, 8)}...`);
            }
            return csrf ? [{ pid, csrfToken: csrf, wsId, httpsPort: httpsPortMatch ? parseInt(httpsPortMatch[1], 10) : undefined }] : [];
        });
    }
    /** Parse `ps` stdout into candidates */
    parsePsOutput(stdout) {
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
            const wsMatch = line.match(/--workspace_id\s+(\S+)/);
            const httpsPortMatch = line.match(/--https_server_port\s+(\d+)/);
            candidates.push({
                pid: pidMatch[1],
                csrfToken: tokenMatch[1],
                wsId: wsMatch?.[1],
                httpsPort: httpsPortMatch ? parseInt(httpsPortMatch[1], 10) : undefined,
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