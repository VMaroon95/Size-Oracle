/**
 * Size-Oracle — Overlay UI
 * Renders a floating badge near the "Add to Cart" button
 * with size recommendation and expandable detail panel.
 */

window.SizeOracle = window.SizeOracle || {};

(() => {
  'use strict';

  // Common "Add to Cart" button selectors across retailers
  const ADD_TO_CART_SELECTORS = [
    'button[data-testid*="add-to-bag"]',
    'button[data-testid*="add-to-cart"]',
    'button[class*="add-to-cart"]',
    'button[class*="addToCart"]',
    'button[class*="AddToBag"]',
    'button[class*="add-to-bag"]',
    '[class*="add-to-cart"] button',
    '#addToCart',
    '#add-to-cart',
    '.product-add-to-cart button',
    'button[name="add"]',
    'button[aria-label*="Add to"]',
    'button[aria-label*="add to"]',
  ];

  let badgeElement = null;
  let panelElement = null;
  let isExpanded = false;

  /**
   * Initialize the overlay: fetch profile, detect sizes, render badge.
   */
  async function init() {
    // Small delay to let page content fully render
    await sleep(1500);

    const profile = await getProfile();
    const sizeChart = window.SizeOracle.detectSizeChart?.();

    if (!profile) {
      renderBadge(null, null);
      return;
    }

    if (!sizeChart) {
      // No size chart found — don't show anything intrusive
      return;
    }

    const results = window.SizeOracle.findBestSize?.(profile, sizeChart);
    if (results?.length) {
      renderBadge(results[0], results);
      updateBackgroundBadge(results[0].confidence);
    }
  }

  /**
   * Fetch user profile from chrome.storage via background script.
   */
  async function getProfile() {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ type: 'GET_PROFILE' }, response => {
        resolve(response?.profile ?? null);
      });
    });
  }

  /**
   * Notify the background script of the confidence level for badge coloring.
   */
  function updateBackgroundBadge(confidence) {
    chrome.runtime.sendMessage({
      type: 'UPDATE_CONFIDENCE',
      confidence,
    });
  }

  /**
   * Find the "Add to Cart" button on the page.
   */
  function findCartButton() {
    for (const selector of ADD_TO_CART_SELECTORS) {
      const btn = document.querySelector(selector);
      if (btn) return btn;
    }
    // Fallback: search for buttons with "add to" text
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const text = btn.textContent.toLowerCase();
      if (text.includes('add to cart') || text.includes('add to bag') || text.includes('add to basket')) {
        return btn;
      }
    }
    return null;
  }

  /**
   * Render the floating badge.
   * @param {Object|null} topResult - Best size match, or null if no profile.
   * @param {Array|null} allResults - All size matches.
   */
  function renderBadge(topResult, allResults) {
    // Remove existing badge if present
    badgeElement?.remove();
    panelElement?.remove();

    // Create badge
    badgeElement = document.createElement('div');
    badgeElement.className = 'size-oracle-badge';

    if (!topResult) {
      // No profile saved
      badgeElement.innerHTML = '🔮 Set up Size-Oracle';
      badgeElement.classList.add('size-oracle-badge--setup');
      badgeElement.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
      });
    } else {
      const conf = topResult.confidence;
      const colorClass = conf > 80 ? 'green' : conf >= 60 ? 'yellow' : 'red';
      badgeElement.innerHTML = `🔮 Your Size: <strong>${topResult.size}</strong> (${conf}%)`;
      badgeElement.classList.add(`size-oracle-badge--${colorClass}`);
      badgeElement.addEventListener('click', () => togglePanel(topResult, allResults));
    }

    // Position near the cart button, or float in bottom-right
    const cartBtn = findCartButton();
    if (cartBtn) {
      cartBtn.parentElement?.style && (cartBtn.parentElement.style.position = 'relative');
      badgeElement.classList.add('size-oracle-badge--anchored');
      cartBtn.parentElement?.insertBefore(badgeElement, cartBtn.nextSibling);
    } else {
      badgeElement.classList.add('size-oracle-badge--floating');
      document.body.appendChild(badgeElement);
    }
  }

  /**
   * Toggle the expanded detail panel.
   */
  function togglePanel(topResult, allResults) {
    if (isExpanded) {
      panelElement?.remove();
      panelElement = null;
      isExpanded = false;
      return;
    }

    panelElement = document.createElement('div');
    panelElement.className = 'size-oracle-panel';

    const top3 = allResults.slice(0, 3);
    const conf = topResult.confidence;
    const colorClass = conf > 80 ? 'green' : conf >= 60 ? 'yellow' : 'red';

    panelElement.innerHTML = `
      <div class="size-oracle-panel-header">
        <span class="size-oracle-panel-title">🔮 Size-Oracle Recommendation</span>
        <button class="size-oracle-panel-close">&times;</button>
      </div>

      <div class="size-oracle-panel-main">
        <div class="size-oracle-recommended">
          <span class="size-oracle-recommended-size">${topResult.size}</span>
          <span class="size-oracle-recommended-conf size-oracle-conf--${colorClass}">${conf}% match</span>
        </div>

        <div class="size-oracle-breakdown">
          <h4>Fit Breakdown</h4>
          ${Object.entries(topResult.breakdown)
            .filter(([, v]) => v.score !== null)
            .map(([key, val]) => `
              <div class="size-oracle-breakdown-row">
                <span>${val.icon} ${capitalize(key)}</span>
                <span class="size-oracle-breakdown-score">${val.score}% — ${val.label}</span>
              </div>
            `).join('')}
        </div>

        ${top3.length > 1 ? `
          <div class="size-oracle-alternatives">
            <h4>Top Matches</h4>
            ${top3.map((r, i) => `
              <div class="size-oracle-alt-row ${i === 0 ? 'size-oracle-alt-row--top' : ''}">
                <span>${i + 1}. ${r.size}</span>
                <span>${r.confidence}%</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="size-oracle-panel-footer">
          <p>Based on your saved measurements</p>
          <a href="#" class="size-oracle-update-link">Update measurements →</a>
        </div>
      </div>
    `;

    // Close button handler
    panelElement.querySelector('.size-oracle-panel-close')
      .addEventListener('click', (e) => {
        e.stopPropagation();
        togglePanel(topResult, allResults);
      });

    // Update link opens popup
    panelElement.querySelector('.size-oracle-update-link')
      .addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
      });

    // Insert panel after badge
    badgeElement?.after(panelElement);
    isExpanded = true;
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // --- Observe for dynamic content (SPAs) ---
  let initTimeout = null;
  const observer = new MutationObserver(() => {
    clearTimeout(initTimeout);
    initTimeout = setTimeout(() => {
      if (!badgeElement?.isConnected) {
        init();
      }
    }, 2000);
  });

  // Start
  init();
  observer.observe(document.body, { childList: true, subtree: true });
})();
