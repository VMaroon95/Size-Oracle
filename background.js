/**
 * Size-Oracle — Background Service Worker v2.0
 * Handles messaging, caching, feedback tracking, and badge updates.
 */

// --- Message Router ---

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_PROFILE':
      handleGetProfile(sendResponse);
      return true;

    case 'GET_PROFILES':
      handleGetProfiles(sendResponse);
      return true;

    case 'UPDATE_CONFIDENCE':
      updateBadge(message.confidence, sender.tab?.id);
      break;

    case 'OPEN_POPUP':
      chrome.action.openPopup?.().catch(() => {
        chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
      });
      break;

    case 'SAVE_RECOMMENDATION':
      saveRecommendation(message.entry);
      break;

    case 'SAVE_FEEDBACK':
      saveFeedback(message.feedback);
      break;

    case 'GET_HISTORY':
      getHistory(sendResponse);
      return true;

    case 'GET_CACHED_CHART':
      getCachedChart(message.domain, sendResponse);
      return true;

    case 'CACHE_CHART':
      cacheChart(message.domain, message.chart);
      break;

    case 'SIZE_CHART_DETECTED':
      handleSizeChartDetection(message.sizeChart, sender);
      break;

    case 'PROFILE_UPDATED':
      // Forward profile update to content script
      forwardToContentScript(sender.tab?.id, message);
      break;

    case 'SIZE_CHANGED':
      // Forward size change to content script 
      forwardToContentScript(sender.tab?.id, message);
      break;

    case 'UPDATE_BADGE':
      updateBadge(message.confidence, sender.tab?.id);
      break;

    case 'CACHE_RESULT':
      cacheResult(message.result);
      break;

    // v2.0: Handle getSizeChart requests from popup
    case 'getSizeChart':
      requestSizeChartFromTab(sender.tab?.id, sendResponse);
      return true;
  }
});

// --- Profile ---

async function handleGetProfile(sendResponse) {
  try {
    const data = await chrome.storage.local.get('sizeOracleProfile');
    sendResponse({ profile: data?.sizeOracleProfile ?? null });
  } catch (err) {
    console.error('[Size-Oracle] Error fetching profile:', err);
    sendResponse({ profile: null });
  }
}

async function handleGetProfiles(sendResponse) {
  try {
    const data = await chrome.storage.local.get('sizeOracleProfiles');
    sendResponse({ profiles: data?.sizeOracleProfiles ?? {} });
  } catch (err) {
    console.error('[Size-Oracle] Error fetching profiles:', err);
    sendResponse({ profiles: {} });
  }
}

// --- Badge ---

function updateBadge(confidence, tabId) {
  if (tabId == null) return;

  let color, text;
  if (confidence >= 80) {
    color = '#2ecc71';
    text = '✓';
  } else if (confidence >= 60) {
    color = '#f1c40f';
    text = '~';
  } else {
    color = '#e74c3c';
    text = '!';
  }

  chrome.action.setBadgeBackgroundColor({ color, tabId });
  chrome.action.setBadgeText({ text, tabId });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ text: '', tabId });
  }
});

// --- Recommendation History ---

async function saveRecommendation(entry) {
  try {
    const data = await chrome.storage.local.get('sizeOracleHistory');
    const history = data?.sizeOracleHistory || [];
    history.unshift(entry);
    // Keep last 50
    await chrome.storage.local.set({
      sizeOracleHistory: history.slice(0, 50),
    });
  } catch (err) {
    console.error('[Size-Oracle] Error saving history:', err);
  }
}

async function getHistory(sendResponse) {
  try {
    const data = await chrome.storage.local.get('sizeOracleHistory');
    sendResponse({ history: data?.sizeOracleHistory || [] });
  } catch {
    sendResponse({ history: [] });
  }
}

// --- Feedback ---

async function saveFeedback(feedback) {
  try {
    const data = await chrome.storage.local.get('sizeOracleFeedback');
    const feedbackList = data?.sizeOracleFeedback || [];
    feedbackList.unshift(feedback);
    await chrome.storage.local.set({
      sizeOracleFeedback: feedbackList.slice(0, 100),
    });
  } catch (err) {
    console.error('[Size-Oracle] Error saving feedback:', err);
  }
}

// --- Size Chart Caching ---

async function cacheChart(domain, chart) {
  try {
    const data = await chrome.storage.local.get('sizeOracleCache');
    const cache = data?.sizeOracleCache || {};
    cache[domain] = { chart, timestamp: Date.now() };

    // Prune old entries (older than 7 days)
    const week = 7 * 24 * 60 * 60 * 1000;
    for (const [key, val] of Object.entries(cache)) {
      if (Date.now() - val.timestamp > week) delete cache[key];
    }

    await chrome.storage.local.set({ sizeOracleCache: cache });
  } catch (err) {
    console.error('[Size-Oracle] Error caching chart:', err);
  }
}

async function getCachedChart(domain, sendResponse) {
  try {
    const data = await chrome.storage.local.get('sizeOracleCache');
    const cached = data?.sizeOracleCache?.[domain];
    const week = 7 * 24 * 60 * 60 * 1000;
    if (cached && Date.now() - cached.timestamp < week) {
      sendResponse({ chart: cached.chart });
    } else {
      sendResponse({ chart: null });
    }
  } catch {
    sendResponse({ chart: null });
  }
}

// --- v2.0: Auto-Detection Handlers ---

function handleSizeChartDetection(sizeChart, sender) {
  // Cache the detected size chart
  if (sizeChart && sender.tab) {
    const domain = new URL(sender.tab.url).hostname;
    cacheChart(domain, sizeChart);
  }
}

function requestSizeChartFromTab(tabId, sendResponse) {
  if (!tabId) {
    sendResponse({ sizeChart: null });
    return;
  }

  // Request size chart from content script
  chrome.tabs.sendMessage(tabId, { action: 'detectSizeChart' }, (response) => {
    if (chrome.runtime.lastError) {
      sendResponse({ sizeChart: null });
    } else {
      sendResponse({ sizeChart: response?.sizeChart || null });
    }
  });
}

function forwardToContentScript(tabId, message) {
  if (!tabId) return;
  
  chrome.tabs.sendMessage(tabId, message).catch(() => {
    // Content script might not be loaded - that's okay
  });
}

async function cacheResult(result) {
  try {
    const data = await chrome.storage.local.get('sizeOracleHistory');
    const history = data.sizeOracleHistory || [];
    
    // Add to history
    history.unshift({
      ...result,
      id: Date.now(),
      timestamp: result.timestamp || Date.now()
    });
    
    // Keep only last 100 entries
    if (history.length > 100) {
      history.splice(100);
    }
    
    await chrome.storage.local.set({ sizeOracleHistory: history });
  } catch (error) {
    console.error('Failed to cache result:', error);
  }
}
