/**
 * USS (UnifiedStateSync) API accessor — SSOT.
 *
 * Previously duplicated with 3 different patterns:
 * - accountSwitch.ts: typed getUSS() helper
 * - emailResolver.ts: inline (vscode as any).antigravityUnifiedStateSync
 * - extension.ts: inline (vscode as any).antigravityUnifiedStateSync
 *
 * Now all callers import from here.
 */
import { USSApi } from '../types';
/** Typed accessor for the IDE's antigravityUnifiedStateSync API */
export declare function getUSS(): USSApi | null;
