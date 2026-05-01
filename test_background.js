const assert = require("node:assert");

let listener;
global.chrome = {
  runtime: {
    onMessage: {
      addListener: (cb) => {
        listener = cb;
      },
    },
    lastError: null,
  },
  downloads: {
    download: (options, cb) => {
      // Mock implementation to be replaced in individual tests
    },
  },
};

// Mock fetch for tests
global.fetch = () => Promise.resolve({ ok: true, status: 200 });

// Load background.js
require("./background.js");

async function runTests() {
  let passed = 0;
  let failed = 0;
  const tests = [
    {
      name: "Successful download",
      run: async () => {
        let downloadOptions = null;
        let sendResponseResult = null;

        chrome.downloads.download = (options, cb) => {
          downloadOptions = options;
          chrome.runtime.lastError = null;
          cb(12345);
        };

        const sendResponse = (response) => {
          sendResponseResult = response;
        };

        const result = listener(
          {
            action: "startDownload",
            url: "https://cdn.pixeldrain.eu.cc/example",
          },
          {},
          sendResponse,
        );

        // wait for async fetch to finish
        await new Promise((r) => setTimeout(r, 50));

        assert.strictEqual(
          result,
          true,
          "Should return true for async response",
        );
        assert.deepStrictEqual(downloadOptions, {
          url: "https://cdn.pixeldrain.eu.cc/example",
          saveAs: true,
        });
        assert.deepStrictEqual(sendResponseResult, {
          success: true,
          downloadId: 12345,
        });
      },
    },
    {
      name: "Failed download",
      run: async () => {
        let sendResponseResult = null;

        chrome.downloads.download = (options, cb) => {
          chrome.runtime.lastError = { message: "Network error" };
          cb(undefined);
        };

        const sendResponse = (response) => {
          sendResponseResult = response;
        };

        const result = listener(
          {
            action: "startDownload",
            url: "https://cdn.pixeldrain.eu.cc/example",
          },
          {},
          sendResponse,
        );

        // wait for async fetch to finish
        await new Promise((r) => setTimeout(r, 50));

        assert.strictEqual(
          result,
          true,
          "Should return true for async response",
        );
        assert.deepStrictEqual(sendResponseResult, {
          success: false,
          error: "Network error",
        });

        // Cleanup
        chrome.runtime.lastError = null;
      },
    },
    {
      name: "Ignored message - wrong action",
      run: async () => {
        const result = listener(
          {
            action: "otherAction",
            url: "https://cdn.pixeldrain.eu.cc/example",
          },
          {},
          () => {},
        );
        assert.strictEqual(
          result,
          undefined,
          "Should return undefined for ignored messages",
        );
      },
    },
    {
      name: "Ignored message - missing url",
      run: async () => {
        const result = listener({ action: "startDownload" }, {}, () => {});
        assert.strictEqual(
          result,
          undefined,
          "Should return undefined for ignored messages",
        );
      },
    },
  ];

  for (const test of tests) {
    try {
      await test.run();
      console.log(`✅ ${test.name}`);
      passed++;
    } catch (e) {
      console.error(`❌ ${test.name}`);
      console.error(e);
      failed++;
    }
  }

  console.log(`\nTests completed: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
