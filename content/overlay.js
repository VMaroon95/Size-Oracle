/**
 * Size-Oracle — Overlay UI
 * Native Chrome UI with floating action button and price-point badge
 */

window.SizeOracle = window.SizeOracle || {};

(() => {
  'use strict';

  let fabEl = null;
  let priceBadgeEl = null;
  let setupBadgeEl = null;
  let currentResult = null;
  let isSetupComplete = false;

  // --- Initialization ---

  async function init() {
    await sleep(1000);

    const profile = await getProfile();
    isSetupComplete = profile && Object.keys(profile).length > 0;
    
    if (!isSetupComplete) {
      renderSetupBadge();
      return;
    }

    const sizeData = await window.SizeOracle.detectSizeChart?.();
    const result = window.SizeOracle.findBestSize?.(profile, sizeData);

    if (!result) return;

    currentResult = result;
    renderFAB(result);
    renderPriceBadge(result);
    enhanceSizeSelector(result, sizeData);
    updateBackgroundBadge(result.confidence);
    saveToCacheAndHistory(result);
  }

  // --- Profile & Communication ---

  async function getProfile() {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ type: 'GET_PROFILE' }, resp => {
        resolve(resp?.profile ?? null);
      });
    });
  }

  function updateBackgroundBadge(confidence) {
    chrome.runtime.sendMessage({
      type: 'UPDATE_BADGE',
      confidence: Math.round(confidence)
    });
  }

  async function saveToCacheAndHistory(result) {
    chrome.runtime.sendMessage({
      type: 'CACHE_RESULT',
      result: {
        ...result,
        url: window.location.href,
        timestamp: Date.now()
      }
    });
  }

  // --- Floating Action Button (FAB) ---

  function renderFAB(result) {
    cleanupUI();
    
    fabEl = document.createElement('button');
    fabEl.className = 'so-fab';
    fabEl.innerHTML = `
      <div class="so-fab-size">${result.size}</div>
      <div class="so-fab-confidence">${Math.round(result.confidence)}%</div>
    `;
    
    fabEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openExtension();
    });

    document.body.appendChild(fabEl);
  }

  // --- Price Point Badge ---

  function renderPriceBadge(result) {
    const priceSelectors = [
      '[data-testid="price"]',
      '.price',
      '.current-price',
      '.sale-price',
      '.product-price',
      '[class*="price"]',
      '[id*="price"]'
    ];

    let priceElement = null;
    for (const selector of priceSelectors) {
      priceElement = document.querySelector(selector);
      if (priceElement && priceElement.textContent.match(/[\$£€¥₹]/)) {
        break;
      }
    }

    if (!priceElement) return;

    priceBadgeEl = document.createElement('span');
    priceBadgeEl.className = 'so-price-badge';
    priceBadgeEl.textContent = `(${result.size}) ${Math.round(result.confidence)}%`;
    priceBadgeEl.title = `Size-Oracle: ${result.size} with ${Math.round(result.confidence)}% confidence`;

    // Insert after the price element
    priceElement.parentNode.insertBefore(priceBadgeEl, priceElement.nextSibling);
  }

  // --- Setup Badge ---

  function renderSetupBadge() {
    cleanupUI();
    
    setupBadgeEl = document.createElement('div');
    setupBadgeEl.className = 'so-setup-badge';
    setupBadgeEl.textContent = '⚙️ Set Up Size-Oracle';
    setupBadgeEl.title = 'Click to configure your measurements';
    
    setupBadgeEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openExtension();
    });

    document.body.appendChild(setupBadgeEl);
  }

  // --- Size Selector Enhancement ---

  function enhanceSizeSelector(result, sizeData) {
    if (!sizeData?.sizes) return;

    const sizeButtons = document.querySelectorAll(
      'button[class*="size"], .size-option, [data-size], .size-selector button, .size-btn'
    );

    sizeButtons.forEach(btn => {
      const sizeText = btn.textContent.trim().toUpperCase();
      const matchedSize = sizeData.sizes.find(s => 
        s.size?.toUpperCase() === sizeText || 
        s.label?.toUpperCase() === sizeText
      );

      if (matchedSize) {
        btn.classList.add('so-size-option');
        
        // Calculate confidence for this specific size
        const confidence = calculateSizeConfidence(matchedSize, result);
        btn.setAttribute('data-confidence', `${Math.round(confidence)}%`);
        
        // Highlight recommended size
        if (sizeText === result.size.toUpperCase()) {
          btn.classList.add('so-size-option--recommended');
        }
      }
    });
  }

  function calculateSizeConfidence(sizeData, originalResult) {
    // Simplified confidence calculation - in real implementation, 
    // this would use the same logic as the main size detection
    if (!sizeData.chest) return originalResult.confidence;
    
    const profile = currentResult.profile;
    if (!profile?.chest) return originalResult.confidence;
    
    const chestRange = sizeData.chest;
    const userChest = profile.chest;
    
    // Calculate how close user measurement is to size range median
    const rangeMedian = (chestRange.min + chestRange.max) / 2;
    const rangeWidth = chestRange.max - chestRange.min;
    const distance = Math.abs(userChest - rangeMedian);
    
    // Convert distance to confidence percentage
    const maxDistance = rangeWidth * 1.5; // Allow some flexibility beyond range
    const confidence = Math.max(0, 100 - (distance / maxDistance) * 100);
    
    return Math.min(100, confidence);
  }

  // --- Utilities ---

  function cleanupUI() {
    [fabEl, priceBadgeEl, setupBadgeEl].forEach(el => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    fabEl = priceBadgeEl = setupBadgeEl = null;
  }

  function openExtension() {
    chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --- State Management ---

  // Listen for profile updates to hide setup badge
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PROFILE_UPDATED') {
      isSetupComplete = true;
      if (setupBadgeEl) {
        cleanupUI();
        init(); // Re-initialize with new profile
      }
    } else if (message.type === 'SIZE_CHANGED') {
      // Handle dynamic size changes from enhanced size selector
      if (currentResult && message.size) {
        const updatedResult = {
          ...currentResult,
          size: message.size,
          confidence: message.confidence || currentResult.confidence
        };
        
        // Update FAB display
        if (fabEl) {
          const sizeEl = fabEl.querySelector('.so-fab-size');
          const confidenceEl = fabEl.querySelector('.so-fab-confidence');
          if (sizeEl) sizeEl.textContent = updatedResult.size;
          if (confidenceEl) confidenceEl.textContent = `${Math.round(updatedResult.confidence)}%`;
        }
        
        // Update price badge
        if (priceBadgeEl) {
          priceBadgeEl.textContent = `(${updatedResult.size}) ${Math.round(updatedResult.confidence)}%`;
        }
        
        currentResult = updatedResult;
        updateBackgroundBadge(updatedResult.confidence);
      }
    }
  });

  // --- Page Change Detection ---

  // Handle SPA navigation and dynamic content changes
  let lastUrl = window.location.href;
  const observer = new MutationObserver((mutations) => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      setTimeout(init, 1000); // Re-initialize on navigation
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // --- Initialize ---

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  if (typeof window !== 'undefined') {
    window.SizeOracle.overlay = {
      init,
      renderFAB,
      renderPriceBadge,
      renderSetupBadge,
      cleanupUI
    };
  }
})();