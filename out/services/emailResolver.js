"use strict";
/**
 * EmailResolver — resolves the active IDE account email.
 * Extracted from QuotaManager to follow Single Responsibility Principle.
 *
 * Strategy (Antigravity ≥ 2.27.0 + Legacy):
 *   1. Local Window Hub / LS `GetUserStatus` (per-window source of truth in ≥ 2.27)
 *   2. USS API `UserStatus.getUserStatus()` (in-memory fallback)
 *   3. `state.vscdb` `antigravityAuthStatus` (disk fallback)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailResolver = void 0;
const protobuf_1 = require("../shared/protobuf");
const logger_1 = require("../utils/logger");
const uss_1 = require("../utils/uss");
const db_1 = require("../shared/db");
const lsClient_1 = require("../utils/lsClient");
const constants_1 = require("../constants");
const log = (0, logger_1.createLogger)('EmailResolver');
class EmailResolver {
    /** Read active IDE email from the active window's Hub/LS, USS API, or antigravityAuthStatus */
    async getActiveEmail() {
        // 1. Authoritative source: active window's Hub / Language Server GetUserStatus
        try {
            const endpoints = await (0, lsClient_1.findLSEndpoints)();
            if (endpoints.length > 0) {
                const ca = (0, lsClient_1.loadLSCert)();
                const body = await (0, lsClient_1.callLSEndpoint)(endpoints[0], `${constants_1.LS_SERVICE_PATH}/GetUserStatus`, ca);
                const userStatus = body ? (0, protobuf_1.extractField)(body, 1) : null;
                const lsEmail = userStatus ? (0, protobuf_1.extractStringField)(userStatus, 7) : '';
                if (lsEmail)
                    return lsEmail;
            }
        }
        catch (e) {
            log.diag(`LS/Hub email read skipped: ${e?.message}`);
        }
        // 2. Fallback: USS API (in-memory)
        try {
            const uss = (0, uss_1.getUSS)();
            if (uss?.UserStatus?.getUserStatus) {
                const statusBinary = await uss.UserStatus.getUserStatus();
                if (statusBinary) {
                    const bytes = typeof statusBinary === 'string'
                        ? Buffer.from(statusBinary, 'base64')
                        : Buffer.from(statusBinary);
                    const email = (0, protobuf_1.extractStringField)(bytes, 7);
                    if (email)
                        return email;
                }
            }
        }
        catch (e) {
            log.warn('USS email read failed:', e?.message);
        }
        // 3. Fallback: read from antigravityAuthStatus in state.vscdb
        try {
            const result = await (0, db_1.dbGet)('antigravityAuthStatus');
            if (result) {
                try {
                    const parsed = JSON.parse(result);
                    return parsed.email || '';
                }
                catch { /* expected: protobuf extraction may fail for unknown format */
                    log.warn('Invalid JSON in antigravityAuthStatus');
                }
            }
        }
        catch (e) {
            log.warn('DB email read failed:', e?.message);
        }
        return '';
    }
}
exports.EmailResolver = EmailResolver;
//# sourceMappingURL=emailResolver.js.map