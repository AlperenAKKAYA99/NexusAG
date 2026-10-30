"use strict";
/**
 * Conversation Guard — Detection & Fix Orchestrator
 * Detects missing conversations by comparing .pb files on disk
 * with the sidebar index in state.vscdb, and spawns a detached
 * worker to rebuild the index when requested.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationGuard = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const cp = __importStar(require("child_process"));
const path = __importStar(require("path"));
const constants_1 = require("../constants");
const agPaths_1 = require("../shared/agPaths");
const titleResolver_1 = require("../shared/titleResolver");
const db_1 = require("../shared/db");
const logger_1 = require("../utils/logger");
const log = (0, logger_1.createLogger)('ConvGuard');
class ConversationGuard {
    context;
    _dismissedCount = -1;
    _lastStatus = null;
    _dbAvailable;
    _onStatusChange = new vscode.EventEmitter();
    onStatusChange = this._onStatusChange.event;
    constructor(context) {
        this.context = context;
        this._dismissedCount = context.globalState.get('ag_dismissedMissingCount', -1);
    }
    /** Run detection after a delay (non-blocking) */
    startDelayedDetection(delayMs = 15000) {
        setTimeout(() => this.detect(), delayMs);
    }
    /** Get the last detection result */
    getLastStatus() {
        return this._lastStatus;
    }
    /**
     * Detect missing conversations via ID-level set diff.
     * A simple count comparison (100 disk == 100 index) can hide
     * mismatches where ghost entries mask missing ones.
     */
    async detect() {
        try {
            if ((0, agPaths_1.isAgyHubStorage)(agPaths_1.CONVERSATIONS_DIR)) {
                log.info('Detection skipped: Antigravity ≥ 2.27 Hub SQLite conversation storage active');
                return null;
            }
            if (!fs.existsSync(agPaths_1.CONVERSATIONS_DIR))
                return null;
            const pbFiles = fs.readdirSync(agPaths_1.CONVERSATIONS_DIR).filter(f => f.endsWith('.pb'));
            const onDisk = pbFiles.length;
            if (onDisk === 0)
                return null;
            if (!fs.existsSync(constants_1.STATE_DB_PATH))
                return null;
            // Verify DB backend is available (cache result)
            if (this._dbAvailable === undefined) {
                this._dbAvailable = (0, db_1.isDbAvailable)();
                if (!this._dbAvailable)
                    log.warn('No DB backend available — conversation detection disabled');
            }
            if (!this._dbAvailable)
                return null;
            const diskIds = new Set(pbFiles.map(f => f.replace('.pb', '')));
            const indexIds = await this._readIndexIds();
            // Missing = on disk but NOT in index (user can't see these)
            const missingIds = [];
            for (const id of diskIds) {
                if (!indexIds.has(id))
                    missingIds.push(id);
            }
            const status = { onDisk, inIndex: indexIds.size, missing: missingIds.length, missingIds };
            this._lastStatus = status;
            log.info(`Detection: ${onDisk} on disk, ${indexIds.size} indexed, ${missingIds.length} missing (set diff)`);
            if (missingIds.length > 0) {
                this._onStatusChange.fire(status);
            }
            return status;
        }
        catch (e) {
            log.error(`Detection error: ${e.message}`);
            return null;
        }
    }
    /** Extract conversation IDs from the trajectory summaries protobuf index.
     *  Delegates to titleResolver.getGlobalIndexData() — SSOT for protobuf parsing.
     *  Uses allIds (not titleMap) to include title-less indexed conversations. */
    async _readIndexIds() {
        try {
            const { allIds } = await (0, titleResolver_1.getGlobalIndexData)();
            return allIds;
        }
        catch {
            return new Set();
        }
    }
    /** Dismiss the current missing count (don't nag again for the same number) */
    dismiss() {
        if (this._lastStatus) {
            this._dismissedCount = this._lastStatus.missing;
            this.context.globalState.update('ag_dismissedMissingCount', this._dismissedCount);
        }
    }
    /** Check if the current missing count was already dismissed */
    isDismissed() {
        return this._lastStatus !== null && this._lastStatus.missing === this._dismissedCount;
    }
    /** Resolve titles & dates for missing conversations (for UI display).
     *  lsTitles: optional map from GetAllCascadeTrajectories LS endpoint (highest fidelity) */
    resolveMissingDetails(ids, lsTitles) {
        return ids.map(id => {
            // Date from .pb file mtime
            const pbPath = path.join(agPaths_1.CONVERSATIONS_DIR, `${id}.pb`);
            let date = '?';
            try {
                if (fs.existsSync(pbPath)) {
                    const mtime = fs.statSync(pbPath).mtime;
                    date = mtime.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
                }
            }
            catch { /* ignore */ }
            // Priority 1: LS title (from GetAllCascadeTrajectories — highest fidelity)
            let title = '';
            const lsTitle = lsTitles?.get(id);
            if (lsTitle && !(0, titleResolver_1.isGenericTitle)(lsTitle) && lsTitle.length > 3) {
                title = lsTitle.length > 50 ? lsTitle.substring(0, 47) + '...' : lsTitle;
            }
            // Priority 2: Brain markdown files (shared SSOT)
            if (!title) {
                const brainTitle = (0, titleResolver_1.getTitleFromBrain)(id, 50);
                if (brainTitle)
                    title = brainTitle;
            }
            // Priority 3: Transcript (shared SSOT)
            if (!title) {
                const transcriptTitle = (0, titleResolver_1.getTitleFromTranscript)(id, 50);
                if (transcriptTitle)
                    title = transcriptTitle;
            }
            // Final fallback
            if (!title)
                title = `Chat ${id.substring(0, 8)}`;
            return { id, title, date };
        }).sort((a, b) => b.date.localeCompare(a.date));
    }
    /** Spawn detached worker to fix conversations — AG will quit (pre-2.27 .pb storage only) */
    runFix(extraRelaunchInfo) {
        if ((0, agPaths_1.isAgyHubStorage)(agPaths_1.CONVERSATIONS_DIR)) {
            log.info('runFix skipped: Antigravity ≥ 2.27 uses Hub SQLite storage (.db); index rebuild not applicable');
            return;
        }
        const workerPath = path.join(__dirname, '..', 'scripts', 'conversationFix.js');
        if (!fs.existsSync(workerPath)) {
            log.error(`Worker script not found: ${workerPath}`);
            vscode.window.showErrorMessage('Conversation fix script not found. Please reinstall the extension.');
            return;
        }
        const workspaceFolders = (vscode.workspace.workspaceFolders || []).map(f => f.uri.fsPath);
        const mainPid = process.env.VSCODE_PID ? parseInt(process.env.VSCODE_PID, 10) : process.ppid;
        const relaunchInfo = JSON.stringify({ workspaceFolders, mainPid, ...(extraRelaunchInfo || {}) });
        const child = cp.spawn(process.execPath, [workerPath, process.pid.toString(), relaunchInfo], {
            env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
            detached: true,
            stdio: 'ignore',
        });
        child.unref();
        log.info('Detached fixer spawned. Quitting AG...');
        // Clear dismiss state so it monitors normally after a fix
        this.context.globalState.update('ag_dismissedMissingCount', -1);
        vscode.commands.executeCommand('workbench.action.quit');
    }
    dispose() {
        this._onStatusChange.dispose();
    }
}
exports.ConversationGuard = ConversationGuard;
//# sourceMappingURL=conversationGuard.js.map