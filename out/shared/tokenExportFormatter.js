"use strict";
/**
 * Token export and import formatting utilities.
 * Handles serialization to Plain, Labeled, and JSON formats,
 * as well as smart parsing and extraction for round-trip token import.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTokens = formatTokens;
exports.extractTokens = extractTokens;
/**
 * Format token entries into plain text, labeled comments, or JSON.
 */
function formatTokens(entries, format = 'plain') {
    const valid = entries.filter(e => e && typeof e.token === 'string' && e.token.trim().length > 0);
    if (valid.length === 0)
        return '';
    switch (format) {
        case 'plain':
            return valid.map(e => e.token.trim()).join('\n');
        case 'labeled':
            return valid.map(e => {
                const label = e.email
                    ? (e.name && e.name !== e.email ? `# ${e.name} <${e.email}>` : `# ${e.email}`)
                    : '# (Account)';
                return `${label}\n${e.token.trim()}`;
            }).join('\n\n');
        case 'json':
            return JSON.stringify(valid.map(e => ({
                email: e.email || '',
                ...(e.name && e.name !== e.email ? { name: e.name } : {}),
                refresh_token: e.token.trim(),
            })), null, 2);
        default:
            return valid.map(e => e.token.trim()).join('\n');
    }
}
/**
 * Extract tokens from multi-line text, comments, labeled formats, or JSON.
 * Guarantees round-trip compatibility with formatTokens output.
 */
function extractTokens(text) {
    if (!text || typeof text !== 'string')
        return [];
    const trimmed = text.trim();
    if (!trimmed)
        return [];
    // 1. Try parsing as JSON
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
        try {
            const parsed = JSON.parse(trimmed);
            const extracted = [];
            const inspectItem = (item) => {
                if (!item)
                    return;
                if (typeof item === 'string' && item.trim().length > 0) {
                    extracted.push(item.trim());
                }
                else if (typeof item === 'object') {
                    const tok = item.refresh_token || item.refreshToken || item.token;
                    if (typeof tok === 'string' && tok.trim().length > 0) {
                        extracted.push(tok.trim());
                    }
                }
            };
            if (Array.isArray(parsed)) {
                for (const item of parsed)
                    inspectItem(item);
            }
            else if (typeof parsed === 'object') {
                if (Array.isArray(parsed.tokens)) {
                    for (const item of parsed.tokens)
                        inspectItem(item);
                }
                else if (Array.isArray(parsed.accounts)) {
                    for (const item of parsed.accounts)
                        inspectItem(item);
                }
                else {
                    inspectItem(parsed);
                }
            }
            const dedupedJson = [...new Set(extracted)];
            if (dedupedJson.length > 0)
                return dedupedJson;
        }
        catch {
            // Not valid JSON — fall through to text extraction
        }
    }
    // 2. Strip comment lines (# or //) from text
    const linesWithoutComments = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => !line.startsWith('#') && !line.startsWith('//'))
        .join('\n');
    // 3. Fast match for Google OAuth refresh token signature (1//...)
    const googleTokens = linesWithoutComments.match(/1\/\/[0-9A-Za-z_\-]{20,}/g);
    if (googleTokens && googleTokens.length > 0) {
        return [...new Set(googleTokens.map(t => t.trim()))];
    }
    // 4. If the input looked like a JSON structure but failed to parse and had no 1// tokens, avoid syntax fragments
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        return [];
    }
    // 5. Fallback delimiter-based extraction on cleaned lines
    const rawTokens = linesWithoutComments
        .split(/[\r\n\s,;]+/)
        .map(t => t.trim())
        .filter(t => t.length >= 8 && !t.startsWith('#') && !t.startsWith('//') && !/[{}<>]/.test(t));
    return [...new Set(rawTokens)];
}
//# sourceMappingURL=tokenExportFormatter.js.map