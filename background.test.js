const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

// Test Suite
function runTests() {
    console.log("Running background.js tests...");

    // Setup Mock Environment
    const listeners = [];
    const mockChrome = {
        runtime: {
            onMessage: {
                addListener: (callback) => {
                    listeners.push(callback);
                }
            },
            lastError: null
        },
        downloads: {
            download: null // Will be set in individual tests
        }
    };

    // Capture console output
    const mockConsole = {
        error: () => {},
        log: () => {}
    };

    const sandbox = { chrome: mockChrome, console: mockConsole };
    vm.createContext(sandbox);

    const code = fs.readFileSync('./background.js', 'utf8');
    vm.runInContext(code, sandbox);

    assert.strictEqual(listeners.length, 1, "Should have registered one listener");
    const messageListener = listeners[0];

    // Test 1: Download Error Handling
    (function testDownloadError() {
        mockChrome.runtime.lastError = { message: "Simulated network error" };
        mockChrome.downloads.download = (options, callback) => {
            assert.strictEqual(options.url, "https://example.com/video.mp4");
            assert.strictEqual(options.saveAs, true);
            // Simulate the callback
            callback(undefined);
        };

        let responseReceived = false;
        const sendResponse = (response) => {
            responseReceived = true;
            assert.strictEqual(response.success, false);
            assert.strictEqual(response.error, "Simulated network error");
        };

        const result = messageListener(
            { action: 'startDownload', url: "https://example.com/video.mp4" },
            {}, // sender
            sendResponse
        );

        assert.strictEqual(result, true, "Should return true for async response");
        assert.strictEqual(responseReceived, true, "sendResponse should have been called");
        console.log("✅ testDownloadError passed");
    })();

    // Test 2: Successful Download
    (function testDownloadSuccess() {
        mockChrome.runtime.lastError = null;
        mockChrome.downloads.download = (options, callback) => {
            assert.strictEqual(options.url, "https://example.com/video2.mp4");
            assert.strictEqual(options.saveAs, true);
            // Simulate the callback with a download ID
            callback(12345);
        };

        let responseReceived = false;
        const sendResponse = (response) => {
            responseReceived = true;
            assert.strictEqual(response.success, true);
            assert.strictEqual(response.downloadId, 12345);
        };

        const result = messageListener(
            { action: 'startDownload', url: "https://example.com/video2.mp4" },
            {}, // sender
            sendResponse
        );

        assert.strictEqual(result, true, "Should return true for async response");
        assert.strictEqual(responseReceived, true, "sendResponse should have been called");
        console.log("✅ testDownloadSuccess passed");
    })();

    console.log("All tests passed!");
}

runTests();
