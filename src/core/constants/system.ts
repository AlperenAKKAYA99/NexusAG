import * as vscode from 'vscode';

// ─── Timeouts ───

/** Language Server endpoint request timeout */
export const LS_REQUEST_TIMEOUT_MS = 10_000;
/** Default timeout for LS JSON/proto calls */
export const DEFAULT_LS_TIMEOUT_MS = 8_000;
/** Timeout for process listing (ps/lsof) exec calls */
export const PROCESS_EXEC_TIMEOUT_MS = 8_000;
/** Timeout for Windows WMIC exec calls */
export const WMIC_EXEC_TIMEOUT_MS = 5_000;
/** Timeout for lsof port discovery */
export const LSOF_EXEC_TIMEOUT_MS = 5_000;
/** Timeout for cascade probe during server discovery */
export const CASCADE_PROBE_TIMEOUT_MS = 3_000;

// ─── Thresholds ───

/** Bytes to read from file header for binary detection */
export const FILE_HEADER_READ_BYTES = 256;

/** gRPC service path for all Language Server endpoints — SSOT */
export const LS_SERVICE_PATH = '/exa.language_server_pb.LanguageServerService';

/** Unified CSRF token extraction regex — SSOT for process discovery */
export const CSRF_TOKEN_RE = /--csrf_token[\s=]+([\w-]+)/;

/**
 * Configuration-gated diagnostic file logging.
 * When false (default), diag() functions are no-ops → zero disk I/O overhead.
 * Enable via: Settings → ag-switchboard.diagnosticMode → true
 *
 * Cached per-check to avoid repeated configuration reads.
 */
const DIAG_CACHE_TTL_MS = 5_000;
let _diagCached: boolean | null = null;
let _diagCacheTs = 0;
export function isDiagEnabled(): boolean {
    const now = Date.now();
    if (_diagCached !== null && now - _diagCacheTs < DIAG_CACHE_TTL_MS) return _diagCached;
    try {
        _diagCached = vscode.workspace.getConfiguration('ag-switchboard')
            .get<boolean>('diagnosticMode', false);
    } catch { /* expected: env parse failure — use fallback */
        _diagCached = false;
    }
    _diagCacheTs = now;
    return _diagCached!;
}
