/**
 * Size-Oracle — Overlay UI
 * Renders a confidence-boosting floating badge + expandable panel
 * that feels like a personal shopping assistant.
 */

window.SizeOracle = window.SizeOracle || {};

(() => {
  'use strict';

  let badgeEl = null;
  let panelEl = null;
  let isExpanded = false;
  let currentResult = null;

  // --- Initialization ---

  async function init() {
    await sleep(1500);

    const profile = await getProfile();
    if (!profile) {
      renderSetupBadge();
      return;
    }

    const sizeData = await window.SizeOracle.detectSizeChart?.();
    const result = window.SizeOracle.findBestSize?.(profile, sizeData);

    if (!result) return;

    currentResult = result;
    renderBadge(result);
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
    chrome.runtime.sendMessage({ type: 'UPDATE_CONFIDENCE', confidence });
  }

  function saveToCacheAndHistory(result) {
    const entry = {
      url: window.location.href,
      site: window.location.hostname,
      title: document.title.substring(0, 80),
      size: result.recommended,
      confidence: result.confidence,
      timestamp: Date.now(),
    };
    chrome.runtime.sendMessage({ type: 'SAVE_RECOMMENDATION', entry });
  }

  // --- Badge Rendering ---

  function renderSetupBadge() {
    cleanup();
    badgeEl = createElement('div', 'so-badge so-badge--setup so-badge--floating');
    badgeEl.innerHTML = '🔮 <span>Set up Size-Oracle</span>';
    badgeEl.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
    });
    document.body.appendChild(badgeEl);
  }

  function renderBadge(result) {
    cleanup();
    const conf = result.confidence;
    const tier = conf >= 80 ? 'high' : conf >= 60 ? 'medium' : 'low';

    badgeEl = createElement('div', `so-badge so-badge--${tier}`);
    badgeEl.innerHTML = `🔮 <span>Your size: <strong>${result.recommended}</strong> (${conf}% match)</span>`;
    badgeEl.addEventListener('click', () => togglePanel(result));

    // Try to anchor near size selector or cart button, else float
    const anchor = findAnchorElement();
    if (anchor) {
      const wrapper = anchor.closest('div, section, form') || anchor.parentElement;
      if (wrapper) {
        wrapper.style.position = wrapper.style.position || 'relative';
        badgeEl.classList.add('so-badge--anchored');
        anchor.after(badgeEl);
        return;
      }
    }

    badgeEl.classList.add('so-badge--floating');
    document.body.appendChild(badgeEl);
  }

  function findAnchorElement() {
    // Try size selector area first
    const sizeSelectors = [
      '[class*="size-selector"]', '[class*="sizeSelector"]',
      '[class*="size-list"]', '[class*="sizeList"]',
      '[class*="size-picker"]', 'select[name*="size" i]',
    ];
    for (const sel of sizeSelectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }

    // Then try add-to-cart
    const buttons = document.querySelectorAll('button, [role="button"]');
    for (const btn of buttons) {
      const text = btn.textContent.toLowerCase();
      if (text.includes('add to cart') || text.includes('add to bag') || text.includes('add to basket')) {
        return btn;
      }
    }
    return null;
  }

  // --- Panel Rendering ---

  function togglePanel(result) {
    if (isExpanded) {
      panelEl?.remove();
      panelEl = null;
      isExpanded = false;
      return;
    }

    const conf = result.confidence;
    const tier = conf >= 80 ? 'high' : conf >= 60 ? 'medium' : 'low';
    const riskColor = { low: '🟢', medium: '🟡', high: '🔴' }[result.returnRisk];
    const riskLabel = { low: 'Low return risk — this size should fit great', medium: 'Medium return risk — double-check measurements', high: 'Higher return risk — consider trying in-store' }[result.returnRisk];

    panelEl = createElement('div', 'so-panel');
    panelEl.innerHTML = `
      <div class="so-panel-header">
        <span class="so-panel-title">🔮 Size Oracle says...</span>
        <button class="so-panel-close" aria-label="Close">&times;</button>
      </div>
      <div class="so-panel-body">
        <div class="so-recommendation">
          <span class="so-rec-size">${result.recommended}</span>
          <div class="so-confidence-gauge">
            <div class="so-gauge-track">
              <div class="so-gauge-fill so-gauge-fill--${tier}" style="width: ${conf}%"></div>
            </div>
            <span class="so-gauge-label">${conf}% match</span>
          </div>
        </div>

        <p class="so-message">${result.message}</p>

        ${result.alternateMessage ? `<p class="so-alt-message">${result.alternateMessage}</p>` : ''}

        ${result.brandAdjustment ? `<div class="so-brand-note">ℹ️ ${result.brandAdjustment} — we've accounted for this</div>` : ''}

        <div class="so-breakdown">
          <h4>Fit Breakdown</h4>
          ${Object.entries(result.breakdown)
            .filter(([, v]) => v.score !== null)
            .map(([key, val]) => `
              <div class="so-breakdown-row">
                <span>${val.icon} ${capitalize(key)}</span>
                <span class="so-breakdown-val">${val.fit}</span>
              </div>
            `).join('')}
        </div>

        <div class="so-risk">${riskColor} ${riskLabel}</div>

        ${result.bodyShape !== 'Unknown' ? `<div class="so-shape">Body shape: <strong>${result.bodyShape}</strong></div>` : ''}

        <div class="so-panel-footer">
          <span class="so-footer-note">Based on your saved measurements</span>
          <div class="so-footer-actions">
            <a href="#" class="so-link so-link--update">Update measurements</a>
            <a href="#" class="so-link so-link--feedback">Not right? Tell us</a>
          </div>
        </div>
      </div>
    `;

    // Event listeners
    panelEl.querySelector('.so-panel-close').addEventListener('click', e => {
      e.stopPropagation();
      togglePanel(result);
    });

    panelEl.querySelector('.so-link--update').addEventListener('click', e => {
      e.preventDefault();
      chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
    });

    panelEl.querySelector('.so-link--feedback').addEventListener('click', e => {
      e.preventDefault();
      handleFeedback(result);
    });

    // Insert
    if (badgeEl?.isConnected) {
      badgeEl.after(panelEl);
    } else {
      panelEl.classList.add('so-panel--floating');
      document.body.appendChild(panelEl);
    }
    isExpanded = true;
  }

  // --- Size Selector Enhancement ---

  function enhanceSizeSelector(result, sizeData) {
    if (!sizeData?.sizeSelector && !sizeData?.availableSizes) return;

    const elements = sizeData.availableSizes || [];
    for (const item of elements) {
      if (!item.element) continue;

      // Normalize comparison
      const itemLabel = item.label.toUpperCase().trim();
      const recLabel = result.recommended.toUpperCase().trim();

      if (itemLabel === recLabel || itemLabel.includes(recLabel)) {
        // Add a green indicator dot
        const dot = createElement('span', 'so-rec-dot');
        dot.title = `🔮 Size Oracle recommends this size (${result.confidence}% match)`;
        item.element.style.position = item.element.style.position || 'relative';
        item.element.appendChild(dot);
      }
    }
  }

  // --- Feedback ---

  function handleFeedback(result) {
    const current = panelEl?.querySelector('.so-panel-body');
    if (!current) return;

    const feedbackHTML = `
      <div class="so-feedback">
        <h4>How did this size fit?</h4>
        <div class="so-feedback-options">
          <button class="so-feedback-btn" data-fit="too-small">Too Small</button>
          <button class="so-feedback-btn so-feedback-btn--active" data-fit="perfect">Perfect!</button>
          <button class="so-feedback-btn" data-fit="too-large">Too Large</button>
        </div>
      </div>
    `;

    const feedbackEl = createElement('div', '');
    feedbackEl.innerHTML = feedbackHTML;
    current.appendChild(feedbackEl);

    feedbackEl.querySelectorAll('.so-feedback-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const fit = btn.dataset.fit;
        chrome.runtime.sendMessage({
          type: 'SAVE_FEEDBACK',
          feedback: {
            site: window.location.hostname,
            size: result.recommended,
            fit,
            timestamp: Date.now(),
          },
        });
        feedbackEl.innerHTML = '<p class="so-feedback-thanks">Thanks! We\'ll use this to improve. 🙏</p>';
      });
    });
  }

  // --- Utilities ---

  function cleanup() {
    badgeEl?.remove();
    panelEl?.remove();
    badgeEl = null;
    panelEl = null;
    isExpanded = false;
  }

  function createElement(tag, className) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // --- SPA Observer ---

  let initTimeout = null;
  const observer = new MutationObserver(() => {
    clearTimeout(initTimeout);
    initTimeout = setTimeout(() => {
      if (!badgeEl?.isConnected) init();
    }, 2000);
  });

  init();
  observer.observe(document.body, { childList: true, subtree: true });
})();
