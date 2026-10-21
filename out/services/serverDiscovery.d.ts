import { ServerInfo } from '../types';
export declare class ServerDiscoveryService {
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
    discover(workspaceId?: string): Promise<ServerInfo | null>;
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
    discoverCascadeServer(cascadeId: string, workspaceServer?: ServerInfo | null): Promise<ServerInfo | null>;
    /** macOS / Linux: use ps to find candidates */
    private findCandidatesUnix;
    /** Windows: use PowerShell + wmic fallback to find candidates (with PID) */
    private findCandidatesWindows;
    /** Parse `ps` stdout into candidates */
    private parsePsOutput;
    /** Get TCP listening ports for a specific PID */
    private getListeningPorts;
    /** Fetch GetUserStatus from the local language server */
    fetchLocalQuota(serverInfo: ServerInfo): Promise<any>;
    /** Quick probe to validate a server candidate */
    private probe;
}
