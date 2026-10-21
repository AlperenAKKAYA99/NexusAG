import type { IncomingMessage } from 'http';
/**
 * Accumulates an HTTP response body as a UTF-8 string.
 * Returns { status, body } so the caller can decide how to handle non-2xx codes.
 * Never throws on its own — rejects only on socket errors.
 */
export declare function collectBody(res: IncomingMessage): Promise<{
    status: number;
    body: string;
}>;
/**
 * Accumulates an HTTP response body as a raw Buffer.
 * Returns { status, body } so the caller can decide how to handle non-2xx codes.
 * Never throws on its own — rejects only on socket errors.
 */
export declare function collectBuffer(res: IncomingMessage): Promise<{
    status: number;
    body: Buffer;
}>;
