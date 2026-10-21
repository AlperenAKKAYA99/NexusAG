/**
 * Conversation Guard — Detached Worker
 * =====================================
 * Runs as a standalone Node.js process (via ELECTRON_RUN_AS_NODE=1)
 * after AntiGravity exits. Rebuilds the sidebar conversation index
 * from .pb files on disk using shared/db.ts (native module + CLI fallback).
 *
 * Usage: spawned by conversationGuard.ts with parentPid as argv[2]
 */
export {};
