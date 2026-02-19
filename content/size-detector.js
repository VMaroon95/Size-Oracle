/**
 * Size-Oracle — Size Chart Detector & Parser
 * Scrapes size chart tables from supported shopping sites.
 * Falls back to generic table detection using keyword matching.
 *
 * Exposes: window.SizeOracle.detectSizeChart()
 * Returns: Array<{size, chest, waist, hips, inseam}> | null
 */

window.SizeOracle = window.SizeOracle || {};

(() => {
  'use strict';

  // Keywords that indicate size-related content
  const SIZE_KEYWORDS = ['size', 'chest', 'bust', 'waist', 'hip', 'inseam', 'length'];
  const SIZE_LABELS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL'];

  // Measurement column aliases → canonical names
  const COLUMN_MAP = {
    chest: ['chest', 'bust', 'chest/bust'],
    waist: ['waist', 'natural waist'],
    hips: ['hips', 'hip', 'seat'],
    inseam: ['inseam', 'inside leg', 'leg length'],
  };

  /**
   * Site-specific selectors for known retailers.
   * Each returns a CSS selector for size chart containers.
   */
  const SITE_SELECTORS = {
    'zara.com': [
      '.size-guide-table',
      '.product-size-guide table',
      '[class*="size-guide"] table',
      '[class*="SizeGuide"] table',
    ],
    'hm.com': [
      '.size-guide table',
      '.product-size-table',
      '[class*="sizeguide"] table',
      '[data-testid="size-guide"] table',
    ],
    'asos.com': [
      '.size-guide table',
      '[class*="sizeGuide"] table',
      '#sizeguide table',
      '.product-size-guide table',
    ],
    'nordstrom.com': [
      '.size-chart table',
      '[class*="SizeChart"] table',
      '[class*="size-chart"] table',
    ],
    'gap.com': [
      '.size-chart table',
      '.size-fit-guide table',
      '[class*="sizeChart"] table',
    ],
    'uniqlo.com': [
      '.size-chart table',
      '.fr-ec-size-chart table',
      '[class*="sizeChart"] table',
    ],
  };

  /**
   * Main entry point: detect and parse the size chart on the current page.
   * @returns {Array|null} Parsed size chart or null if not found.
   */
  window.SizeOracle.detectSizeChart = function detectSizeChart() {
    // Try site-specific selectors first
    const hostname = window.location.hostname;
    for (const [domain, selectors] of Object.entries(SITE_SELECTORS)) {
      if (hostname.includes(domain)) {
        for (const selector of selectors) {
          const table = document.querySelector(selector);
          if (table) {
            const parsed = parseTable(table);
            if (parsed?.length) return parsed;
          }
        }
      }
    }

    // Generic fallback: find any table with size-related keywords
    const tables = document.querySelectorAll('table');
    for (const table of tables) {
      if (isSizeTable(table)) {
        const parsed = parseTable(table);
        if (parsed?.length) return parsed;
      }
    }

    return null;
  };

  /**
   * Check if a table likely contains size chart data.
   */
  function isSizeTable(table) {
    const text = table.textContent.toLowerCase();
    const hasKeywords = SIZE_KEYWORDS.some(kw => text.includes(kw));
    const hasSizeLabels = SIZE_LABELS.some(label =>
      text.includes(label.toLowerCase()) || text.includes(label)
    );
    return hasKeywords && hasSizeLabels;
  }

  /**
   * Parse an HTML table into structured size data.
   * @param {HTMLTableElement} table
   * @returns {Array<Object>} Parsed entries.
   */
  function parseTable(table) {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length < 2) return [];

    // Extract header row
    const headerRow = rows[0];
    const headers = Array.from(headerRow.querySelectorAll('th, td'))
      .map(cell => cell.textContent.trim().toLowerCase());

    // Map header indices to canonical measurement names
    const columnIndices = {};
    let sizeIndex = -1;

    headers.forEach((header, i) => {
      // Find the "size" column
      if (header === 'size' || header === 'sizes' || header === 'us size' || header === 'uk size') {
        sizeIndex = i;
        return;
      }

      // Map measurement columns
      for (const [canonical, aliases] of Object.entries(COLUMN_MAP)) {
        if (aliases.some(alias => header.includes(alias))) {
          columnIndices[canonical] = i;
          break;
        }
      }
    });

    // If no explicit size column, check if first column has size labels
    if (sizeIndex === -1) {
      const firstColValues = rows.slice(1).map(r => {
        const cell = r.querySelector('th, td');
        return cell?.textContent.trim().toUpperCase() ?? '';
      });
      const hasSizes = firstColValues.some(v => SIZE_LABELS.includes(v) || /^\d{2,3}$/.test(v));
      if (hasSizes) sizeIndex = 0;
    }

    if (sizeIndex === -1 || Object.keys(columnIndices).length === 0) return [];

    // Parse data rows
    const results = [];
    for (let i = 1; i < rows.length; i++) {
      const cells = Array.from(rows[i].querySelectorAll('th, td'))
        .map(cell => cell.textContent.trim());

      if (cells.length <= sizeIndex) continue;

      const sizeName = cells[sizeIndex];
      if (!sizeName) continue;

      const entry = { size: sizeName };

      for (const [measurement, colIdx] of Object.entries(columnIndices)) {
        if (colIdx < cells.length) {
          entry[measurement] = parseRange(cells[colIdx]);
        }
      }

      // Only include if we have at least one measurement
      if (Object.keys(entry).length > 1) {
        results.push(entry);
      }
    }

    return results;
  }

  /**
   * Parse a measurement value or range string into [min, max].
   * Handles: "38", "38-40", "38 - 40", "38–40", "38.5"
   * @param {string} value
   * @returns {number[]} [min, max] (same value for single numbers)
   */
  function parseRange(value) {
    if (!value) return null;

    // Clean up the string
    const cleaned = value.replace(/[^\d.\-–]/g, ' ').trim();

    // Try range patterns: "38-40", "38 – 40"
    const rangeMatch = cleaned.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
    if (rangeMatch) {
      return [parseFloat(rangeMatch[1]), parseFloat(rangeMatch[2])];
    }

    // Single value
    const singleMatch = cleaned.match(/(\d+\.?\d*)/);
    if (singleMatch) {
      const num = parseFloat(singleMatch[1]);
      return [num, num];
    }

    return null;
  }
})();
