/**
 * Size-Oracle — Background Service Worker
 * Handles messaging between content scripts and storage.
 * Updates the extension badge based on confidence level.
 */

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_PROFILE':
      handleGetProfile(sendResponse);
      return true; // async response

    case 'UPDATE_CONFIDENCE':
      handleConfidenceUpdate(message.confidence, sender.tab?.id);
      break;

    case 'OPEN_POPUP':
      // Open the popup programmatically (opens in new tab as fallback)
      chrome.action.openPopup?.().catch(() => {
        chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
      });
      break;
  }
});

/**
 * Retrieve the user's saved profile from storage.
 */
async function handleGetProfile(sendResponse) {
  try {
    const data = await chrome.storage.local.get('sizeOracleProfile');
    sendResponse({ profile: data?.sizeOracleProfile ?? null });
  } catch (err) {
    console.error('[Size-Oracle] Error fetching profile:', err);
    sendResponse({ profile: null });
  }
}

/**
 * Update the extension badge icon color based on match confidence.
 */
function handleConfidenceUpdate(confidence, tabId) {
  if (tabId == null) return;

  let color, text;
  if (confidence > 80) {
    color = '#2ecc71'; // green
    text = '✓';
  } else if (confidence >= 60) {
    color = '#f1c40f'; // yellow
    text = '~';
  } else {
    color = '#e74c3c'; // red
    text = '!';
  }

  chrome.action.setBadgeBackgroundColor({ color, tabId });
  chrome.action.setBadgeText({ text, tabId });
}

// Clear badge when navigating away
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ text: '', tabId });
  }
});
