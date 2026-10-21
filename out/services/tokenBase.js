"use strict";
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
exports.TokenBaseService = void 0;
const logger_1 = require("../utils/logger");
const lsClient_1 = require("../utils/lsClient");
const protobuf_1 = require("../shared/protobuf");
const constants_1 = require("../constants");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const log = (0, logger_1.createLogger)('TokenBase');
/** Matches both .agent/ and .agents/ directory paths */
const AGENT_DIR_RE = /\.agents?\//;
/** Captures .agent(s)/... relative path from a full URI */
const AGENT_PATH_CAPTURE = /(\.agents?\/.+)/;
const isAgentPath = (s) => AGENT_DIR_RE.test(s);
// Protobuf decoders → unified in shared/protobuf.ts (readFields, ProtoField)
// ==================== Response Parser ====================
function parseMcpTool(buf) {
    const fields = (0, protobuf_1.readFields)(buf);
    return {
        name: fields.find(f => f.field === 1)?.bytes?.toString('utf-8') || '?',
        tokens: fields.find(f => f.field === 3)?.varint || 0,
    };
}
function parseItem(buf) {
    const fields = (0, protobuf_1.readFields)(buf);
    const name = fields.find(f => f.field === 1)?.bytes?.toString('utf-8') || '?';
    const tokens = fields.find(f => f.field === 3)?.varint || 0;
    // MCP servers have sub-tools in field 2
    const tools = fields
        .filter(f => f.field === 2 && f.bytes)
        .map(f => parseMcpTool(f.bytes));
    return { name, tokens, tools: tools.length > 0 ? tools : undefined };
}
function parseCategory(buf) {
    const fields = (0, protobuf_1.readFields)(buf);
    const name = fields.find(f => f.field === 1)?.bytes?.toString('utf-8') || '?';
    const totalTokens = fields.find(f => f.field === 4)?.varint || 0;
    const items = fields
        .filter(f => f.field === 5 && f.bytes)
        .map(f => parseItem(f.bytes));
    return { name, totalTokens, items };
}
function parseTokenBaseResponse(buf) {
    const fields = (0, protobuf_1.readFields)(buf);
    // field 3 = groups wrapper, field 4 = remainingBudget, field 5 = customizationBudget
    const groupsWrapper = fields.find(f => f.field === 3 && f.bytes);
    const remainingBudget = fields.find(f => f.field === 4)?.varint || 0;
    const customizationBudget = fields.find(f => f.field === 5)?.varint || 0;
    let categories = [];
    let totalTokens = 0;
    if (groupsWrapper?.bytes) {
        const wrapperFields = (0, protobuf_1.readFields)(groupsWrapper.bytes);
        categories = wrapperFields
            .filter(f => f.field === 1 && f.bytes)
            .map(f => parseCategory(f.bytes));
        totalTokens = wrapperFields.find(f => f.field === 2)?.varint || 0;
    }
    const usedPercent = customizationBudget > 0
        ? Math.min(100, Math.round((totalTokens / customizationBudget) * 100))
        : 0;
    return { categories, totalTokens, remainingBudget, customizationBudget, usedPercent };
}
// ==================== Context Scope Parser ====================
/**
 * Parse GetMatchingContextScopeItems response.
 * Structure: top-level repeated nested message → inner nested → f4(size), f5(uri), f6({f1:root,f2:relPath})
 */
