import { ServerInfo } from '../types';
export declare class ServerDiscoveryService {
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
    discover(workspaceId?: string): Promise<ServerInfo | null>;
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
    discoverCascadeServer(cascadeId: string, workspaceServer?: ServerInfo | null): Promise<ServerInfo | null>;
    /** macOS / Linux: use ps to find candidates */
    private findCandidatesUnix;
    /**
     * Windows: use PowerShell + wmic fallback to find candidates (with PID).
     *
     * Searches for BOTH agy.exe --hub (new) and language_server_win (legacy).
     * Prefers agy hub candidates when both are present.
     */
    private findCandidatesWindows;
    /**
     * Find Windows processes matching `grep` pattern and parse their command lines.
     * Prefers PowerShell Get-WmiObject, falls back to wmic CSV, then CommandLine-only.
     */
    private findWindowsProcessesByGrep;
    /** Parse `ps` stdout into candidates */
    private parsePsOutput;
    /** Get TCP listening ports for a specific PID */
    private getListeningPorts;
    /** Fetch GetUserStatus from the local language server */
    fetchLocalQuota(serverInfo: ServerInfo): Promise<any>;
    /** Quick probe to validate a server candidate */
    private probe;
}
