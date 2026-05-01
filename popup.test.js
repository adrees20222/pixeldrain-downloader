const fs = require('fs');
const assert = require('assert');
const { extractPixeldrainId } = require('./popup.js');

// --- Unit tests for extractPixeldrainId ---

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

console.log('Unit tests for extractPixeldrainId passed successfully!');

// --- Integration tests for startDownloadLocal fallback ---

// Mock DOM
const domElements = {};
const documentListeners = {};

global.document = {
    addEventListener: (event, callback) => {
        documentListeners[event] = callback;
    },
    getElementById: (id) => {
        if (!domElements[id]) {
            domElements[id] = {
                id,
                classList: {
                    classes: new Set(),
                    add: function(c) { this.classes.add(c); },
                    remove: function(...c) { c.forEach(cls => this.classes.delete(cls)); },
                    contains: function(c) { return this.classes.has(c); }
                },
                addEventListener: (evt, cb) => {
                    if (!domElements[id].listeners) domElements[id].listeners = {};
                    domElements[id].listeners[evt] = cb;
                },
                value: '',
                textContent: ''
            };
        }
        return domElements[id];
    }
};

global.chrome = {
    tabs: { query: (opts, cb) => cb([]) },
    runtime: {
        lastError: null,
        sendMessage: (msg, cb) => {
            // We simulate the background script failing to respond/being inactive
            // which sets chrome.runtime.lastError and triggers the fallback startDownloadLocal
            global.chrome.runtime.lastError = { message: "Extension context invalidated." };
            cb();
            global.chrome.runtime.lastError = null; // reset after callback execution
        }
    },
    downloads: {
        download: (opts, cb) => {}
    }
};

// Load script in global scope to trigger DOM setup (in a sandbox function to avoid global pollution)
const code = fs.readFileSync('popup.js', 'utf8');
(function() {
    eval(code);
})();

// Trigger DOM ready
if (documentListeners['DOMContentLoaded']) {
    documentListeners['DOMContentLoaded']();
}

// Setup elements
const urlInput = global.document.getElementById('urlInput');
const downloadBtn = global.document.getElementById('downloadBtn');
const statusMessage = global.document.getElementById('statusMessage');

// Test 1: startDownloadLocal success
console.log("Testing startDownloadLocal happy path...");
// Override chrome.downloads.download to simulate success
global.chrome.downloads.download = (options, cb) => {
    assert.strictEqual(options.url, 'https://cdn.pixeldrain.eu.cc/123456');
    assert.strictEqual(options.saveAs, true);
    global.chrome.runtime.lastError = null;
    cb(1); // Call the callback
};

urlInput.value = 'https://pixeldrain.com/u/123456';
if (downloadBtn.listeners && downloadBtn.listeners['click']) {
    downloadBtn.listeners['click']();
}

assert.strictEqual(statusMessage.textContent, 'Download triggered successfully!');
assert.ok(statusMessage.classList.contains('success'));
assert.ok(!statusMessage.classList.contains('error'));

// Test 2: startDownloadLocal error
console.log("Testing startDownloadLocal error path...");
global.chrome.downloads.download = (options, cb) => {
    assert.strictEqual(options.url, 'https://cdn.pixeldrain.eu.cc/abcdef');
    assert.strictEqual(options.saveAs, true);
    global.chrome.runtime.lastError = { message: 'Network error' };
    cb(undefined);
    global.chrome.runtime.lastError = null;
};

urlInput.value = 'https://pixeldrain.com/u/abcdef';
if (downloadBtn.listeners && downloadBtn.listeners['click']) {
    downloadBtn.listeners['click']();
}

assert.strictEqual(statusMessage.textContent, 'Download failed: Network error');
assert.ok(statusMessage.classList.contains('error'));
assert.ok(!statusMessage.classList.contains('success'));

console.log("All tests passed!");
