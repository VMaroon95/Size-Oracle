/**
 * Size-Oracle — Numeric Size Display Mapper
 * 
 * Some sites (H&M, Zara bottoms, etc.) show sizes as numbers (0, 2, 4, 6...)
 * instead of letters (S, M, L). This module maps letter-based recommendations
 * to the numeric format the site actually uses.
 *
 * DOES NOT change scoring — only changes what's DISPLAYED to the user.
 */

window.SizeOracle = window.SizeOracle || {};

window.SizeOracle.numericSites = (() => {
  'use strict';

  // Sites that use numeric sizing (hostname patterns)
  // format: 'system' = which column from universal-sizes to use (us, uk, eu)
  // format: 'categories' = which garment types use numeric (null = all)
  const SITES = {
    'www2.hm.com':           { system: 'us', categories: null },
    'hm.com':                { system: 'us', categories: null },
    'www.zara.com':          { system: 'eu', categories: ['bottoms'] },
    'zara.com':              { system: 'eu', categories: ['bottoms'] },
    'www.gap.com':           { system: 'us', categories: ['bottoms'] },
    'gap.com':               { system: 'us', categories: ['bottoms'] },
    'www.oldnavy.com':       { system: 'us', categories: ['bottoms'] },
    'oldnavy.com':           { system: 'us', categories: ['bottoms'] },
    'www.levis.com':         { system: 'us', categories: ['bottoms'] },
    'levis.com':             { system: 'us', categories: ['bottoms'] },
    'www.express.com':       { system: 'us', categories: ['bottoms'] },
    'express.com':           { system: 'us', categories: ['bottoms'] },
    'www.americaneagle.com': { system: 'us', categories: ['bottoms'] },
    'www.ae.com':            { system: 'us', categories: ['bottoms'] },
    'www.abercrombie.com':   { system: 'us', categories: ['bottoms'] },
    'abercrombie.com':       { system: 'us', categories: ['bottoms'] },
    'www.hollisterco.com':   { system: 'us', categories: ['bottoms'] },
    'www.torrid.com':        { system: 'us', categories: null },
    'torrid.com':            { system: 'us', categories: null },
    'www.lanebryant.com':    { system: 'us', categories: null },
    'lanebryant.com':        { system: 'us', categories: null },
    'www.jcpenney.com':      { system: 'us', categories: ['bottoms'] },
    'www.kohls.com':         { system: 'us', categories: ['bottoms'] },
    'www.macys.com':         { system: 'us', categories: ['bottoms'] },
    'www.nordstrom.com':     { system: 'us', categories: ['bottoms'] },
    'www.zalando.com':       { system: 'eu', categories: null },
    'zalando.com':           { system: 'eu', categories: null },
  };

  /**
   * Check if the current site uses numeric sizing.
   * @param {string} hostname
   * @param {string} [garmentType='tops']
   * @returns {{ system: string } | null}
   */
  function getSiteConfig(hostname, garmentType) {
    // Strip www. prefix for fallback matching
    const bare = hostname.replace(/^www\d*\./, '');
    const config = SITES[hostname] || SITES[bare];
    if (!config) return null;

    // Check if this category uses numeric on this site
    if (config.categories && !config.categories.includes(garmentType)) return null;

    return config;
  }

  /**
   * Convert a letter size (e.g. "M") to the numeric display format for this site.
   * Uses the universal sizing database's us/uk/eu columns.
   * 
   * @param {string} letterSize - e.g. "M", "L", "XL"
   * @param {string} system - "us", "uk", or "eu"
   * @param {string} gender - "mens" or "womens"
   * @param {string} garmentType - "tops", "bottoms", "shoes"
   * @returns {string} - e.g. "8-10" or the original letter if no mapping found
   */
  function toNumeric(letterSize, system, gender, garmentType) {
    const chart = window.SizeOracle.universalSizes?.getChart?.(gender, garmentType);
    if (!chart) return letterSize;

    const entry = chart.find(e => e.size.toUpperCase() === letterSize.toUpperCase());
    if (!entry) return letterSize;

    const numeric = entry[system];
    if (!numeric) return letterSize;

    return numeric;
  }

  /**
   * Get the best display label for a size on the current site.
   * Returns numeric if the site prefers it, otherwise the original letter.
   * 
   * @param {string} letterSize - e.g. "M"
   * @param {string} gender - "mens" or "womens"
   * @param {string} [garmentType='tops']
   * @returns {string}
   */
  function getDisplaySize(letterSize, gender, garmentType) {
    const hostname = window.location.hostname;
    const config = getSiteConfig(hostname, garmentType || 'tops');
    if (!config) return letterSize;  // Not a numeric site — return letter as-is

    return toNumeric(letterSize, config.system, gender, garmentType || 'tops');
  }

  /**
   * Check if current site is a numeric-size site.
   * @param {string} [garmentType='tops']
   * @returns {boolean}
   */
  function isNumericSite(garmentType) {
    return getSiteConfig(window.location.hostname, garmentType || 'tops') !== null;
  }

  return { getSiteConfig, toNumeric, getDisplaySize, isNumericSite };
})();
