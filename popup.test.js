const assert = require('assert');
const { extractPixeldrainId } = require('./popup.js');

// Happy paths
assert.strictEqual(extractPixeldrainId('https://pixeldrain.com/u/12345678'), '12345678', 'Should extract ID from full HTTPS URL');
assert.strictEqual(extractPixeldrainId('http://pixeldrain.com/u/abcdefgh'), 'abcdefgh', 'Should extract ID from full HTTP URL');
assert.strictEqual(extractPixeldrainId('pixeldrain.com/u/testID123'), 'testID123', 'Should extract ID from URL without protocol');
assert.strictEqual(extractPixeldrainId('12345678'), '12345678', 'Should extract ID when only ID is provided');
assert.strictEqual(extractPixeldrainId('aB3_d-5e'), 'aB3_d-5e', 'Should extract ID with underscores and hyphens');

// Edge cases
assert.strictEqual(extractPixeldrainId('https://pixeldrain.com/u/12345678?query=string'), '12345678', 'Should ignore query parameters');
assert.strictEqual(extractPixeldrainId('https://pixeldrain.com/u/12345678#hash'), '12345678', 'Should ignore hash fragments');

// Error conditions (should return null)
assert.strictEqual(extractPixeldrainId(''), null, 'Empty string should return null');
assert.strictEqual(extractPixeldrainId(null), null, 'Null should return null');
assert.strictEqual(extractPixeldrainId(undefined), null, 'Undefined should return null');
assert.strictEqual(extractPixeldrainId('https://example.com/u/12345678'), null, 'Non-pixeldrain URL should return null');
assert.strictEqual(extractPixeldrainId('https://pixeldrain.com/a/12345678'), null, 'Invalid path should return null');
assert.strictEqual(extractPixeldrainId('invalid!chars'), null, 'ID with invalid characters should return null');

console.log('All tests passed successfully!');
