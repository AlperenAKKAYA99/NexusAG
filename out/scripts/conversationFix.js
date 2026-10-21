"use strict";
/**
 * Conversation Guard — Detached Worker
 * =====================================
 * Runs as a standalone Node.js process (via ELECTRON_RUN_AS_NODE=1)
 * after AntiGravity exits. Rebuilds the sidebar conversation index
 * from .pb files on disk using shared/db.ts (native module + CLI fallback).
 *
 * Usage: spawned by conversationGuard.ts with parentPid as argv[2]
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const cp = __importStar(require("child_process"));
const os = __importStar(require("os"));
const agPaths_1 = require("../shared/agPaths");
const protobuf_1 = require("../shared/protobuf");
const titleResolver_1 = require("../shared/titleResolver");
const db_1 = require("../shared/db");
const workerLogger_1 = require("../shared/workerLogger");
// ─── Worker-local state ──────────────────────────────────────────────
const LOG_PATH = path.join(os.tmpdir(), 'ag-conversation-fix.log');
const log = (0, workerLogger_1.createWorkerLogger)(LOG_PATH, 'ConvFix');
let _hasRelaunched = false;
// ─── Title Helpers (isGenericTitle, getTitleFromBrain, getTitleFromTranscript
// are imported from shared/titleResolver.ts — SSOT) ──────────────────
function extractTitleFromInnerBlob(innerBlob) {
    if (!innerBlob)
        return null;
    let fallbackText = null;
    try {
        let pos = 0;
        while (pos < innerBlob.length) {
            const { value: tag, pos: next } = (0, protobuf_1.decodeVarint)(innerBlob, pos);
            const wireType = tag & 7;
            const fieldNum = Math.floor(tag / 8);
            if (wireType === 2) {
                const { value: len, pos: dataStart } = (0, protobuf_1.decodeVarint)(innerBlob, next);
                const content = innerBlob.slice(dataStart, dataStart + len);
                pos = dataStart + len;
                try {
                    const textExtract = content.toString('utf8').trim();
                    if (textExtract && !textExtract.includes('{"workspace') && !textExtract.includes('"context"')) {
                        if (fieldNum === 1 && textExtract.length > 3) {
                            return (0, titleResolver_1.isGenericTitle)(textExtract) ? null : textExtract;
                        }
                        if (textExtract.length > 5 && textExtract.length < 150 && !(0, titleResolver_1.isGenericTitle)(textExtract)) {
                            const letterCount = (textExtract.match(/[a-zA-Z\s0-9]/g) || []).length;
                            if (letterCount / textExtract.length > 0.8)
                                fallbackText = textExtract;
                        }
                    }
                }
                catch { /* ignore */ }
            }
            else if (wireType === 0) {
                pos = (0, protobuf_1.decodeVarint)(innerBlob, next).pos;
            }
            else {
                pos = (0, protobuf_1.skipProtobufField)(innerBlob, next, wireType);
            }
        }
    }
    catch { /* ignore */ }
    return fallbackText;
}
function extractExistingMetadata(rawB64) {
    const titles = {};
    const innerBlobs = {};
    if (!rawB64)
        return { titles, innerBlobs };
    try {
        const decoded = Buffer.from(rawB64, 'base64');
        let pos = 0;
        while (pos < decoded.length) {
            try {
                const { value: tag, pos: tagEnd } = (0, protobuf_1.decodeVarint)(decoded, pos);
                if ((tag & 7) !== 2)
                    break;
                const { value: entryLen, pos: entryStart } = (0, protobuf_1.decodeVarint)(decoded, tagEnd);
                const entry = decoded.slice(entryStart, entryStart + entryLen);
                pos = entryStart + entryLen;
                let ep = 0;
                let uid = null;
                let infoB64 = null;
                while (ep < entry.length) {
                    const { value: t, pos: tnext } = (0, protobuf_1.decodeVarint)(entry, ep);
                    const fn = Math.floor(t / 8);
                    const wt = t & 7;
                    if (wt === 2) {
                        const { value: l, pos: ds } = (0, protobuf_1.decodeVarint)(entry, tnext);
                        const content = entry.slice(ds, ds + l);
                        ep = ds + l;
                        if (fn === 1)
                            uid = content.toString('utf8');
                        else if (fn === 2) {
                            let sp = 0;
                            while (sp < content.length) {
                                try {
                                    const { value: subt, pos: stnext } = (0, protobuf_1.decodeVarint)(content, sp);
                                    const swt = subt & 7;
                                    const sfn = Math.floor(subt / 8);
                                    if (swt === 2) {
                                        const { value: slen, pos: sds } = (0, protobuf_1.decodeVarint)(content, stnext);
                                        if (sfn === 1) {
                                            infoB64 = content.slice(sds, sds + slen).toString('utf8');
                                            break;
                                        }
                                        else {
                                            sp = sds + slen;
                                        }
                                    }
                                    else if (swt === 0) {
                                        sp = (0, protobuf_1.decodeVarint)(content, stnext).pos;
                                    }
                                    else {
                                        sp = (0, protobuf_1.skipProtobufField)(content, stnext, swt);
                                    }
                                }
                                catch {
                                    break;
                                }
                            }
                        }
                    }
                    else if (wt === 0) {
                        ep = (0, protobuf_1.decodeVarint)(entry, tnext).pos;
                    }
                    else {
                        ep = (0, protobuf_1.skipProtobufField)(entry, tnext, wt);
                    }
                }
                if (uid && infoB64) {
                    try {
                        const rawInner = Buffer.from(infoB64, 'base64');
                        innerBlobs[uid] = rawInner;
                        const title = extractTitleFromInnerBlob(rawInner);
                        if (title && !title.startsWith('_headers:') && !title.includes('{"workspace') && !title.includes('[{"type"')) {
                            titles[uid] = title;
                        }
                    }
                    catch { /* ignore */ }
                }
            }
            catch {
                break;
            }
        }
    }
    catch { /* ignore */ }
    return { titles, innerBlobs };
}
// ─── Title Resolution ────────────────────────────────────────────────
// getTitleFromBrain + getTitleFromTranscript → imported from shared/titleResolver.ts
function resolveTitle(cid, existingTitles) {
    if (existingTitles[cid] && !(0, titleResolver_1.isGenericTitle)(existingTitles[cid])) {
        return { title: existingTitles[cid], source: 'preserved' };
    }
    const brain = (0, titleResolver_1.getTitleFromBrain)(cid);
    if (brain && !(0, titleResolver_1.isGenericTitle)(brain))
        return { title: brain, source: 'brain' };
    const transcript = (0, titleResolver_1.getTitleFromTranscript)(cid);
    if (transcript && !(0, titleResolver_1.isGenericTitle)(transcript))
        return { title: transcript, source: 'transcript' };
    const pbPath = path.join(agPaths_1.CONVERSATIONS_DIR, `${cid}.pb`);
    let dateStr = '';
    if (fs.existsSync(pbPath)) {
        dateStr = ` (${fs.statSync(pbPath).mtime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
    }
    return { title: `Chat${dateStr} ${cid.substring(0, 6)}`, source: 'fallback' };
}
// ─── Entry Builder ───────────────────────────────────────────────────
function buildTrajectoryEntry(cid, title, existingInnerData, pbMtime) {
    let innerInfo;
    if (existingInnerData) {
        const preserved = (0, protobuf_1.stripFieldFromProtobuf)(existingInnerData, 1);
        innerInfo = Buffer.concat([(0, protobuf_1.encodeStringField)(1, title), preserved]);
        if (pbMtime && !(0, protobuf_1.hasTimestampFields)(existingInnerData)) {
            innerInfo = Buffer.concat([innerInfo, (0, protobuf_1.buildTimestampFields)(pbMtime)]);
        }
    }
    else {
        innerInfo = (0, protobuf_1.encodeStringField)(1, title);
        if (pbMtime) {
            innerInfo = Buffer.concat([innerInfo, (0, protobuf_1.buildTimestampFields)(pbMtime)]);
        }
    }
    const infoB64 = innerInfo.toString('base64');
    const subMessage = (0, protobuf_1.encodeStringField)(1, infoB64);
    let entry = (0, protobuf_1.encodeStringField)(1, cid);
    entry = Buffer.concat([entry, (0, protobuf_1.encodeLengthDelimited)(2, subMessage)]);
    return entry;
}
// ─── AG App Path ─────────────────────────────────────────────────────
function getAGAppPath() {
    if (agPaths_1.isMac)
        return 'open -a Antigravity';
    if (agPaths_1.isWindows) {
        const localApp = process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local');
        const candidates = [
            path.join(localApp, 'Programs', 'Antigravity IDE', 'Antigravity IDE.exe'),
            path.join(localApp, 'Programs', 'Antigravity', 'Antigravity.exe'),
            path.join(localApp, 'Antigravity IDE', 'Antigravity IDE.exe'),
            path.join(localApp, 'Antigravity', 'Antigravity.exe'),
            path.join(os.homedir(), '.antigravity', 'Antigravity.exe'),
        ];
        for (const c of candidates) {
            if (fs.existsSync(c))
                return `"${c}"`;
        }
        // Fallback: try `where` to find in PATH
        try {
            const found = cp.execSync('where "Antigravity IDE"', { encoding: 'utf8' }).trim().split('\n')[0];
            if (found && fs.existsSync(found.trim()))
                return `"${found.trim()}"`;
        }
        catch { /* not in PATH */ }
        try {
            const found = cp.execSync('where Antigravity', { encoding: 'utf8' }).trim().split('\n')[0];
            if (found && fs.existsSync(found.trim()))
                return `"${found.trim()}"`;
        }
        catch { /* not in PATH */ }
        // Last resort: assume default path
        return `"${candidates[0]}"`;
    }
    // Linux: try known path first, fall back to PATH
    const linuxPath = path.join(os.homedir(), '.antigravity', 'antigravity', 'bin', 'antigravity');
    if (fs.existsSync(linuxPath))
        return `"${linuxPath}"`;
    return 'antigravity';
}
// ─── Main ────────────────────────────────────────────────────────────
async function main() {
    const parentPid = parseInt(process.argv[2], 10);
    let relaunchInfo = { workspaceFolders: [] };
    try {
        relaunchInfo = JSON.parse(process.argv[3] || '{}');
    }
    catch { /* ignore */ }
    const mainPid = relaunchInfo.mainPid || parentPid;
    log.info(`Started. ExtHost PID: ${parentPid}, Main PID: ${mainPid}`);
    log.info(`DB: ${agPaths_1.STATE_DB_PATH}`);
    // 1. Wait for Extension Host to exit (max 30s safety limit)
    log.info('Waiting for Extension Host to exit...');
    let extWait = 60;
    while (extWait-- > 0) {
        try {
            process.kill(parentPid, 0);
            await new Promise(r => setTimeout(r, 500));
        }
        catch {
            break;
        }
    }
    if (extWait <= 0)
        log.warn('Extension Host wait timed out, proceeding...');
    else
        log.info('Extension Host exited.');
    // 1b. Wait for main AG process to exit too
    if (mainPid && mainPid !== parentPid) {
        log.info(`Waiting for main AG process (${mainPid})...`);
        let waitCycles = 30;
        while (waitCycles-- > 0) {
            try {
                process.kill(mainPid, 0);
                await new Promise(r => setTimeout(r, 500));
            }
            catch {
                break;
            }
        }
        log.info('Main AG process exited.');
    }
    // 2. Wait for WAL checkpoint
    const walPath = agPaths_1.STATE_DB_PATH + '-wal';
    let retries = 20;
    while (fs.existsSync(walPath) && retries-- > 0) {
        log.info(`WAL file exists, waiting... (${retries} retries left)`);
        await new Promise(r => setTimeout(r, 1000));
    }
    if (fs.existsSync(walPath)) {
        log.warn('WAL still exists, attempting anyway...');
    }
    // 3. Validate paths
    if (!fs.existsSync(agPaths_1.STATE_DB_PATH)) {
        log.error('DB not found');
        relaunchAG(relaunchInfo);
        return;
    }
    if (!fs.existsSync(agPaths_1.CONVERSATIONS_DIR)) {
        log.error('Conv dir not found');
        relaunchAG(relaunchInfo);
        return;
    }
    // 4. Read existing index via shared/db.ts
    log.info('Reading existing index...');
    let rawB64 = '';
    try {
        rawB64 = await (0, db_1.dbGet)('antigravityUnifiedStateSync.trajectorySummaries') || '';
    }
    catch { /* will rebuild from scratch */ }
    if (!rawB64) {
        log.warn('No existing index found, building from scratch.');
    }
    // 5. Discover conversations
    const pbFiles = fs.readdirSync(agPaths_1.CONVERSATIONS_DIR).filter(f => f.endsWith('.pb'));
    if (!pbFiles.length) {
        log.warn('No .pb files found.');
        relaunchAG(relaunchInfo);
        return;
    }
    pbFiles.sort((a, b) => {
        const ma = fs.statSync(path.join(agPaths_1.CONVERSATIONS_DIR, a)).mtimeMs;
        const mb = fs.statSync(path.join(agPaths_1.CONVERSATIONS_DIR, b)).mtimeMs;
        return mb - ma;
    });
    const conversationIds = pbFiles.map(f => f.replace('.pb', ''));
    log.info(`Found ${conversationIds.length} conversations on disk.`);
    // 6. Extract existing metadata
    const { titles: existingTitles, innerBlobs } = extractExistingMetadata(rawB64);
    log.info(`Preserved ${Object.keys(existingTitles).length} existing titles.`);
    const resolved = [];
    const stats = { preserved: 0, brain: 0, transcript: 0, fallback: 0 };
    for (const cid of conversationIds) {
        const innerData = innerBlobs[cid] || null;
        const { title, source } = resolveTitle(cid, existingTitles);
        resolved.push({ cid, title, source, innerData });
        stats[source] = (stats[source] || 0) + 1;
    }
    log.info(`Titles — Preserved: ${stats.preserved}, Brain: ${stats.brain}, Transcript: ${stats.transcript}, Fallback: ${stats.fallback}`);
    // 8. Build new index
    let resultBytes = Buffer.alloc(0);
    for (const { cid, title, innerData } of resolved) {
        const pbPath = path.join(agPaths_1.CONVERSATIONS_DIR, `${cid}.pb`);
        const pbMtime = fs.existsSync(pbPath) ? fs.statSync(pbPath).mtimeMs / 1000 : null;
        const entry = buildTrajectoryEntry(cid, title, innerData, pbMtime);
        resultBytes = Buffer.concat([resultBytes, (0, protobuf_1.encodeLengthDelimited)(1, entry)]);
    }
    // 9. Backup old value
    if (rawB64) {
        try {
            const backupPath = path.join(path.dirname(agPaths_1.STATE_DB_PATH), 'trajectorySummaries_backup.txt');
            fs.writeFileSync(backupPath, rawB64, 'utf8');
            log.info('Backup saved.');
        }
        catch (e) {
            log.warn(`Backup warning: ${e.message}`);
        }
    }
    // 10. Write new index via shared/db.ts
    const encoded = resultBytes.toString('base64');
    const escapedVal = encoded.replace(/'/g, "''");
    try {
        const ok = await (0, db_1.dbExecRaw)(`UPDATE ItemTable SET value='${escapedVal}' WHERE key='antigravityUnifiedStateSync.trajectorySummaries';`);
        if (!ok)
            throw new Error('dbExecRaw returned false');
        log.info(`SUCCESS: Rebuilt index with ${resolved.length} conversations.`);
    }
    catch (e) {
        log.error(`Writing index failed: ${e.message}`);
        relaunchAG(relaunchInfo);
        return;
    }
    // 10b. If authStatus is provided (account switch transition), persist it to ItemTable
    if (relaunchInfo.authStatus) {
        try {
            const authJson = JSON.stringify(relaunchInfo.authStatus);
            const hexAuth = Buffer.from(authJson, 'utf-8').toString('hex');
            await (0, db_1.dbExecRaw)(`INSERT OR REPLACE INTO ItemTable (key, value) VALUES ('antigravityAuthStatus', CAST(X'${hexAuth}' AS TEXT));`);
            log.info(`Account switch authStatus persisted for ${relaunchInfo.authStatus.email}`);
        }
        catch (e) {
            log.warn(`Auth persistence warning: ${e.message}`);
        }
    }
    // 11. Relaunch AG
    relaunchAG(relaunchInfo);
}
/** Clean Electron/VSCode env vars that prevent proper relaunch */
function cleanElectronEnv() {
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    for (const key of Object.keys(env)) {
        if (key.startsWith('VSCODE_') || key.startsWith('ELECTRON_') || key.startsWith('APPLICATION_INSIGHTS_')) {
            delete env[key];
        }
    }
    return env;
}
function relaunchAG(info) {
    if (_hasRelaunched) {
        log.warn('Already relaunched — guard triggered.');
        return;
    }
    _hasRelaunched = true;
    log.info('Initiating restart...');
    const folders = info.workspaceFolders || [];
    const appCmd = getAGAppPath();
    const cleanEnv = cleanElectronEnv();
    if (agPaths_1.isMac) {
        const args = folders.length > 0 ? ` --args ${folders.map(f => `"${f}"`).join(' ')}` : '';
        const cmd = `${appCmd}${args}`;
        log.info(`Relaunching: ${cmd}`);
        try {
            cp.exec(cmd, { env: cleanEnv });
            log.info('Relaunch initiated.');
        }
        catch (e) {
            log.error(`Relaunch error: ${e.message}`);
        }
    }
    else {
        const args = folders.length > 0 ? folders : [];
        log.info(`Relaunching: ${appCmd} ${args.join(' ')}`);
        try {
            const child = cp.spawn(appCmd, args, { detached: true, stdio: 'ignore', env: cleanEnv, shell: true });
            child.unref();
            log.info('Relaunch spawned.');
        }
        catch (e) {
            log.error(`Relaunch error: ${e.message}`);
        }
    }
    setTimeout(() => process.exit(0), 3000);
}
main().catch(e => {
    log.error(`FATAL: ${e.message}\n${e.stack}`);
    process.exit(1);
});
//# sourceMappingURL=conversationFix.js.map