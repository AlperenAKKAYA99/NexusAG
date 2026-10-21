"use strict";
/**
 * Protobuf Varint Codec — Pure TypeScript implementation.
 * ═══════════════════════════════════════════════════════
 * Shared between extension host (conversationGuard) and
 * detached worker (conversationFix). No external dependencies.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeVarint = decodeVarint;
exports.encodeVarint = encodeVarint;
exports.skipProtobufField = skipProtobufField;
exports.stripFieldFromProtobuf = stripFieldFromProtobuf;
exports.encodeLengthDelimited = encodeLengthDelimited;
exports.encodeStringField = encodeStringField;
exports.buildTimestampFields = buildTimestampFields;
exports.hasTimestampFields = hasTimestampFields;
exports.encodeTag = encodeTag;
exports.encodeString = encodeString;
exports.encodeVarintField = encodeVarintField;
exports.encodeMessage = encodeMessage;
exports.readFields = readFields;
exports.extractField = extractField;
exports.extractStringField = extractStringField;
// ─── Decode ──────────────────────────────────────────────────────────
/** Decode a varint from buffer at the given offset. Returns value and next position. */
function decodeVarint(buffer, offset) {
    let result = 0, shift = 0, pos = offset || 0;
    while (pos < buffer.length) {
        const byte = buffer[pos++];
        result += (byte & 0x7F) * Math.pow(2, shift);
        if ((byte & 0x80) === 0)
            break;
        shift += 7;
    }
    return { value: result, pos };
}
// ─── Encode ──────────────────────────────────────────────────────────
/** Encode an integer as a varint buffer. */
function encodeVarint(value) {
    const bytes = [];
    if (value === 0)
        return Buffer.from([0]);
    while (value > 0x7F) {
        bytes.push((value & 0x7F) | 0x80);
        value = Math.floor(value / 128);
    }
    bytes.push(value & 0x7F);
    return Buffer.from(bytes);
}
// ─── Field Navigation ────────────────────────────────────────────────
/** Skip a protobuf field at the given position based on its wire type. */
function skipProtobufField(buffer, pos, wireType) {
    if (wireType === 0) {
        while (pos < buffer.length && (buffer[pos++] & 0x80) !== 0) { }
        return pos;
    }
    if (wireType === 1)
        return pos + 8; // 64-bit
    if (wireType === 2) { // length-delimited
        const { value: len, pos: next } = decodeVarint(buffer, pos);
        return next + len;
    }
    if (wireType === 5)
        return pos + 4; // 32-bit
    throw new Error(`Unsupported wire type: ${wireType}`);
}
/** Remove all instances of a specific field number from a protobuf blob. */
function stripFieldFromProtobuf(data, targetFieldNumber) {
    const chunks = [];
    let pos = 0;
    while (pos < data.length) {
        const startPos = pos;
        let tag;
        try {
            const r = decodeVarint(data, pos);
            tag = r.value;
            pos = r.pos;
        }
        catch {
            chunks.push(data.slice(startPos));
            break;
        }
        const wireType = tag & 7;
        const fieldNum = Math.floor(tag / 8);
        try {
            pos = skipProtobufField(data, pos, wireType);
        }
        catch {
            chunks.push(data.slice(startPos));
            break;
        }
        if (fieldNum !== targetFieldNumber) {
            chunks.push(data.slice(startPos, pos));
        }
    }
    return Buffer.concat(chunks);
}
// ─── Field Builders ──────────────────────────────────────────────────
/** Encode a length-delimited field (wire type 2). */
function encodeLengthDelimited(fieldNum, data) {
    const tag = encodeVarint(fieldNum * 8 + 2);
    const len = encodeVarint(data.length);
    return Buffer.concat([tag, len, data]);
}
/** Encode a string field (length-delimited UTF-8). */
function encodeStringField(fieldNum, str) {
    return encodeLengthDelimited(fieldNum, Buffer.from(str, 'utf8'));
}
/** Build timestamp fields (field 3, 7, 10) with the given epoch seconds. */
function buildTimestampFields(epochSeconds) {
    const seconds = Math.floor(epochSeconds);
    const tsInner = Buffer.concat([encodeVarint(8), encodeVarint(seconds)]);
    return Buffer.concat([
        encodeLengthDelimited(3, tsInner),
        encodeLengthDelimited(7, tsInner),
        encodeLengthDelimited(10, tsInner),
    ]);
}
/** Check if a protobuf blob already contains timestamp fields (3, 7, or 10). */
function hasTimestampFields(innerBlob) {
    if (!innerBlob)
        return false;
    try {
        let pos = 0;
        while (pos < innerBlob.length) {
            const { value: tag, pos: next } = decodeVarint(innerBlob, pos);
            const fieldNum = Math.floor(tag / 8);
            const wireType = tag & 7;
            if (fieldNum === 3 || fieldNum === 7 || fieldNum === 10)
                return true;
            pos = skipProtobufField(innerBlob, next, wireType);
        }
    }
    catch { /* ignore */ }
    return false;
}
// ─── High-level Encoding (tag-based) ─────────────────────────────────
/** Encode a field tag (field number + wire type) */
function encodeTag(fieldNumber, wireType) {
    return encodeVarint((fieldNumber << 3) | wireType);
}
/** Encode a string/bytes field (wire type 2: length-delimited) — alias with tag-style API */
function encodeString(fieldNumber, value) {
    const buf = Buffer.from(value, 'utf-8');
    return Buffer.concat([encodeTag(fieldNumber, 2), encodeVarint(buf.length), buf]);
}
/** Encode a varint field (wire type 0) */
function encodeVarintField(fieldNumber, value) {
    return Buffer.concat([encodeTag(fieldNumber, 0), encodeVarint(value)]);
}
/** Encode a nested message field (wire type 2: length-delimited) */
function encodeMessage(fieldNumber, payload) {
    return Buffer.concat([encodeTag(fieldNumber, 2), encodeVarint(payload.length), payload]);
}
/**
 * Parse ALL fields from a protobuf buffer into an array.
 * General-purpose decoder: supports varint (0), 64-bit (1), length-delimited (2), 32-bit (5).
 */
function readFields(buf) {
    const fields = [];
    let offset = 0;
    while (offset < buf.length) {
        const r = decodeVarint(buf, offset);
        const tag = r.value;
        offset = r.pos;
        const fieldNumber = tag >> 3;
        const wireType = tag & 0x7;
        if (wireType === 0) {
            const v = decodeVarint(buf, offset);
            fields.push({ field: fieldNumber, wireType, varint: v.value });
            offset = v.pos;
        }
        else if (wireType === 2) {
            const l = decodeVarint(buf, offset);
            offset = l.pos;
            fields.push({ field: fieldNumber, wireType, bytes: buf.subarray(offset, offset + l.value) });
            offset += l.value;
        }
        else if (wireType === 5) {
            offset += 4;
        }
        else if (wireType === 1) {
            offset += 8;
        }
        else {
            break;
        }
    }
    return fields;
}
/**
 * Extract a length-delimited (wire type 2) proto field by field number.
 * Convenience wrapper around readFields for single-field extraction.
 */
function extractField(buf, targetField) {
    const fields = readFields(buf);
    const match = fields.find(f => f.field === targetField && f.wireType === 2);
    return match?.bytes ?? null;
}
/**
 * Extract a string field from a protobuf buffer.
 * Convenience wrapper around extractField that decodes UTF-8.
 */
function extractStringField(buf, targetField) {
    const raw = extractField(buf, targetField);
    return raw ? raw.toString('utf-8') : '';
}
//# sourceMappingURL=protobuf.js.map