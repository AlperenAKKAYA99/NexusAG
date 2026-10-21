/** Language Server endpoint request timeout */
export declare const LS_REQUEST_TIMEOUT_MS = 10000;
/** Default timeout for LS JSON/proto calls */
export declare const DEFAULT_LS_TIMEOUT_MS = 8000;
/** Timeout for process listing (ps/lsof) exec calls */
export declare const PROCESS_EXEC_TIMEOUT_MS = 8000;
/** Timeout for Windows WMIC exec calls */
export declare const WMIC_EXEC_TIMEOUT_MS = 5000;
/** Timeout for lsof port discovery */
export declare const LSOF_EXEC_TIMEOUT_MS = 5000;
/** Timeout for cascade probe during server discovery */
export declare const CASCADE_PROBE_TIMEOUT_MS = 3000;
/** Bytes to read from file header for binary detection */
export declare const FILE_HEADER_READ_BYTES = 256;
/** gRPC service path for all Language Server endpoints — SSOT */
export declare const LS_SERVICE_PATH = "/exa.language_server_pb.LanguageServerService";
/** Unified CSRF token extraction regex — SSOT for process discovery */
export declare const CSRF_TOKEN_RE: RegExp;
export declare function isDiagEnabled(): boolean;
