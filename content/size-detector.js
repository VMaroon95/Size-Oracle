/**
 * Size-Oracle v2.0 — Universal Size Chart Detector & Parser
 * Uses multiple strategies to find size data on ANY shopping site.
 *
 * Strategies (in priority order):
 *   A. Scan page tables for size-related keywords
 *   B. Find & open size guide links/modals
 *   C. Known site-specific patterns (fallback)
 *   D. Product page detection + size selector extraction
 *   E. JSON-LD / structured data extraction
 *   F. Universal sizing database fallback
 *
 * Exposes: window.SizeOracle.detectSizeChart()
 * Returns: { sizes, sizeSelector, confidence, source, garmentType }
 */

window.SizeOracle = window.SizeOracle || {};

(() => {
  'use strict';

  // --- Constants ---

  const SIZE_KEYWORDS = [
    'size', 'chest', 'bust', 'waist', 'hip', 'hips', 'inseam',
    'length', 'shoulder', 'sleeve', 'neck', 'thigh',
  ];

  const SIZE_LABELS = [
    'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL', '4XL', '5XL',
    '0', '2', '4', '6', '8', '10', '12', '14', '16', '18', '20', '22', '24',
    '00', '26', '27', '28', '29', '30', '31', '32', '33', '34', '36', '38', '40', '42', '44',
  ];

  const SIZE_GUIDE_TEXTS = [
    'size guide', 'size chart', 'sizing', 'find your size',
    'fit guide', 'measurement guide', 'size & fit', 'sizing guide',
    'size info', 'fit information', 'measurements', 'guía de tallas',
    'guide des tailles', 'größentabelle', 'tabella taglie',
  ];

  const COLUMN_MAP = {
    chest:  ['chest', 'bust', 'chest/bust', 'chest circumference', 'bust circumference', 'poitrine', 'brust'],
    waist:  ['waist', 'natural waist', 'waist circumference', 'taille', 'cintura'],
    hips:   ['hips', 'hip', 'seat', 'hip circumference', 'hanches', 'hüfte', 'cadera'],
    inseam: ['inseam', 'inside leg', 'leg length', 'inner leg', 'entrejambe'],
  };

  const ADD_TO_CART_PATTERNS = [
    'add to cart', 'add to bag', 'add to basket', 'buy now', 'purchase',
    'añadir al carrito', 'ajouter au panier', 'in den warenkorb',
    'add to trolley', 'comprar', 'acheter', 'kaufen',
  ];

  // Known site-specific selectors (expanded for v2.0)
  const SITE_PATTERNS = {
    'amazon': {
      sizeChart: ['#size-chart-content table', '#productDescription table', '.a-size-chart table'],
      sizeGuideBtn: ['#size-chart-link', 'a[href*="size"]'],
      sizeSelector: ['#native_dropdown_selected_size_name', '#variation_size_name select', '#variation_size_name .a-button-text'],
    },
    'shein': {
      sizeChart: ['.size-guide-modal table', '.size-chart-table', '.sui-dialog table'],
      sizeGuideBtn: ['.product-intro__size-guide', '.j-size-guide', '[class*="size-guide"]'],
      sizeSelector: ['.product-intro__size-radio-inner', '.product-intro__size-choose'],
    },
    'temu': {
      sizeChart: ['.size-chart table', '[class*="SizeChart"] table'],
      sizeGuideBtn: ['[class*="size-guide"]', '[class*="SizeGuide"]'],
      sizeSelector: ['.product-sku-size', '[class*="sku-size"]'],
    },
    'zara': {
      sizeChart: ['.size-guide-table', '.product-size-guide table', '[class*="size-guide"] table'],
      sizeGuideBtn: ['.size-guide-link', '[class*="SizeGuide"]', 'button[class*="size-guide"]'],
      sizeSelector: ['.product-detail-size-selector__size-list li', '.size-selector__size-list button'],
    },
    'hm': {
      sizeChart: ['.size-guide table', '.product-size-table', '[data-testid="size-guide"] table'],
      sizeGuideBtn: ['.size-guide-link', '[class*="sizeguide"]', 'a[href*="size-guide"]'],
      sizeSelector: ['.sizes-list li', '.product-input-label'],
    },
    'asos': {
      sizeChart: ['[data-testid="sizeguide"] table', '.size-guide-table table', '#sizeguide table'],
      sizeGuideBtn: ['[data-testid="sizeguide-link"]', 'a[href*="size-guide"]'],
      sizeSelector: ['[data-id="sizeSelect"] option', 'select[data-id="sizeSelect"]'],
    },
    'nike': {
      sizeChart: ['.size-chart-table table', '[class*="size-grid"] table'],
      sizeGuideBtn: ['[data-testid="size-guide-btn"]', 'a[href*="size-guide"]', '[class*="sizeGuide"]'],
      sizeSelector: ['[data-testid="availableSize"]', 'input[name="skuAndSize"]'],
    },
    'adidas': {
      sizeChart: ['[class*="size-chart"] table', '[class*="SizeChart"] table'],
      sizeGuideBtn: ['[class*="size-guide"]', '[data-testid="size-guide"]'],
      sizeSelector: ['[data-testid="size-selector"] button', '[class*="size-selector"] button'],
    },
    'nordstrom': {
      sizeChart: ['[class*="SizeChart"] table', '.size-chart table'],
      sizeGuideBtn: ['[class*="SizeChart"] button', 'button[class*="size-chart"]'],
      sizeSelector: ['[name="size"] option', '[class*="SizeSelector"] button'],
    },
    'uniqlo': {
      sizeChart: ['.size-chart table', '#sizeChartTable', '[class*="SizeChart"] table'],
      sizeGuideBtn: ['[class*="size-chart"]', '#sizeChartButton'],
      sizeSelector: ['[class*="chip-group"] button', '.size-picker button'],
    },
    'gap': {
      sizeChart: ['.sizeChart table', '[class*="size-chart"] table'],
      sizeGuideBtn: ['[class*="size-chart-link"]', 'a[href*="size-chart"]'],
      sizeSelector: ['.swatch-size button', '[data-testid="size-selector"] button'],
    },
    'levis': {
      sizeChart: ['.size-guide-table table', '[class*="SizeGuide"] table'],
      sizeGuideBtn: ['[class*="size-guide"]', '.size-guide-link'],
      sizeSelector: ['.size-selector button', '[data-testid="size-chip"]'],
    },
    'macys': {
      sizeChart: ['.size-chart table', '[class*="SizeChart"] table'],
      sizeGuideBtn: ['.size-chart-link', '[class*="size-chart"]'],
      sizeSelector: ['.size-selector button', '[data-testid="swatch-size"]'],
    },
    'walmart': {
      sizeChart: ['[class*="size-chart"] table'],
      sizeGuideBtn: ['[class*="size-chart"]'],
      sizeSelector: ['[data-testid="variant-group-size"] button'],
    },
    'target': {
      sizeChart: ['[data-test="sizeChart"] table'],
      sizeGuideBtn: ['[data-test="sizeChartLink"]'],
      sizeSelector: ['[data-test="sizeButton"]'],
    },
    'boohoo': {
      sizeChart: ['.size-guide-modal table', '[class*="sizeGuide"] table'],
      sizeGuideBtn: ['.size-guide-link', '[class*="sizeGuide"]'],
      sizeSelector: ['.size-selector button', '[class*="SizeSelector"] button'],
    },
    'lululemon': {
      sizeChart: ['[class*="size-guide"] table', '.size-chart table'],
      sizeGuideBtn: ['[class*="size-guide"]'],
      sizeSelector: ['[data-lulu-test="size-swatch"] button', '[class*="SizeSelector"] button'],
    },
    'gymshark': {
      sizeChart: ['[class*="size-guide"] table'],
      sizeGuideBtn: ['[class*="size-guide"]'],
      sizeSelector: ['[class*="size-selector"] button'],
    },
    'revolve': {
      sizeChart: ['.size-chart table', '#sizeChart table'],
      sizeGuideBtn: ['.size-chart-link', '#sizeChartLink'],
      sizeSelector: ['[class*="size-selector"] button', 'select[name*="size"]'],
    },
    'farfetch': {
      sizeChart: ['[data-testid="sizeguide"] table', '[class*="SizeGuide"] table'],
      sizeGuideBtn: ['[data-testid="sizeguide-link"]'],
      sizeSelector: ['[data-testid="sizeSelector"] button'],
    },
    'ssense': {
      sizeChart: ['.size-guide table', '[class*="SizeGuide"] table'],
      sizeGuideBtn: ['.size-guide-link'],
      sizeSelector: ['[class*="size-selector"] button', 'select[name="size"]'],
    },
    'zalando': {
      sizeChart: ['[class*="size-table"] table', '[class*="SizeChart"] table'],
      sizeGuideBtn: ['[class*="size-advice"]', '[class*="SizeAdvice"]'],
      sizeSelector: ['[class*="size-picker"] button', 'select[name="size"]'],
    },
  };

  // --- Main Entry Point ---

  window.SizeOracle.detectSizeChart = async function detectSizeChart() {
    const hostname = window.location.hostname;

    // Strategy A: Scan visible tables
    const tableResult = scanTablesForSizeData();
    if (tableResult?.sizes?.length) {
      return { ...tableResult, confidence: 'high', source: 'table' };
    }

    // Strategy C: Known site patterns
    const siteResult = trySitePatterns(hostname);
    if (siteResult?.sizes?.length) {
      return { ...siteResult, confidence: 'high', source: 'table' };
    }

    // Strategy E: JSON-LD / structured data
    const structuredResult = extractStructuredData();
    if (structuredResult?.sizes?.length) {
      return { ...structuredResult, confidence: 'medium', source: 'structured' };
    }

    // Strategy B: Find and parse size guide modals
    const modalResult = scanModalsAndOverlays();
    if (modalResult?.sizes?.length) {
      return { ...modalResult, confidence: 'medium', source: 'modal' };
    }

    // Strategy D: Detect product page and extract available sizes
    const selectorResult = detectSizeSelector();
    if (selectorResult) {
      return selectorResult;
    }

    // Strategy F: Fallback to universal sizing database
    const garmentType = detectGarmentType();
    return {
      sizes: null,
      sizeSelector: null,
      confidence: 'low',
      source: 'estimated',
      garmentType,
      sizeGuideLink: findSizeGuideLink(),
    };
  };

  // --- Strategy A: Table Scanning ---

  function scanTablesForSizeData() {
    const tables = document.querySelectorAll('table');
    for (const table of tables) {
      if (!isVisible(table)) continue;
      if (isSizeTable(table)) {
        const sizes = parseTable(table);
        if (sizes?.length) return { sizes };
      }
    }

    // Also check div-based "tables" (grid layouts)
    const divTables = document.querySelectorAll(
      '[class*="size-chart"], [class*="sizeChart"], [class*="size-guide"], [class*="sizeGuide"], [class*="sizing"], [class*="SizeChart"], [class*="SizeGuide"]'
    );
    for (const container of divTables) {
      const table = container.querySelector('table');
      if (table) {
        const sizes = parseTable(table);
        if (sizes?.length) return { sizes };
      }
      const gridSizes = parseGridLayout(container);
      if (gridSizes?.length) return { sizes: gridSizes };
    }

    return null;
  }

  function isSizeTable(table) {
    const text = table.textContent.toLowerCase();
    const hasKeywords = SIZE_KEYWORDS.some(kw => text.includes(kw));
    const hasSizeLabels = SIZE_LABELS.some(label => {
      const re = new RegExp(`\\b${label}\\b`, 'i');
      return re.test(text);
    });
    return hasKeywords && hasSizeLabels;
  }

  function parseTable(table) {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length < 2) return [];

    const vertical = parseVerticalTable(rows);
    if (vertical?.length) return vertical;

    const horizontal = parseHorizontalTable(rows);
    if (horizontal?.length) return horizontal;

    return [];
  }

  function parseVerticalTable(rows) {
    const headerCells = Array.from(rows[0].querySelectorAll('th, td'));
    const headers = headerCells.map(cell => cell.textContent.trim().toLowerCase());

    const columnIndices = {};
    let sizeIndex = -1;

    headers.forEach((header, i) => {
      if (/^(size|sizes|us\s*size|uk\s*size|eu\s*size|talla|taille|größe)$/i.test(header.trim())) {
        sizeIndex = i;
        return;
      }
      for (const [canonical, aliases] of Object.entries(COLUMN_MAP)) {
        if (aliases.some(alias => header.includes(alias))) {
          columnIndices[canonical] = i;
          break;
        }
      }
    });

    if (sizeIndex === -1) {
      const firstColVals = rows.slice(1).map(r => {
        const c = r.querySelector('th, td');
        return c?.textContent.trim().toUpperCase() ?? '';
      });
      if (firstColVals.some(v => SIZE_LABELS.includes(v) || /^\d{1,2}$/.test(v))) {
        sizeIndex = 0;
      }
    }

    if (sizeIndex === -1 || Object.keys(columnIndices).length === 0) return [];

    const results = [];
    for (let i = 1; i < rows.length; i++) {
      const cells = Array.from(rows[i].querySelectorAll('th, td')).map(c => c.textContent.trim());
      if (cells.length <= sizeIndex) continue;
      const sizeName = cells[sizeIndex];
      if (!sizeName) continue;

      const entry = { size: sizeName };
      for (const [measurement, colIdx] of Object.entries(columnIndices)) {
        if (colIdx < cells.length) {
          entry[measurement] = parseRange(cells[colIdx]);
        }
      }
      if (Object.keys(entry).length > 1) results.push(entry);
    }
    return results;
  }

  function parseHorizontalTable(rows) {
    const firstRow = Array.from(rows[0].querySelectorAll('th, td')).map(c => c.textContent.trim());
    const sizeColumns = [];

    firstRow.forEach((val, i) => {
      if (i === 0) return;
      const upper = val.toUpperCase();
      if (SIZE_LABELS.includes(upper) || /^\d{1,2}$/.test(val)) {
        sizeColumns.push({ index: i, size: val });
      }
    });

    if (sizeColumns.length < 2) return [];

    const entries = sizeColumns.map(sc => ({ size: sc.size }));

    for (let r = 1; r < rows.length; r++) {
      const cells = Array.from(rows[r].querySelectorAll('th, td')).map(c => c.textContent.trim());
      if (cells.length === 0) continue;

      const rowLabel = cells[0].toLowerCase();
      let measurement = null;
      for (const [canonical, aliases] of Object.entries(COLUMN_MAP)) {
        if (aliases.some(alias => rowLabel.includes(alias))) {
          measurement = canonical;
          break;
        }
      }
      if (!measurement) continue;

      sizeColumns.forEach((sc, idx) => {
        if (sc.index < cells.length) {
          entries[idx][measurement] = parseRange(cells[sc.index]);
        }
      });
    }

    return entries.filter(e => Object.keys(e).length > 1);
  }

  function parseGridLayout(container) {
    const rows = container.querySelectorAll('[class*="row"], [class*="Row"], tr, dl, li');
    if (rows.length < 2) return null;

    const results = [];
    for (const row of rows) {
      const cells = row.querySelectorAll('[class*="cell"], [class*="Cell"], td, th, dd, dt, span');
      if (cells.length < 2) continue;

      const values = Array.from(cells).map(c => c.textContent.trim());
      const sizeVal = values.find(v => SIZE_LABELS.includes(v.toUpperCase()) || /^[A-Z]{1,4}$/.test(v));
      if (sizeVal) {
        const entry = { size: sizeVal };
        values.forEach(v => {
          if (v === sizeVal) return;
          const range = parseRange(v);
          if (range) {
            const avg = (range[0] + range[1]) / 2;
            if (!entry.chest && avg >= 30 && avg <= 56) entry.chest = range;
            else if (!entry.waist && avg >= 22 && avg <= 50) entry.waist = range;
            else if (!entry.hips && avg >= 30 && avg <= 56) entry.hips = range;
          }
        });
        if (Object.keys(entry).length > 1) results.push(entry);
      }
    }
    return results.length > 0 ? results : null;
  }

  // --- Strategy B: Modal/Overlay Scanning ---

  function scanModalsAndOverlays() {
    const modalSelectors = [
      '[class*="modal"] table', '[class*="Modal"] table',
      '[class*="overlay"] table', '[class*="Overlay"] table',
      '[class*="dialog"] table', '[class*="Dialog"] table',
      '[class*="popup"] table', '[class*="Popup"] table',
      '[role="dialog"] table', '[class*="drawer"] table',
      '[class*="Drawer"] table', '[class*="sheet"] table',
    ];

    for (const selector of modalSelectors) {
      const tables = document.querySelectorAll(selector);
      for (const table of tables) {
        if (isSizeTable(table)) {
          const sizes = parseTable(table);
          if (sizes?.length) return { sizes };
        }
      }
    }
    return null;
  }

  // --- Strategy C: Known Site Patterns ---

  function trySitePatterns(hostname) {
    for (const [domain, patterns] of Object.entries(SITE_PATTERNS)) {
      if (!hostname.includes(domain)) continue;

      for (const selector of patterns.sizeChart || []) {
        try {
          const tables = document.querySelectorAll(selector);
          for (const table of tables) {
            const sizes = parseTable(table);
            if (sizes?.length) return { sizes };
          }
        } catch { /* selector may be invalid */ }
      }
    }
    return null;
  }

  // --- Strategy D: Size Selector Detection ---

  function detectSizeSelector() {
    if (!isProductPage()) return null;

    const selectors = findSizeSelectorElements();
    const availableSizes = extractAvailableSizes(selectors);

    if (availableSizes.length > 0) {
      return {
        sizes: null,
        sizeSelector: selectors,
        availableSizes,
        confidence: 'low',
        source: 'selector',
        garmentType: detectGarmentType(),
      };
    }
    return null;
  }

  function isProductPage() {
    const pageText = document.body?.innerText?.toLowerCase() ?? '';
    const hasCartButton = ADD_TO_CART_PATTERNS.some(p => pageText.includes(p));
    const hasPrice = !!document.querySelector('[class*="price"], [class*="Price"], [data-testid*="price"], [itemprop="price"]');
    const hasProduct = !!document.querySelector('[itemtype*="Product"], [data-testid*="product"]');
    return hasCartButton || hasPrice || hasProduct;
  }

  function findSizeSelectorElements() {
    // Check known site patterns first
    const hostname = window.location.hostname;
    for (const [domain, patterns] of Object.entries(SITE_PATTERNS)) {
      if (!hostname.includes(domain)) continue;
      for (const selector of patterns.sizeSelector || []) {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) return Array.from(elements);
        } catch { /* */ }
      }
    }

    // Generic size selector patterns
    const selectorQueries = [
      'select[name*="size" i]', 'select[id*="size" i]',
      '[class*="size-selector"] button', '[class*="sizeSelector"] button',
      '[class*="size-list"] button', '[class*="sizeList"] button',
      '[class*="size-option"]', '[class*="sizeOption"]',
      '[class*="SizeSelector"] button', '[class*="SizeList"] button',
      '[data-testid*="size"] button', '[aria-label*="size" i]',
      'input[name*="size" i][type="radio"]',
      '[class*="size-picker"] button', '[class*="SizePicker"] button',
      '[class*="size-chip"]', '[class*="SizeChip"]',
      '[class*="size-swatch"]', '[class*="SizeSwatch"]',
    ];

    for (const query of selectorQueries) {
      try {
        const elements = document.querySelectorAll(query);
        if (elements.length > 0) return Array.from(elements);
      } catch { /* */ }
    }

    // Fallback: look for button groups near "size" labels
    const labels = document.querySelectorAll('label, span, div, h3, h4, p');
    for (const label of labels) {
      const text = label.textContent.trim();
      if (/^(size|select size|choose size|pick a size)/i.test(text) && text.length < 30) {
        const parent = label.closest('[class*="size"], [class*="Size"]') || label.parentElement;
        if (parent) {
          const buttons = parent.querySelectorAll('button, a, li, label, [role="option"]');
          if (buttons.length >= 2) return Array.from(buttons);
        }
      }
    }

    return [];
  }

  function extractAvailableSizes(elements) {
    const sizes = [];
    for (const el of elements) {
      let text = (el.value || el.textContent || el.getAttribute('aria-label') || '').trim();
      text = text.replace(/\s+/g, ' ').trim();
      if (text && text.length < 20 && /^[A-Z0-9\s\/.()-]+$/i.test(text)) {
        const disabled = el.disabled || el.classList.contains('disabled') ||
                         el.getAttribute('aria-disabled') === 'true' ||
                         el.classList.contains('out-of-stock') ||
                         el.classList.contains('unavailable') ||
                         el.classList.contains('sold-out');
        sizes.push({ label: text, available: !disabled, element: el });
      }
    }
    return sizes;
  }

  // --- Strategy E: Structured Data ---

  function extractStructuredData() {
    // Try JSON-LD
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        const product = findProduct(data);
        if (product?.offers) {
          const sizes = extractSizesFromOffers(product.offers);
          if (sizes?.length) return { sizes: null, availableSizes: sizes };
        }
      } catch { /* */ }
    }
    return null;
  }

  function findProduct(data) {
    if (Array.isArray(data)) {
      for (const item of data) {
        const result = findProduct(item);
        if (result) return result;
      }
      return null;
    }
    if (data?.['@type'] === 'Product' || data?.['@type']?.includes?.('Product')) return data;
    if (data?.['@graph']) return findProduct(data['@graph']);
    return null;
  }

  function extractSizesFromOffers(offers) {
    const offerList = Array.isArray(offers) ? offers : offers?.offers || [offers];
    const sizes = [];
    for (const offer of offerList) {
      const size = offer.size || offer.name;
      if (size && typeof size === 'string' && size.length < 20) {
        sizes.push({
          label: size,
          available: offer.availability !== 'https://schema.org/OutOfStock',
        });
      }
    }
    return sizes.length > 0 ? sizes : null;
  }

  // --- Helpers ---

  function findSizeGuideLink() {
    const links = document.querySelectorAll('a, button');
    for (const link of links) {
      const text = link.textContent.toLowerCase().trim();
      if (SIZE_GUIDE_TEXTS.some(t => text.includes(t))) {
        return link;
      }
    }
    return null;
  }

  function detectGarmentType() {
    const text = (document.title + ' ' + (document.querySelector('h1')?.textContent || '') + ' ' +
      (document.querySelector('[class*="product-name"], [class*="ProductName"], [data-testid="product-title"]')?.textContent || '')).toLowerCase();

    const shoeWords = ['shoe', 'sneaker', 'boot', 'sandal', 'heel', 'loafer', 'slipper', 'trainer', 'mule', 'clog', 'oxford', 'flat', 'pump'];
    const bottomWords = ['pant', 'jean', 'trouser', 'short', 'skirt', 'legging', 'jogger', 'chino', 'cargo', 'denim'];
    const dressWords = ['dress', 'gown', 'romper', 'jumpsuit', 'playsuit'];

    if (shoeWords.some(w => text.includes(w))) return 'shoes';
    if (bottomWords.some(w => text.includes(w))) return 'bottoms';
    if (dressWords.some(w => text.includes(w))) return 'tops'; // dresses use top measurements primarily
    return 'tops';
  }

  function parseRange(value) {
    if (!value) return null;
    const cleaned = value.replace(/[^\d.\-–]/g, ' ').trim();
    const rangeMatch = cleaned.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
    if (rangeMatch) return [parseFloat(rangeMatch[1]), parseFloat(rangeMatch[2])];
    const singleMatch = cleaned.match(/(\d+\.?\d*)/);
    if (singleMatch) {
      const num = parseFloat(singleMatch[1]);
      return [num, num];
    }
    return null;
  }

  function isVisible(el) {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }
  // --- v2.0: Message Listener for Popup Communication ---
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'detectSizeChart' || message.action === 'getSizeChart') {
      window.SizeOracle.detectSizeChart().then(result => {
        sendResponse({ sizeChart: result });
      }).catch(err => {
        console.error('[Size-Oracle] Error detecting size chart:', err);
        sendResponse({ sizeChart: null });
      });
      return true; // Keep message channel open for async response
    }
  });

  // Auto-detect on page load and send to background
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', performAutoDetection);
  } else {
    performAutoDetection();
  }

  function performAutoDetection() {
    // Wait a bit for dynamic content to load
    setTimeout(async () => {
      try {
        const result = await window.SizeOracle.detectSizeChart();
        if (result && result.sizes) {
          // Send to background for caching
          chrome.runtime.sendMessage({
            type: 'SIZE_CHART_DETECTED',
            sizeChart: result
          });
        }
      } catch (err) {
        console.log('[Size-Oracle] Auto-detection completed with no results');
      }
    }, 2000);
  }

})();
