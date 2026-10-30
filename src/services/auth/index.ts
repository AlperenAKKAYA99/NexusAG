/**
 * Auth backend factory and barrel exports.
 */

import * as vscode from 'vscode';
import { isAgyHubActive } from '../../utils/lsClient';
import { AuthBackend } from './authBackend';
import { AgyHubBackend } from './agyHubBackend';
import { LegacyUssBackend } from './legacyUssBackend';

export * from './authBackend';
export { AgyHubBackend } from './agyHubBackend';
export { LegacyUssBackend } from './legacyUssBackend';

/**
 * Resolve the active AuthBackend strategy for the running Antigravity IDE version.
 * Returns `AgyHubBackend` on Antigravity ≥ 2.27 (`agy --hub`), or `LegacyUssBackend`
 * on pre-2.27 (`language_server_*`).
 */
export async function resolveAuthBackend(context?: vscode.ExtensionContext): Promise<AuthBackend> {
    if (await isAgyHubActive()) {
        return new AgyHubBackend(context);
    }
    return new LegacyUssBackend(context);
}

