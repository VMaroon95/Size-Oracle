/**
 * Size-Oracle — Oracle Engine (Matching Algorithm)
 * Compares user measurements against a parsed size chart
 * and returns ranked size recommendations with confidence scores.
 *
 * Exposes: window.SizeOracle.findBestSize(profile, sizeChart)
 */

window.SizeOracle = window.SizeOracle || {};

(() => {
  'use strict';

  // Measurement weights for the overall confidence score
  const WEIGHTS = {
    waist: 0.35,
    chest: 0.30,
    hips: 0.25,
    inseam: 0.10,
  };

  /**
   * Calculate fit score for a single measurement against a size range.
   * @param {number} userValue - User's measurement in inches.
   * @param {number[]} range - [min, max] from the size chart.
   * @returns {number} Score from 0 to 100.
   */
  function measurementScore(userValue, range) {
    if (!range || range.length < 2 || userValue == null) return null;

    const [min, max] = range;

    // Perfect fit: within the range
    if (userValue >= min && userValue <= max) return 100;

    // Distance from nearest edge
    const distance = userValue < min ? min - userValue : userValue - max;

    if (distance <= 1) return 80;   // Close
    if (distance <= 2) return 60;   // Acceptable
    return 20;                       // Poor
  }

  /**
   * Get a human-readable fit indicator for a score.
   */
  function fitIndicator(score) {
    if (score == null) return { icon: '➖', label: 'N/A' };
    if (score >= 100) return { icon: '✅', label: 'Perfect' };
    if (score >= 80) return { icon: '✅', label: 'Close' };
    if (score >= 60) return { icon: '⚠️', label: 'Acceptable' };
    return { icon: '❌', label: 'Poor' };
  }

  /**
   * Find the best size match for the user's measurements.
   *
   * @param {Object} profile - User profile with chest, waist, hips, inseam (in inches).
   * @param {Array<Object>} sizeChart - Parsed size chart from size-detector.
   * @returns {Array<Object>} Sorted results, best match first.
   *   Each: { size, confidence, breakdown: { chest: {score, indicator}, ... } }
   */
  window.SizeOracle.findBestSize = function findBestSize(profile, sizeChart) {
    if (!profile || !sizeChart?.length) return [];

    const results = sizeChart.map(entry => {
      const breakdown = {};
      let totalWeight = 0;
      let weightedSum = 0;

      for (const [measurement, weight] of Object.entries(WEIGHTS)) {
        const userVal = profile[measurement];
        const chartRange = entry[measurement];

        if (userVal != null && chartRange != null) {
          const score = measurementScore(userVal, chartRange);
          breakdown[measurement] = {
            score,
            ...fitIndicator(score),
            userValue: userVal,
            chartRange,
          };
          weightedSum += score * weight;
          totalWeight += weight;
        } else {
          breakdown[measurement] = {
            score: null,
            ...fitIndicator(null),
            userValue: userVal ?? null,
            chartRange: chartRange ?? null,
          };
        }
      }

      // Normalize confidence if not all measurements were available
      const confidence = totalWeight > 0
        ? Math.round(weightedSum / totalWeight)
        : 0;

      return {
        size: entry.size,
        confidence,
        breakdown,
      };
    });

    // Sort by confidence descending
    results.sort((a, b) => b.confidence - a.confidence);

    return results;
  };
})();
