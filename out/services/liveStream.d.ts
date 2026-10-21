import { EventEmitter } from 'events';
import { ServerInfo } from '../types';
/**
 * Ultra-lightweight stream — only extracts totalLength for live context window offset.
 * No reconnect, no heartbeat, no zombie detection.
 * USS trajectorySummaries is the primary signal; this is a real-time offset hint.
 */
export declare class LiveStream extends EventEmitter {
    private req;
    private buffer;
    private destroyed;
    private cascadeId;
    connect(server: ServerInfo, cascadeId: string): void;
    disconnect(): void;
    destroy(): void;
    private parseFrames;
}
