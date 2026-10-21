/**
 * RpcDirectClient — Direct HTTPS RPC to Antigravity's language server.
 * Bypasses USS binary via Connect-protocol JSON RPC calls.
 * Falls back gracefully if HTTPS port unavailable or RPC fails.
 *
 * Patterns adopted from ddarkr/antigravity-token-monitor:
 * - Heartbeat validation before first use
 * - GetCascadeTrajectory → GetCascadeTrajectorySteps dual-endpoint fallback
 */
import { ServerInfo } from '../types';
export declare class RpcDirectClient {
    private readonly serverInfo;
    private validated;
    constructor(serverInfo: ServerInfo);
    isAvailable(): boolean;
    /** Validate connection with a Heartbeat RPC before first real use. */
    heartbeat(): Promise<boolean>;
    /** Get metadata for a cascade. Returns raw items or null on failure. */
    getMetadata(cascadeId: string): Promise<any[] | null>;
    /**
     * Get steps for a cascade — paginated fetch with dual endpoint fallback:
     * 1. GetCascadeTrajectorySteps (flat .steps — paginated)
     * 2. GetCascadeTrajectory (nested .trajectory.steps — single page fallback)
     */
    getSteps(cascadeId: string): Promise<any[] | null>;
    /** RPC call with built-in error handling — returns null on any failure. */
    private rpc;
    private httpsPost;
}
