/**
 * ContextDetailService — fetches step content and exports conversation as markdown.
 *
 * Data sources:
 * - GetCascadeTrajectorySteps → step content (user messages, commands, code edits)
 * - ConvertTrajectoryToMarkdown → full conversation markdown export
 */
import { ServerInfo } from '../types';
export interface StepContent {
    type: string;
    /** Human-readable label for the step */
    label: string;
    /** Main content text */
    content: string;
    /** Optional secondary content (e.g. command output) */
    output?: string;
    /** Timestamp */
    createdAt?: string;
    /** Token count from modelUsage */
    tokens?: {
        input: number;
        output: number;
    };
}
export declare class ContextDetailService {
    /**
     * Fetch a specific step's content from the trajectory.
     *
     * The `ordinal` is the sequential position of this child within
     * its tokenBreakdown group (Chat Messages). This maps directly
     * to the trajectory steps array, giving us an exact match.
     */
    getStepContent(serverInfo: ServerInfo, cascadeId: string, stepName: string, ordinal?: number): Promise<StepContent | null>;
    /**
     * Export the conversation as markdown using the LS endpoint.
     */
    exportAsMarkdown(serverInfo: ServerInfo, cascadeId: string): Promise<string | null>;
    private parseStep;
    /**
     * Deep content extractor — walks through step object to find the first
     * string value with meaningful content (>20 chars). Used as fallback
     * when specific field mappings don't have the expected structure.
     */
    private extractDeepContent;
}
