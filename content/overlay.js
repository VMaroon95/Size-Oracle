/**
 * Size-Oracle — Overlay UI v3.1
 * 
 * BEHAVIOR:
 * - Price badge: shows confidence for the CURRENTLY SELECTED size on the page
 * - FAB (bottom-right): ALWAYS shows the BEST matching size + highest confidence (never changes)
 * - FAB click: opens popup (measurement setup dashboard)
 */

window.SizeOracle = window.SizeOracle || {};

(() => {
  'use strict';

  let fabEl = null;
  let priceBadgeEl = null;
  let setupBadgeEl = null;
  let bestResult = null;       // The overall best match (never changes)
  let allResults = null;       // All size scores for lookup
  let isSetupComplete = false;
  let currentProfile = null;
  let lastSelectedSize = null;
  let sizeObserver = null;

  // --- Initialization ---

  function calculateScore(userValue, range) {
    if (!userValue || !range || range.length < 2) return 0;
    const median = (range[0] + range[1]) / 2;
    const distance = Math.abs(userValue - median);
    return Math.max(0, Math.min(100, Math.round(100 - distance * 14.5)));
  }

  function scoreAllSizes(profile, chart) {
    const results = [];
    for (const entry of chart) {
      let total = 0, count = 0;
      for (const field of ['chest', 'waist', 'hips', 'inseam']) {
        if (profile[field] && entry[field]) {
          total += calculateScore(profile[field], entry[field]);
          count++;
        }
      }
      const score = count > 0 ? Math.round(total / count) : 0;
      results.push({ size: entry.size, confidence: score });
    }
    results.sort((a, b) => b.confidence - a.confidence);
    return results;
  }

  async function init() {
    await sleep(1500);

    const profile = await getProfile();
    currentProfile = profile;
    isSetupComplete = profile && Object.keys(profile).length > 0;
    
    if (!isSetupComplete) {
      renderSetupBadge();
      return;
    }

    let result = null;
    let allSizeResults = null;

    // Try using the oracle engine first
    try {
      const sizeData = await window.SizeOracle.detectSizeChart?.();
      result = window.SizeOracle.findBestSize?.(profile, sizeData);
      if (result && result.allResults) {
        allSizeResults = result.allResults;
      }
    } catch (e) {
      console.log('[Size Oracle] Engine error, using fallback:', e);
    }

    // Fallback: calculate directly with universal sizes
    if (!result || !result.recommended) {
      const gender = profile.gender || 'mens';
      const chart = window.SizeOracle.universalSizes?.getChart?.(gender, 'tops');
      if (chart?.length) {
        allSizeResults = scoreAllSizes(profile, chart);
        if (allSizeResults.length > 0) {
          result = { recommended: allSizeResults[0].size, confidence: allSizeResults[0].confidence };
        }
      }
    }

    if (!result || !result.recommended) return;

    bestResult = result;
    allResults = allSizeResults || [{ size: result.recommended, confidence: result.confidence }];

    // FAB always shows best result
    renderFAB(bestResult);

    // Price badge shows score for currently selected size on page
    const selectedSize = detectSelectedSize();
    renderPriceBadgeForSize(selectedSize);

    updateBackgroundBadge(bestResult.confidence, bestResult.recommended);

    // Watch for size selection changes on the page
    watchSizeSelectors();
  }

  // --- Detect which size the user has selected on the page ---

  function detectSelectedSize() {
    // Amazon
    const amazonSelected = document.querySelector('#native_dropdown_selected_size_name .a-dropdown-prompt');
    if (amazonSelected) {
      const text = amazonSelected.textContent.trim();
      const match = text.match(/^(XXS|XS|S|M|L|XL|XXL|2XL|3XL|XXXL|X-Small|Small|Medium|Large|X-Large|XX-Large|3X-Large)/i);
      if (match) return normalizeSizeLabel(match[1]);
    }

    // Amazon size button grid
    const amazonSizeBtn = document.querySelector('#variation_size_name .selection');
    if (amazonSizeBtn) {
      return normalizeSizeLabel(amazonSizeBtn.textContent.trim());
    }

    // Amazon swatches
    const amazonSwatch = document.querySelector('.swatchSelect.selected .a-size-base, #variation_size_name .a-button-selected .a-button-text');
    if (amazonSwatch) {
      return normalizeSizeLabel(amazonSwatch.textContent.trim());
    }

    // Generic: selected/active size buttons
    const genericSelectors = [
      '.size-selector .selected',
      '.size-selector .active',
      '.size-options .selected',
      'button[class*="size"][aria-checked="true"]',
      'button[class*="size"].selected',
      'button[class*="size"].active',
      '[data-testid="size-selector"] .selected',
      '.size-btn.selected',
      '.size-button.active',
      '.size-chip--selected',
    ];

    for (const sel of genericSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        return normalizeSizeLabel(el.textContent.trim());
      }
    }

    return null;
  }

  function normalizeSizeLabel(raw) {
    if (!raw) return null;
    const cleaned = raw.replace(/\s+/g, ' ').trim().toUpperCase();
    const map = {
      'X-SMALL': 'XS', 'XSMALL': 'XS', 'EXTRA SMALL': 'XS',
      'SMALL': 'S',
      'MEDIUM': 'M',
      'LARGE': 'L',
      'X-LARGE': 'XL', 'XLARGE': 'XL', 'EXTRA LARGE': 'XL',
      'XX-LARGE': 'XXL', 'XXLARGE': 'XXL', '2XL': 'XXL', '2X-LARGE': 'XXL',
      '3X-LARGE': '3XL', 'XXXLARGE': '3XL', '3XL': '3XL', 'XXXL': '3XL',
    };
    return map[cleaned] || cleaned.replace(/[^A-Z0-9]/g, '');
  }

  // --- Watch for size changes on the page ---

  function watchSizeSelectors() {
    // Observe DOM mutations for size selection changes
    if (sizeObserver) sizeObserver.disconnect();

    sizeObserver = new MutationObserver(() => {
      const newSize = detectSelectedSize();
      if (newSize && newSize !== lastSelectedSize) {
        lastSelectedSize = newSize;
        renderPriceBadgeForSize(newSize);
      }
    });

    // Watch the entire product area for attribute/class changes
    const productArea = document.querySelector('#centerCol, #ppd, .product-detail, .pdp-main, main, [role="main"]') || document.body;
    sizeObserver.observe(productArea, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-checked', 'aria-selected'],
    });

    // Also listen for click events on size-related buttons
    document.addEventListener('click', (e) => {
      setTimeout(() => {
        const newSize = detectSelectedSize();
        if (newSize && newSize !== lastSelectedSize) {
          lastSelectedSize = newSize;
          renderPriceBadgeForSize(newSize);
        }
      }, 300);
    }, true);
  }

  // --- Render price badge for a specific selected size ---

  function renderPriceBadgeForSize(selectedSize) {
    // Remove old badge
    if (priceBadgeEl && priceBadgeEl.parentNode) {
      priceBadgeEl.parentNode.removeChild(priceBadgeEl);
      priceBadgeEl = null;
    }

    if (!allResults || !selectedSize) {
      // No selected size detected — show best result
      if (bestResult) renderPriceBadge(bestResult.recommended, bestResult.confidence);
      return;
    }

    // Find the score for the selected size
    const match = allResults.find(r => r.size.toUpperCase() === selectedSize.toUpperCase());
    if (match) {
      renderPriceBadge(match.size, match.confidence);
    } else {
      // Size not in our chart — still show it with "?"
      renderPriceBadge(selectedSize, null);
    }
  }

  function renderPriceBadge(size, confidence) {
    const priceSelectors = [
      // Amazon-specific
      '.a-price .a-offscreen',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '.priceToPay .a-offscreen',
      'span.a-price:not(.a-text-price) .a-offscreen',
      // Generic
      '[data-testid="price"]',
      '.price',
      '.current-price',
      '.sale-price',
      '.product-price',
      '[class*="price"]',
      '[id*="price"]',
    ];

    let priceElement = null;
    for (const selector of priceSelectors) {
      const candidates = document.querySelectorAll(selector);
      for (const el of candidates) {
        if (el.textContent.match(/[\$£€¥₹]/) && el.offsetParent !== null) {
          priceElement = el.closest('.a-price') || el;
          break;
        }
      }
      if (priceElement) break;
    }

    if (!priceElement) return;

    priceBadgeEl = document.createElement('div');
    priceBadgeEl.className = 'so-price-badge';

    if (confidence !== null) {
      priceBadgeEl.textContent = `Size Oracle: ${size} (${Math.round(confidence)}%)`;
      priceBadgeEl.title = `Size Oracle confidence for ${size}: ${Math.round(confidence)}%`;
    } else {
      priceBadgeEl.textContent = `Size Oracle: ${size}`;
      priceBadgeEl.title = `Size ${size} — no data available`;
    }

    // Insert after the price element's parent block
    const insertTarget = priceElement.closest('.a-section') || priceElement.parentNode;
    insertTarget.parentNode.insertBefore(priceBadgeEl, insertTarget.nextSibling);
  }

  // --- Profile & Communication ---

  async function getProfile() {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ type: 'GET_PROFILE' }, resp => {
        resolve(resp?.profile ?? null);
      });
    });
  }

  function updateBackgroundBadge(confidence, size = 'M') {
    chrome.runtime.sendMessage({
      type: 'UPDATE_BADGE',
      confidence: Math.round(confidence),
      size: size
    });
  }

  // --- Floating Action Button (FAB) ---
  // ALWAYS shows best result — never changes with page size selection

  function renderFAB(result) {
    if (fabEl && fabEl.parentNode) fabEl.parentNode.removeChild(fabEl);
    
    fabEl = document.createElement('button');
    fabEl.className = 'so-fab';
    const sizeLabel = result.recommended || result.size || '?';
    const confLabel = Math.round(result.confidence || 0);
    fabEl.innerHTML = `
      <div class="so-fab-size">${sizeLabel}</div>
      <div class="so-fab-confidence">${confLabel}%</div>
    `;
    
    fabEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openExtension();
    });

    document.body.appendChild(fabEl);
  }

  // --- Setup Badge ---

  function renderSetupBadge() {
    cleanupUI();
    
    setupBadgeEl = document.createElement('div');
    setupBadgeEl.className = 'so-setup-badge';
    setupBadgeEl.textContent = 'Set Up Size Oracle';
    setupBadgeEl.title = 'Click to configure your measurements';
    
    setupBadgeEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openExtension();
    });

    document.body.appendChild(setupBadgeEl);
  }

  // --- Utilities ---

  function cleanupUI() {
    [fabEl, priceBadgeEl, setupBadgeEl].forEach(el => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    fabEl = priceBadgeEl = setupBadgeEl = null;
  }

  function openExtension() {
    chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --- Listeners ---

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PROFILE_UPDATED') {
      isSetupComplete = true;
      cleanupUI();
      init();
    } else if (message.type === 'GET_SIZE_RESULT') {
      if (bestResult) {
        sendResponse({ size: bestResult.recommended, confidence: bestResult.confidence });
      } else {
        sendResponse(null);
      }
      return true;
    }
  });

  // --- Page Change Detection ---

  let lastUrl = window.location.href;
  const navObserver = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      setTimeout(init, 1000);
    }
  });

  navObserver.observe(document.body, { childList: true, subtree: true });

  // --- Initialize ---

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  if (typeof window !== 'undefined') {
    window.SizeOracle.overlay = { init, cleanupUI };
  }
})();
