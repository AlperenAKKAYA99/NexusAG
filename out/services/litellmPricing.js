"use strict";
/**
 * LiteLlmPricingCatalog — Dynamic pricing from LiteLLM's model catalog.
 * Fetches 700+ model prices from GitHub at boot, caches for 6 hours.
 * Resolution: exact match → suffix match → alias expansion → null
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
exports.initPricingCatalog = initPricingCatalog;
exports.resolveLiteLlmPricing = resolveLiteLlmPricing;
const https = __importStar(require("https"));
const logger_1 = require("../utils/logger");
const log = (0, logger_1.createLogger)('LiteLLM');
/** Pinned immutable commit SHA of BerriAI/litellm (mitigates mutable branch tampering - CWE-829 / VULN-03) */
const PRICING_COMMIT = '5338edb7e32172f119ac5acf25e451ac83a235e0';
const PRICING_URL = `https://raw.githubusercontent.com/BerriAI/litellm/${PRICING_COMMIT}/model_prices_and_context_window.json`;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
let cached = null;
/** Initialize pricing catalog — call at boot (fire-and-forget). */
async function initPricingCatalog() {
    try {
        await fetchAndBuild();
    }
    catch (e) {
        log.warn('LiteLLM init failed (hardcoded fallback active):', e?.message);
    }
}
/** Resolve pricing for a model name. Returns null → use hardcoded fallback. */
function resolveLiteLlmPricing(modelName) {
    if (!cached)
        return null;
    // Background refresh if stale (still use current data)
    if (Date.now() - cached.fetchedAt > CACHE_TTL_MS) {
        fetchAndBuild().catch(() => { });
    }
    const n = normalize(modelName);
    return cached.exactIndex.get(n)
        || cached.suffixIndex.get(n)
        || findByAliases(n)
        || null;
}
// ─── Internal ───
function findByAliases(model) {
    for (const alias of buildAliases(model)) {
        const m = cached.exactIndex.get(alias) || cached.suffixIndex.get(alias);
        if (m)
            return m;
    }
    return null;
}
async function fetchAndBuild() {
    const raw = await fetchJson(PRICING_URL);
    const exactIndex = new Map();
    const suffixIndex = new Map();
    let count = 0;
    for (const [key, entry] of Object.entries(raw)) {
        if (key === 'sample_spec' || typeof entry !== 'object' || !entry)
            continue;
        const e = entry;
        // Skip non-chat models
        if (e.mode && e.mode !== 'chat' && e.mode !== 'completion')
            continue;
        if (!e.input_cost_per_token && !e.output_cost_per_token)
            continue;
        const p = {
            inputCostPerToken: e.input_cost_per_token ?? 0,
            outputCostPerToken: e.output_cost_per_token ?? 0,
            cacheReadCostPerToken: e.cache_read_input_token_cost,
            cacheWriteCostPerToken: e.cache_creation_input_token_cost,
            reasoningCostPerToken: e.output_cost_per_reasoning_token,
        };
        const n = normalize(key);
        exactIndex.set(n, p);
        count++;
        for (const alias of buildAliases(n)) {
            if (!suffixIndex.has(alias))
                suffixIndex.set(alias, p);
        }
    }
    cached = { exactIndex, suffixIndex, fetchedAt: Date.now(), modelCount: count };
    log.info(`LiteLLM pricing loaded: ${count} models`);
}
function normalize(name) {
    return name.toLowerCase()
        .replace(/^(models[/\-_]|vertex_ai\/|anthropic\/|google\/|openai\/)/, '')
        .trim();
}
function buildAliases(model) {
    const aliases = [];
    for (const s of ['-high', '-low', '-c', '-thinking', '-preview', '-latest', '-exp']) {
        if (model.endsWith(s))
            aliases.push(model.slice(0, -s.length));
    }
    // gemini-3.1-pro → gemini-3-pro
    if (/\d+\.\d+/.test(model))
        aliases.push(model.replace(/(\d+)\.\d+/, '$1'));
    // claude-opus-4-6 → claude-opus-4.6
    if (/\d+-\d+(?!-)/.test(model))
        aliases.push(model.replace(/(\d+)-(\d+)(?!-)/, '$1.$2'));
    return aliases;
}
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: 10000 }, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                }
                catch {
                    reject(new Error('Invalid JSON from LiteLLM'));
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('LiteLLM timeout')); });
    });
}
//# sourceMappingURL=litellmPricing.js.map