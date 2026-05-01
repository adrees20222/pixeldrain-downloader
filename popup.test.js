const fs = require('fs');
const assert = require('assert');

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

// Load script
const code = fs.readFileSync('popup.js', 'utf8');
eval(code);

// Trigger DOM ready
documentListeners['DOMContentLoaded']();

// Setup elements
const urlInput = document.getElementById('urlInput');
const downloadBtn = document.getElementById('downloadBtn');
const statusMessage = document.getElementById('statusMessage');

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
downloadBtn.listeners['click']();

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
downloadBtn.listeners['click']();

assert.strictEqual(statusMessage.textContent, 'Download failed: Network error');
assert.ok(statusMessage.classList.contains('error'));
assert.ok(!statusMessage.classList.contains('success'));

console.log("All tests passed!");
