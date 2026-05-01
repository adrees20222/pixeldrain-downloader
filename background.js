chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'startDownload' && request.url) {
        chrome.downloads.download({
            url: request.url,
            saveAs: true // Prompts the user where to save, or uses default behavior 
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error("Download failed:", chrome.runtime.lastError.message);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                console.log("Download started with ID:", downloadId);
                sendResponse({ success: true, downloadId: downloadId });
            }
        });
        return true; // Keep message channel open for async response
    }
});
