chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "startDownload" && request.url) {
    if (!request.url.startsWith("https://cdn.pixeldrain.eu.cc/")) {
      console.error("Security violation: Invalid download URL origin");
      sendResponse({ success: false, error: "Invalid download URL origin" });
      return true;
    }

    // To fix the issue where it sometimes downloads a .json error file,
    // we first trigger a HEAD request to the origin URL to "wake up" the file,
    // before starting the actual download from the CDN.

    // Extract the file ID from the CDN URL
    let fileId = null;
    try {
      const urlObj = new URL(request.url);
      // Path should be like /kzAiA1Nh
      fileId = urlObj.pathname.split("/")[1];
    } catch (e) {
      console.error("Invalid URL format:", e);
    }

    if (fileId && typeof fetch !== "undefined") {
      // Waking up the file on the original server
      const originApiUrl = `https://pixeldrain.com/api/file/${fileId}`;

      fetch(originApiUrl, { method: "HEAD" })
        .then(() => {
          // Send request to CDN to check if it returns 200 or 404 (JSON)
          return fetch(request.url, { method: "HEAD" });
        })
        .then((cdnResponse) => {
          if (!cdnResponse.ok) {
            // If CDN is still not ready, fallback to downloading from original pixeldrain
            console.warn(
              `CDN returned ${cdnResponse.status}, falling back to origin`,
            );
            startRealDownload(
              `https://pixeldrain.com/api/file/${fileId}?download`,
              sendResponse,
            );
          } else {
            startRealDownload(request.url, sendResponse);
          }
        })
        .catch((err) => {
          console.error(
            "Wake-up request failed, continuing with CDN anyway:",
            err,
          );
          startRealDownload(request.url, sendResponse);
        });
    } else {
      // Fallback for tests (where fetch might be undefined) or invalid URL
      startRealDownload(request.url, sendResponse);
    }

    return true; // Keep message channel open for async response
  }
});

function startRealDownload(url, sendResponse) {
  chrome.downloads.download(
    {
      url: url,
      saveAs: true, // Prompts the user where to save, or uses default behavior
    },
    (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error("Download failed:", chrome.runtime.lastError.message);
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
      } else {
        console.log("Download started with ID:", downloadId);
        sendResponse({ success: true, downloadId: downloadId });
      }
    },
  );
}