function parseContextScope(buf) {
    const results = [];
    const topFields = (0, protobuf_1.readFields)(buf);
    for (const topField of topFields) {
        if (!topField.bytes)
            continue;
        // Try direct data first, then one level deeper
        let dataFields = (0, protobuf_1.readFields)(topField.bytes);
        const deeper = dataFields.find(f => (f.field === 1 || f.field === 2) && f.bytes);
        if (deeper?.bytes) {
            const deepFields = (0, protobuf_1.readFields)(deeper.bytes);
            if (deepFields.some(f => f.field === 5 && f.bytes)) {
                dataFields = deepFields;
            }
        }
        const uriField = dataFields.find(f => f.field === 5 && f.bytes);
        if (!uriField?.bytes)
            continue;
        const uri = uriField.bytes.toString('utf-8');
        if (!isAgentPath(uri))
            continue;
        const sizeBytes = dataFields.find(f => f.field === 4)?.varint ?? 0;
        const pathWrapper = dataFields.find(f => f.field === 6 && f.bytes)?.bytes;
        let relPath = '';
        if (pathWrapper) {
            const pf = (0, protobuf_1.readFields)(pathWrapper);
            relPath = pf.find(f => f.field === 2)?.bytes?.toString('utf-8') ?? '';
        }
        if (!relPath) {
            const m = uri.match(AGENT_PATH_CAPTURE);
            relPath = m ? m[1] : '';
        }
        if (relPath)
            results.push({ uri, relPath, sizeBytes });
    }
    return results;
}
/** Read trigger value from a rule .md file's frontmatter */
function readRuleTrigger(filePath) {
    try {
        // Only read first 256 bytes — frontmatter is always at the top
        const fd = fs.openSync(filePath, 'r');
        const buf = Buffer.alloc(constants_1.FILE_HEADER_READ_BYTES);
        fs.readSync(fd, buf, 0, constants_1.FILE_HEADER_READ_BYTES, 0);
        fs.closeSync(fd);
        const head = buf.toString('utf-8');
        const match = head.match(/^---[\s\S]*?^trigger:\s*(\S+)/m);
        if (match) {
            const t = match[1].trim();
            if (t === 'manual')
                return 'manual';
            if (t === 'model_decision')
                return 'model_decision';
        }
    }
    catch { /* ignore — default to always_on */ }
    return 'always_on';
}
/** Categorize raw scope items into rules/skills/workflows (trigger=always_on default) */
function categorizeAgentItems(items, workspaceName) {
    const allRules = [];
    const skills = [];
    const workflows = [];
    for (const { relPath, sizeBytes } of items) {
        const parts = relPath.split('/');
        // .agent/rules/FILENAME.md or .agents/rules/FILENAME.md  (depth 3)
        if (parts[1] === 'rules' && parts.length === 3 && relPath.endsWith('.md')) {
            allRules.push({ name: parts[2].replace(/\.md$/, ''), path: relPath, sizeBytes, trigger: 'always_on' });
        }
        // .agent/skills/SKILLNAME or .agents/skills/SKILLNAME  (depth 3, no extension = directory)
        else if (parts[1] === 'skills' && parts.length === 3 && !parts[2].includes('.')) {
            skills.push({ name: parts[2], path: relPath, sizeBytes, trigger: 'always_on' });
        }
        // .agent/workflows/FILENAME.md or .agents/workflows/FILENAME.md  (depth 3)
        else if (parts[1] === 'workflows' && parts.length === 3 && relPath.endsWith('.md')) {
            workflows.push({ name: parts[2].replace(/\.md$/, ''), path: relPath, sizeBytes, trigger: 'always_on' });
        }
    }
    const byName = (a, b) => a.name.localeCompare(b.name);
    return {
        workspaceName,
        rules: allRules.sort(byName), // triggers will be enriched later
        rulesModelDecision: [],
        rulesManual: [],
        skills: skills.sort(byName),
        workflows: workflows.sort(byName),
    };
}
class TokenBaseService {
    /**
     * Fetch token base data.
     *
     * Strategy:
     * 1. If serverInfo provided (from serverDiscovery), call GetTokenBase via HTTP
     *    on the same port \u2014 no separate HTTPS discovery needed, works for all workspaces.
     * 2. Fallback: HTTPS discovery (only finds LS with --https_server_port in args).
     */
    async fetchTokenBase(serverInfo, workspaceId) {
        // Path 1: HTTP via already-discovered workspace LS port
        if (serverInfo) {
            try {
                const body = await this.callHttp(serverInfo, `${constants_1.LS_SERVICE_PATH}/GetTokenBase`, 5000);
                const data = parseTokenBaseResponse(body);
                log.info(`Token base (HTTP): ${data.totalTokens}/${data.customizationBudget} tokens (${data.usedPercent}%)`);
                return data;
            }
            catch (e) {
                log.warn('HTTP token base failed, falling back to HTTPS discovery:', e?.message);
            }
        }
        // Path 2: HTTPS discovery fallback (legacy \u2014 only works if --https_server_port in args)
        try {
            let lsProcesses = await (0, lsClient_1.findLSEndpoints)();
            if (lsProcesses.length === 0)
                return null;
            if (workspaceId) {
                lsProcesses = [...lsProcesses].sort((a, b) => (a.wsId === workspaceId ? 0 : 1) - (b.wsId === workspaceId ? 0 : 1));
            }
            const ca = (0, lsClient_1.loadLSCert)();
            const endpoint = `${constants_1.LS_SERVICE_PATH}/GetTokenBase`;
            for (const ls of lsProcesses) {
                try {
                    const body = await (0, lsClient_1.callLSEndpoint)(ls, endpoint, ca);
                    const data = parseTokenBaseResponse(body);
                    log.info(`Token base (HTTPS): ${data.totalTokens}/${data.customizationBudget} tokens (${data.usedPercent}%)`);
                    return data;
                }
                catch (e) {
                    log.warn(`LS port ${ls.port} failed:`, e?.message);
                }
            }
        }
        catch (e) {
            log.error('fetchTokenBase failed:', e?.message);
        }
        return null;
    }
    /**
     * Fetch workspace context items from GetMatchingContextScopeItems.
     * Reads each rule file's frontmatter to get the real trigger type.
     * @param workspaceFsPath  Absolute filesystem path to workspace root (e.g. /Users/eren/denetmenapp-web)
     */
    async fetchWorkspaceContext(serverInfo, workspaceName, workspaceFsPath) {
        try {
            const buf = await this.callHttp(serverInfo, `${constants_1.LS_SERVICE_PATH}/GetMatchingContextScopeItems`);
            let raw = parseContextScope(buf);
            // Guard: if LS returned items from a DIFFERENT workspace (race on first boot),
            // filter to only items whose URI matches this workspace's path.
            if (workspaceFsPath) {
                const before = raw.length;
                raw = raw.filter(item => item.uri.includes(workspaceFsPath));
                if (raw.length < before) {
                    log.warn(`Workspace context: filtered ${before - raw.length} items from other workspace(s)`);
                }
                if (raw.length === 0) {
                    log.warn('Workspace context: all items filtered — likely wrong LS, returning null');
                    return null;
                }
            }
            const data = categorizeAgentItems(raw, workspaceName);
            // Enrich each rule with its REAL trigger from frontmatter
            const enriched = [];
            for (const rule of data.rules) {
                const absPath = path.join(workspaceFsPath, rule.path);
                const trigger = readRuleTrigger(absPath);
                enriched.push({ ...rule, trigger });
            }
            // Split by actual trigger
            data.rules = enriched.filter(r => r.trigger === 'always_on');
            data.rulesModelDecision = enriched.filter(r => r.trigger === 'model_decision').sort((a, b) => a.name.localeCompare(b.name));
            data.rulesManual = enriched.filter(r => r.trigger === 'manual').sort((a, b) => a.name.localeCompare(b.name));
            log.info(`Workspace context: ${data.rules.length} always-on rules, ${data.rulesModelDecision.length} model-decision, ${data.rulesManual.length} manual, ${data.skills.length} skills, ${data.workflows.length} workflows`);
            return data;
        }
        catch (e) {
            log.warn('fetchWorkspaceContext failed:', e?.message);
            return null;
        }
    }
    /** Generic HTTP POST to LS endpoint, returns raw Buffer — delegates to unified client */
    callHttp(serverInfo, endpointPath, timeoutMs = constants_1.DEFAULT_LS_TIMEOUT_MS) {
        return (0, lsClient_1.callLsProto)(serverInfo, endpointPath, timeoutMs);
    }
}
exports.TokenBaseService = TokenBaseService;
//# sourceMappingURL=tokenBase.js.map