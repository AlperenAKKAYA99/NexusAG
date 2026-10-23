/**
 * Token export and import formatting utilities.
 * Handles serialization to Plain, Labeled, and JSON formats,
 * as well as smart parsing and extraction for round-trip token import.
 */
export type TokenExportFormat = 'plain' | 'labeled' | 'json';
export interface TokenExportEntry {
    email?: string;
    token: string;
    name?: string;
}
/**
 * Format token entries into plain text, labeled comments, or JSON.
 */
export declare function formatTokens(entries: TokenExportEntry[], format?: TokenExportFormat): string;
/**
 * Extract tokens from multi-line text, comments, labeled formats, or JSON.
 * Guarantees round-trip compatibility with formatTokens output.
 */
export declare function extractTokens(text: string): string[];
