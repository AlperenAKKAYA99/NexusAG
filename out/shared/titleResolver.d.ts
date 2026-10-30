/**
 * Title Resolver — SSOT for extracting conversation titles from local files.
 * ═══════════════════════════════════════════════════════════════════════════
 * ZERO vscode dependency — safe for both extension host AND
 * detached worker processes (ELECTRON_RUN_AS_NODE=1).
 *
 * Consumers:
 * - conversationGuard.ts (extension host — UI display)
 * - conversationFix.ts (detached worker — index rebuild)
 */
/** Returns true if the title is auto-generated/useless (e.g., "New Conversation", "Untitled") */
export declare function isGenericTitle(title: string | null): boolean;
/**
 * Extract a meaningful title from brain markdown files (implementation_plan.md, walkthrough.md, etc.)
 * Returns the first non-trivial line of text, or null if nothing useful found.
 */
export declare function getTitleFromBrain(cid: string, maxLen?: number): string | null;
/**
 * Extract the first user prompt from overview.txt or transcript.jsonl (conversation transcript log).
 * Reads only the first 8KB for performance — most user requests appear in the header.
 */
export declare function getTitleFromTranscript(cid: string, maxLen?: number): string | null;
type GlobalIndexResult = {
    titleMap: Map<string, string>;
    stepCounts: Map<string, number>;
    allIds: Set<string>;
};
/**
 * Extract conversation IDs, Titles, and Step Counts from the global trajectory summaries.
 * Uses shared db.ts for cross-platform SQLite access (native module + CLI fallback).
 */
export declare function getGlobalIndexData(): Promise<GlobalIndexResult>;
export {};
