 code-health-background-sender-10225511226211049279
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {

 security-fix-download-url-12049799775616747561
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
main
 main
    if (request.action === 'startDownload' && request.url) {
        if (!request.url.startsWith('https://cdn.pixeldrain.eu.cc/')) {
            console.error("Security violation: Invalid download URL origin");
            sendResponse({ success: false, error: "Invalid download URL origin" });
            return true;
        }

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
