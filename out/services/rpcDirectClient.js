"use strict";
/**
 * RpcDirectClient — Direct HTTPS RPC to Antigravity's language server.
 * Bypasses USS binary via Connect-protocol JSON RPC calls.
 * Falls back gracefully if HTTPS port unavailable or RPC fails.
 *
 * Patterns adopted from ddarkr/antigravity-token-monitor:
 * - Heartbeat validation before first use
 * - GetCascadeTrajectory → GetCascadeTrajectorySteps dual-endpoint fallback
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RpcDirectClient = void 0;
const lsClient_1 = require("../utils/lsClient");
const constants_1 = require("../constants");
const logger_1 = require("../utils/logger");
const log = (0, logger_1.createLogger)('RpcDirect');
class RpcDirectClient {
    serverInfo;
    validated = false;
    constructor(serverInfo) {
        this.serverInfo = serverInfo;
    }
    isAvailable() {
        return typeof this.serverInfo.httpsPort === 'number' && this.serverInfo.httpsPort > 0;
    }
    /** Validate connection with a Heartbeat RPC before first real use. */
    async heartbeat() {
        if (this.validated)
            return true;
        const resp = await this.rpc(`${constants_1.LS_SERVICE_PATH}/Heartbeat`, { uuid: '00000000-0000-0000-0000-000000000000' }, 2000);
        this.validated = resp !== null;
        return this.validated;
    }
    /** Get metadata for a cascade. Returns raw items or null on failure. */
    async getMetadata(cascadeId) {
        const PAGE_SIZE = 250;
        const MAX_PAGES = 20; // safety cap: 5000 entries max
        const allMeta = [];
        for (let page = 0; page < MAX_PAGES; page++) {
            // Use cumulative offset (allMeta.length) — NOT page*PAGE_SIZE.
            // The server returns items starting at the offset; fixed-step offsets
            // cause overlapping windows and duplicate entries.
            const resp = await this.rpc(`${constants_1.LS_SERVICE_PATH}/GetCascadeTrajectoryGeneratorMetadata`, {
                cascade_id: cascadeId, generator_metadata_offset: allMeta.length,
            });
            const items = resp ? (resp.generatorMetadata || resp.generator_metadata || []) : [];
            if (!Array.isArray(items) || items.length === 0)
                break;
            allMeta.push(...items);
            if (items.length < PAGE_SIZE)
                break;
        }
        return allMeta.length > 0 ? allMeta : null;
    }
    /**
     * Get steps for a cascade — paginated fetch with dual endpoint fallback:
     * 1. GetCascadeTrajectorySteps (flat .steps — paginated)
     * 2. GetCascadeTrajectory (nested .trajectory.steps — single page fallback)
     */
    async getSteps(cascadeId) {
        // Primary: paginated flat step list (consistent with how HTTP fallback works)
        const PAGE_SIZE = 5000; // Steps endpoint returns large pages (~6k), use generous size
        const MAX_PAGES = 10; // safety cap: 50k steps max
        const allSteps = [];
        for (let page = 0; page < MAX_PAGES; page++) {
            const resp = await this.rpc(`${constants_1.LS_SERVICE_PATH}/GetCascadeTrajectorySteps`, {
                cascade_id: cascadeId, step_offset: page === 0 ? 0 : allSteps.length,
            });
            const items = resp ? (resp.steps || []) : [];
            if (!Array.isArray(items) || items.length === 0)
                break;
            allSteps.push(...items);
            if (items.length < PAGE_SIZE)
                break;
        }
        if (allSteps.length > 0)
            return allSteps;
        // Fallback: GetCascadeTrajectory — returns nested trajectory with steps
        const full = await this.rpc(`${constants_1.LS_SERVICE_PATH}/GetCascadeTrajectory`, { cascadeId });
        if (full?.trajectory?.steps && Array.isArray(full.trajectory.steps)) {
            return full.trajectory.steps;
        }
        return null;
    }
    /** RPC call with built-in error handling — returns null on any failure. */
    async rpc(path, body, timeoutMs = constants_1.DEFAULT_LS_TIMEOUT_MS) {
        if (!this.isAvailable())
            return null;
        try {
            return await this.httpsPost(path, body, timeoutMs);
        }
        catch (e) {
            log.warn(`RPC ${path.split('/').pop()} failed:`, e?.message);
            return null;
        }
    }
    httpsPost(path, body, timeoutMs = constants_1.DEFAULT_LS_TIMEOUT_MS) {
        return (0, lsClient_1.callLsHttpsJson)(this.serverInfo.httpsPort, this.serverInfo.csrfToken, path, body, timeoutMs);
    }
}
exports.RpcDirectClient = RpcDirectClient;
//# sourceMappingURL=rpcDirectClient.js.map