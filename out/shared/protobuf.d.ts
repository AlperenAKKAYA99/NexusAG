/**
 * Protobuf Varint Codec — Pure TypeScript implementation.
 * ═══════════════════════════════════════════════════════
 * Shared between extension host (conversationGuard) and
 * detached worker (conversationFix). No external dependencies.
 */
/** Decode a varint from buffer at the given offset. Returns value and next position. */
export declare function decodeVarint(buffer: Buffer, offset: number): {
    value: number;
    pos: number;
};
/** Encode an integer as a varint buffer. */
export declare function encodeVarint(value: number): Buffer;
/** Skip a protobuf field at the given position based on its wire type. */
export declare function skipProtobufField(buffer: Buffer, pos: number, wireType: number): number;
/** Remove all instances of a specific field number from a protobuf blob. */
export declare function stripFieldFromProtobuf(data: Buffer, targetFieldNumber: number): Buffer;
/** Encode a length-delimited field (wire type 2). */
export declare function encodeLengthDelimited(fieldNum: number, data: Buffer): Buffer;
/** Encode a string field (length-delimited UTF-8). */
export declare function encodeStringField(fieldNum: number, str: string): Buffer;
/** Build timestamp fields (field 3, 7, 10) with the given epoch seconds. */
export declare function buildTimestampFields(epochSeconds: number): Buffer;
/** Check if a protobuf blob already contains timestamp fields (3, 7, or 10). */
export declare function hasTimestampFields(innerBlob: Buffer): boolean;
/** Encode a field tag (field number + wire type) */
export declare function encodeTag(fieldNumber: number, wireType: number): Buffer;
/** Encode a string/bytes field (wire type 2: length-delimited) — alias with tag-style API */
export declare function encodeString(fieldNumber: number, value: string): Buffer;
/** Encode a varint field (wire type 0) */
export declare function encodeVarintField(fieldNumber: number, value: number): Buffer;
/** Encode a nested message field (wire type 2: length-delimited) */
export declare function encodeMessage(fieldNumber: number, payload: Buffer): Buffer;
/** Parsed protobuf field from readFields() */
export interface ProtoField {
    field: number;
    wireType: number;
    varint?: number;
    bytes?: Buffer;
}
/**
 * Parse ALL fields from a protobuf buffer into an array.
 * General-purpose decoder: supports varint (0), 64-bit (1), length-delimited (2), 32-bit (5).
 */
export declare function readFields(buf: Buffer): ProtoField[];
/**
 * Extract a length-delimited (wire type 2) proto field by field number.
 * Convenience wrapper around readFields for single-field extraction.
 */
export declare function extractField(buf: Buffer, targetField: number): Buffer | null;
/**
 * Extract a string field from a protobuf buffer.
 * Convenience wrapper around extractField that decodes UTF-8.
 */
export declare function extractStringField(buf: Buffer, targetField: number): string;
