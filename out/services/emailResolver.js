"use strict";
/**
 * EmailResolver — resolves the active IDE account email.
 * Extracted from QuotaManager to follow Single Responsibility Principle.
 *
 * Strategy: USS API (in-memory) → state.vscdb fallback → empty string.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailResolver = void 0;
const protobuf_1 = require("../shared/protobuf");
const logger_1 = require("../utils/logger");
const uss_1 = require("../utils/uss");
const db_1 = require("../shared/db");
const log = (0, logger_1.createLogger)('EmailResolver');
class EmailResolver {
    /** Read active IDE email from USS API or antigravityAuthStatus */
    async getActiveEmail() {
        try {
            // Try USS API first (in-memory, most accurate)
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
        try {
            // Fallback: read from antigravityAuthStatus in state.vscdb
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