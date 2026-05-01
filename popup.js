const PIXELDRAIN_URL_REGEX = /pixeldrain\.com\/u\/([a-zA-Z0-9_-]+)/;
const PIXELDRAIN_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

function extractPixeldrainId(url) {
    if (!url) return null;
    const match = url.match(PIXELDRAIN_URL_REGEX);
    if (match && match[1]) {
        return match[1];
    } else if (PIXELDRAIN_ID_REGEX.test(url)) {
        return url;
    }
    return null;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { extractPixeldrainId, PIXELDRAIN_URL_REGEX, PIXELDRAIN_ID_REGEX };
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const urlInput = document.getElementById('urlInput');
        const downloadBtn = document.getElementById('downloadBtn');
        const statusMessage = document.getElementById('statusMessage');

        // Optionally auto-detect pixeldrain URLs in clipboard or current tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url && tabs[0].url.includes('pixeldrain.com/u/')) {
                urlInput.value = tabs[0].url;
            }
        });

        downloadBtn.addEventListener('click', () => {
            statusMessage.classList.add('hidden');
            statusMessage.classList.remove('error', 'success');

            let url = urlInput.value.trim();

            if (!url) {
                showStatus('Please enter a Pixeldrain URL.', 'error');
                return;
            }

            const fileId = extractPixeldrainId(url);

            if (!fileId) {
                showStatus('Invalid Pixeldrain URL format.', 'error');
                return;
            }

            const downloadUrl = `https://cdn.pixeldrain.eu.cc/${fileId}`;
        
        showStatus('Starting download...', 'success');

        // Send message to background script to run the download so it doesn't get cut off if popup closes
        chrome.runtime.sendMessage({ action: 'startDownload', url: downloadUrl }, (response) => {
            if (chrome.runtime.lastError) {
                // Background script might be inactive, fallback to popup-side download
                startDownloadLocal(downloadUrl);
            } else if (response && response.success) {
                showStatus('Download triggered successfully!', 'success');
            } else {
                showStatus('Failed to start download.', 'error');
            }
        });
    });

    function showStatus(text, type) {
        statusMessage.textContent = text;
        statusMessage.classList.remove('hidden', 'error', 'success');
        statusMessage.classList.add(type);
    }

        function startDownloadLocal(url) {
            chrome.downloads.download({
                url: url,
                saveAs: true
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    showStatus('Download failed: ' + chrome.runtime.lastError.message, 'error');
                } else {
                    showStatus('Download triggered successfully!', 'success');
                }
            });
        }
    });
}
