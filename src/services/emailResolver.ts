/**
 * EmailResolver — resolves the active IDE account email.
 * Extracted from QuotaManager to follow Single Responsibility Principle.
 *
 * Strategy (Antigravity ≥ 2.27.0 + Legacy):
 *   1. Local Window Hub / LS `GetUserStatus` (per-window source of truth in ≥ 2.27)
 *   2. USS API `UserStatus.getUserStatus()` (in-memory fallback)
 *   3. `state.vscdb` `antigravityAuthStatus` (disk fallback)
 */

import { extractField, extractStringField } from '../shared/protobuf';
import { createLogger } from '../utils/logger';
import { getUSS } from '../utils/uss';
import { dbGet } from '../shared/db';
import { findLSEndpoints, loadLSCert, callLSEndpoint } from '../utils/lsClient';
import { LS_SERVICE_PATH } from '../constants';

const log = createLogger('EmailResolver');

export class EmailResolver {
    /** Read active IDE email from the active window's Hub/LS, USS API, or antigravityAuthStatus */
    async getActiveEmail(): Promise<string> {
        // 1. Authoritative source: active window's Hub / Language Server GetUserStatus
        try {
            const endpoints = await findLSEndpoints();
            if (endpoints.length > 0) {
                const ca = loadLSCert();
                const body = await callLSEndpoint(endpoints[0], `${LS_SERVICE_PATH}/GetUserStatus`, ca);
                const userStatus = body ? extractField(body, 1) : null;
                const lsEmail = userStatus ? extractStringField(userStatus, 7) : '';
                if (lsEmail) return lsEmail;
            }
        } catch (e: any) {
            log.diag(`LS/Hub email read skipped: ${e?.message}`);
        }

        // 2. Fallback: USS API (in-memory)
        try {
            const uss = getUSS();
            if (uss?.UserStatus?.getUserStatus) {
                const statusBinary = await uss.UserStatus.getUserStatus();
                if (statusBinary) {
                    const bytes = typeof statusBinary === 'string'
                        ? Buffer.from(statusBinary, 'base64')
                        : Buffer.from(statusBinary);
                    const email = extractStringField(bytes, 7);
                    if (email) return email;
                }
            }
        } catch (e: any) {
            log.warn('USS email read failed:', e?.message);
        }

        // 3. Fallback: read from antigravityAuthStatus in state.vscdb
        try {
            const result = await dbGet('antigravityAuthStatus');
            if (result) {
                try {
                    const parsed = JSON.parse(result);
                    return parsed.email || '';
                } catch { /* expected: protobuf extraction may fail for unknown format */
                    log.warn('Invalid JSON in antigravityAuthStatus');
                }
            }
        } catch (e: any) {
            log.warn('DB email read failed:', e?.message);
        }

        return '';
    }
}
