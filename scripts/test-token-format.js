/**
 * Automated test suite for token export formatting and smart extraction.
 * Tests round-trip fidelity, edge cases, comment filtering, and delimiter resilience.
 */
const assert = require('assert');
const path = require('path');

// Compile-time check / runtime require from out/
const { formatTokens, extractTokens } = require('../out/shared/tokenExportFormatter');

console.log('🧪 Starting Token Format & Smart Extraction Test Suite...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✅ PASS: ${name}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ FAIL: ${name}`);
        console.error(`     Error: ${err.message}`);
        failed++;
    }
}

const SAMPLE_TOKENS = [
    { email: 'dev.alperen@gmail.com', name: 'Alperen Akkaya', token: '1//0eAAA_1234567890abcdefghijklmnopqrstuvwxyz-X' },
    { email: 'work.corp@example.com', name: 'Work Corp', token: '1//0eBBB_9876543210zyxwvutsrqponmlkjihgfedcba-Y' },
    { email: 'personal@domain.org', token: '1//0eCCC_abcdef1234567890_token_test_sample-Z' }
];

// 1. Plain Format
test('Plain format: Serialization & Extraction Round-trip', () => {
    const plain = formatTokens(SAMPLE_TOKENS, 'plain');
    const expected = SAMPLE_TOKENS.map(t => t.token).join('\n');
    assert.strictEqual(plain, expected, 'Plain output matches expected newline format');

    const extracted = extractTokens(plain);
    assert.deepStrictEqual(extracted, SAMPLE_TOKENS.map(t => t.token), 'Plain extracted tokens match original tokens');
});

// 2. Labeled Format
test('Labeled format: Serialization & Extraction Round-trip', () => {
    const labeled = formatTokens(SAMPLE_TOKENS, 'labeled');
    assert(labeled.includes('# Alperen Akkaya <dev.alperen@gmail.com>'), 'Contains user header');
    assert(labeled.includes('# personal@domain.org'), 'Contains email-only header');

    const extracted = extractTokens(labeled);
    assert.deepStrictEqual(extracted, SAMPLE_TOKENS.map(t => t.token), 'Extracted tokens ignore comment lines and match originals');
});

// 3. JSON Format
test('JSON format: Serialization & Extraction Round-trip', () => {
    const jsonStr = formatTokens(SAMPLE_TOKENS, 'json');
    const parsed = JSON.parse(jsonStr);
    assert(Array.isArray(parsed) && parsed.length === 3, 'Valid JSON array produced');
    assert.strictEqual(parsed[0].refresh_token, SAMPLE_TOKENS[0].token);

    const extracted = extractTokens(jsonStr);
    assert.deepStrictEqual(extracted, SAMPLE_TOKENS.map(t => t.token), 'JSON extracted tokens match original tokens');
});

// 4. Comment stripping & mixed delimiters
test('Smart Extraction: Strips mixed comments and handles delimiters', () => {
    const mixedInput = `
        # Header comment explaining the list
        // Secondary developer comment
        1//0eAAA_1234567890abcdefghijklmnopqrstuvwxyz-X
        # Another comment
        1//0eBBB_9876543210zyxwvutsrqponmlkjihgfedcba-Y, 1//0eCCC_abcdef1234567890_token_test_sample-Z;
    `;
    const extracted = extractTokens(mixedInput);
    assert.deepStrictEqual(extracted, SAMPLE_TOKENS.map(t => t.token), 'Correctly extracts tokens amidst comments and delimiters');
});

// 5. Deduplication
test('Smart Extraction: Deduplicates redundant tokens', () => {
    const repeated = `
        1//0eAAA_1234567890abcdefghijklmnopqrstuvwxyz-X
        1//0eAAA_1234567890abcdefghijklmnopqrstuvwxyz-X
        1//0eBBB_9876543210zyxwvutsrqponmlkjihgfedcba-Y
    `;
    const extracted = extractTokens(repeated);
    assert.strictEqual(extracted.length, 2, 'Duplicate tokens removed');
});

// 6. Resilience on empty or corrupted input
test('Resilience: Handles empty string, null, undefined, invalid JSON gracefully', () => {
    assert.deepStrictEqual(extractTokens(''), []);
    assert.deepStrictEqual(extractTokens(null), []);
    assert.deepStrictEqual(extractTokens(undefined), []);
    assert.deepStrictEqual(extractTokens('   \n\n\t  '), []);
    assert.deepStrictEqual(extractTokens('{ broken json: '), []);
    assert.strictEqual(formatTokens([], 'plain'), '');
});

console.log(`\nResults: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
    process.exit(1);
} else {
    console.log('🎉 All token format and extraction tests passed successfully!\n');
}
