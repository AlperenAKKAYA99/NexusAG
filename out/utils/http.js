"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectBody = collectBody;
exports.collectBuffer = collectBuffer;
/**
 * Accumulates an HTTP response body as a UTF-8 string.
 * Returns { status, body } so the caller can decide how to handle non-2xx codes.
 * Never throws on its own — rejects only on socket errors.
 */
function collectBody(res) {
    return new Promise((resolve, reject) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
        res.on('error', reject);
    });
}
/**
 * Accumulates an HTTP response body as a raw Buffer.
 * Returns { status, body } so the caller can decide how to handle non-2xx codes.
 * Never throws on its own — rejects only on socket errors.
 */
function collectBuffer(res) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks) }));
        res.on('error', reject);
    });
}
//# sourceMappingURL=http.js.map