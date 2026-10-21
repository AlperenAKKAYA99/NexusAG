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
exports.LiveStream = void 0;
const events_1 = require("events");
const http = __importStar(require("http"));
const logger_1 = require("../utils/logger");
const constants_1 = require("../constants");
const log = (0, logger_1.createLogger)('LiveStream');
/**
 * Ultra-lightweight stream — only extracts totalLength for live context window offset.
 * No reconnect, no heartbeat, no zombie detection.
 * USS trajectorySummaries is the primary signal; this is a real-time offset hint.
 */
class LiveStream extends events_1.EventEmitter {
    req = null;
    buffer = Buffer.alloc(0);
    destroyed = false;
    cascadeId = null;
    connect(server, cascadeId) {
        this.disconnect();
        this.cascadeId = cascadeId;
        this.destroyed = false;
        const subId = `ag-live-${Date.now()}`;
        const bodyObj = { conversationId: cascadeId, subscriberId: subId };
        const jsonBuf = Buffer.from(JSON.stringify(bodyObj), 'utf8');
        // ConnectRPC envelope: 1-byte tag (0x00) + 4-byte big-endian length + JSON payload
        const envelope = Buffer.alloc(5 + jsonBuf.length);
        envelope.writeUInt8(0x00, 0);
        envelope.writeUInt32BE(jsonBuf.length, 1);
        jsonBuf.copy(envelope, 5);
        log.diag(`connect port=${server.port} cascade=${cascadeId.substring(0, 12)}`);
        const req = http.request({
            hostname: '127.0.0.1',
            port: server.port,
            path: `${constants_1.LS_SERVICE_PATH}/StreamAgentStateUpdates`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/connect+json',
                'Connect-Protocol-Version': '1',
                'X-Codeium-Csrf-Token': server.csrfToken,
                'Content-Length': String(envelope.length),
            },
        }, (res) => {
            if (this.destroyed) {
                res.destroy();
                return;
            }
            if (res.statusCode !== 200) {
                log.diag(`HTTP ${res.statusCode}`);
                return;
            }
            log.diag('stream OPEN');
            let totalBytes = 0;
            let firstChunk = true;
            res.on('data', (chunk) => {
                if (this.destroyed) {
                    res.destroy();
                    return;
                }
                totalBytes += chunk.length;
                if (firstChunk) {
                    firstChunk = false;
                    // Dump first 200 chars for debugging
                    const preview = chunk.subarray(5).toString('utf8').substring(0, 300);
                    log.diag(`first chunk: ${chunk.length}b tag=${chunk[0]} len=${chunk.readUInt32BE(1)} preview=${preview}`);
                }
                this.buffer = Buffer.concat([this.buffer, chunk]);
                this.parseFrames();
            });
            res.on('end', () => log.diag(`stream ended (${totalBytes} bytes received, buf=${this.buffer.length})`));
            res.on('error', (err) => log.diag(`error: ${err.message}`));
        });
        req.on('error', (err) => log.diag(`req error: ${err.message}`));
        req.write(envelope);
        req.end();
        this.req = req;
    }
    disconnect() {
        this.req?.destroy();
        this.req = null;
        this.buffer = Buffer.alloc(0);
    }
    destroy() {
        this.destroyed = true;
        this.disconnect();
        this.removeAllListeners();
    }
    parseFrames() {
        while (this.buffer.length >= 5) {
            const tag = this.buffer.readUInt8(0);
            const len = this.buffer.readUInt32BE(1);
            if (this.buffer.length < 5 + len)
                break;
            const payload = this.buffer.subarray(5, 5 + len);
            this.buffer = this.buffer.subarray(5 + len);
            // tag 0x02 = end-of-stream trailer, skip
            if (tag !== 0x00)
                continue;
            try {
                const parsed = JSON.parse(payload.toString('utf8'));
                const update = parsed.update || parsed;
                const totalLength = update?.mainTrajectoryUpdate?.generatorMetadatasUpdate?.totalLength;
                if (totalLength && totalLength > 0 && this.cascadeId) {
                    this.emit('totalLength', {
                        totalLength,
                        conversationId: this.cascadeId,
                    });
                }
            }
            catch { /* malformed frame, skip */ }
        }
    }
}
exports.LiveStream = LiveStream;
//# sourceMappingURL=liveStream.js.map