import { ServerInfo } from '../types';
export interface WorkspaceContextItem {
    /** Display name e.g. "advanced-event-handler-refs" */
    name: string;
    /** Relative path e.g. ".agent/rules/advanced-event-handler-refs.md" */
    path: string;
    /** Size in bytes from LS index */
    sizeBytes: number;
    /** Actual trigger from frontmatter: always_on | model_decision | manual */
    trigger: 'always_on' | 'model_decision' | 'manual';
}
export interface WorkspaceContextData {
    /** Name of the workspace folder */
    workspaceName: string;
    /** Rules with trigger=always_on */
    rules: WorkspaceContextItem[];
    /** Rules with trigger=model_decision */
    rulesModelDecision: WorkspaceContextItem[];
    /** Rules with trigger=manual */
    rulesManual: WorkspaceContextItem[];
    skills: WorkspaceContextItem[];
    workflows: WorkspaceContextItem[];
}
/** Single tool/item within a category */
export interface TokenItem {
    name: string;
    tokens: number;
    /** Sub-tools (for MCP servers) */
    tools?: Array<{
        name: string;
        tokens: number;
    }>;
}
/** Token category (Rules, Skills, Workflows, MCP Tools) */
export interface TokenCategory {
    name: string;
    totalTokens: number;
    items: TokenItem[];
}
/** Full GetTokenBase response */
export interface TokenBaseData {
    categories: TokenCategory[];
    totalTokens: number;
    remainingBudget: number;
    customizationBudget: number;
    usedPercent: number;
}
export declare class TokenBaseService {
    /**
     * Fetch token base data.
     *
     * Strategy:
     * 1. If serverInfo provided (from serverDiscovery), call GetTokenBase via HTTP
     *    on the same port \u2014 no separate HTTPS discovery needed, works for all workspaces.
     * 2. Fallback: HTTPS discovery (only finds LS with --https_server_port in args).
     */
    fetchTokenBase(serverInfo?: ServerInfo | null, workspaceId?: string): Promise<TokenBaseData | null>;
    /**
     * Fetch workspace context items from GetMatchingContextScopeItems.
     * Reads each rule file's frontmatter to get the real trigger type.
     * @param workspaceFsPath  Absolute filesystem path to workspace root (e.g. /Users/eren/denetmenapp-web)
     */
    fetchWorkspaceContext(serverInfo: ServerInfo, workspaceName: string, workspaceFsPath: string): Promise<WorkspaceContextData | null>;
    /** Generic HTTP POST to LS endpoint, returns raw Buffer — delegates to unified client */
    private callHttp;
}
