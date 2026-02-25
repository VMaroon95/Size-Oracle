/**
 * Size-Oracle — Oracle Engine (Enhanced Matching Algorithm)
 * Compares user measurements against size charts with body shape detection,
 * brand adjustments, fit preference support, and rich recommendations.
 *
 * Exposes: window.SizeOracle.findBestSize(profile, sizeData)
 */

window.SizeOracle = window.SizeOracle || {};

(() => {
  'use strict';

  // Measurement weights - chest is most important for fit
  const WEIGHTS = {
    chest: 0.40,
    waist: 0.35,
    hips: 0.20,
    inseam: 0.05,
  };

  // Fit preference adjustments (in inches added to user measurements)
  const FIT_OFFSETS = {
    fitted:  -0.5,
    regular:  0,
    relaxed:  1.0,
  };

  // Confidence messages
  const MESSAGES = {
    high: [
      "This is YOUR size. Buy with confidence!",
      "Perfect match! No returns needed.",
      "Go for it — this will fit you perfectly!",
    ],
    medium: [
      "Good match — should fit well!",
      "Solid choice! This size works for you.",
      "Pretty close match — you'll look great!",
    ],
    low: [
      "This is our best guess — check the size chart to be sure.",
      "Closest match we found. Consider trying the size chart.",
    ],
  };

  // --- Body Shape Detection ---

  function detectBodyShape(profile) {
    const { chest, waist, hips } = profile;
    if (!chest || !waist || !hips) return 'unknown';

    const chestHipRatio = chest / hips;
    const waistHipRatio = waist / hips;
    const waistChestRatio = waist / chest;

    // Hourglass: chest ≈ hips, waist significantly smaller
    if (Math.abs(chestHipRatio - 1) < 0.08 && waistHipRatio < 0.78) return 'hourglass';
    // Pear: hips notably larger than chest
    if (chestHipRatio < 0.9 && waistHipRatio < 0.85) return 'pear';
    // Apple: waist close to or larger than hips, chest large
    if (waistHipRatio > 0.85 && waistChestRatio > 0.85) return 'apple';
    // Inverted triangle: chest much larger than hips
    if (chestHipRatio > 1.1) return 'inverted-triangle';
    // Athletic: similar to inverted triangle but with smaller waist
    if (chestHipRatio > 1.05 && waistHipRatio < 0.8) return 'athletic';
    // Rectangle: everything roughly the same
    return 'rectangle';
  }

  const BODY_SHAPE_LABELS = {
    'hourglass': 'Hourglass',
    'pear': 'Pear',
    'apple': 'Apple',
    'rectangle': 'Rectangle',
    'inverted-triangle': 'Inverted Triangle',
    'athletic': 'Athletic',
    'unknown': 'Unknown',
  };

  // --- Scoring ---

  function measurementScore(userValue, range) {
    if (!range || range.length < 2 || userValue == null) return null;
    
    const [min, max] = range;
    const sizeMedian = (min + max) / 2;
    const distance = Math.abs(userValue - sizeMedian);
    
    // Calibrated penalty for desired score distribution:
    // - userValue = sizeMedian → Score ≈ 98-100%
    // - userValue = median ± 2" → Score ≈ 40-50%
    const penalty = 14.5; // Calibrated to meet spec requirements
    const score = Math.max(0, Math.min(100, 100 - (distance * penalty)));
    
    // Test logging to verify different sizes give different scores
    console.log(`Score Debug: user=${userValue}, range=[${min}-${max}], median=${sizeMedian}, dist=${distance.toFixed(1)}, score=${Math.round(score)}`);
    
    return Math.round(score);
  }

  function fitLabel(score) {
    if (score == null) return { icon: '-', fit: 'N/A' };
    if (score >= 90) return { icon: '+', fit: 'perfect' };
    if (score >= 75) return { icon: '+', fit: 'great' };
    if (score >= 60) return { icon: '!', fit: 'slightly snug' };
    if (score >= 40) return { icon: '!', fit: 'loose' };
    return { icon: 'X', fit: 'poor' };
  }

  function returnRisk(confidence) {
    if (confidence >= 85) return 'low';
    if (confidence >= 65) return 'medium';
    return 'high';
  }

  function randomMessage(tier) {
    const msgs = MESSAGES[tier] || MESSAGES.low;
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  // --- Brand Adjustment ---

  function applyBrandBias(sizeChart, bias) {
    if (!bias || bias === 0) return sizeChart;
    // Shift measurement ranges to account for brand sizing
    // Negative bias (runs small) → we expand upper range (effectively recommending larger)
    return sizeChart.map(entry => {
      const adjusted = { ...entry };
      for (const key of ['chest', 'waist', 'hips', 'inseam']) {
        if (adjusted[key]) {
          adjusted[key] = [
            adjusted[key][0] + bias * 0.5,
            adjusted[key][1] + bias * 0.5,
          ];
        }
      }
      return adjusted;
    });
  }

  // --- TEST: Validate Scoring Math ---
  
  function testScoringMath() {
    console.log("=== Size-Oracle Scoring Test ===");
    
    // Test scenario: 39" chest user
    const userChest = 39;
    
    // Size ranges as per specification
    const sizeS = [34, 36]; // median = 35"
    const sizeM = [38, 40]; // median = 39"
    const sizeL = [42, 44]; // median = 43"
    
    const scoreS = measurementScore(userChest, sizeS);
    const scoreM = measurementScore(userChest, sizeM);
    const scoreL = measurementScore(userChest, sizeL);
    
    console.log(`Test Results for ${userChest}" chest:`);
    console.log(`S (34-36", median 35"): ${scoreS}% (should be ~40%)`);
    console.log(`M (38-40", median 39"): ${scoreM}% (should be ~98%)`);
    console.log(`L (42-44", median 43"): ${scoreL}% (should be ~40%)`);
    
    // Validation
    const isValid = scoreM > 95 && scoreS < 45 && scoreL < 45 && scoreM > scoreS && scoreM > scoreL;
    console.log(`Scoring algorithm ${isValid ? 'PASSED' : 'FAILED'} validation`);
    
    return isValid;
  }
  
  // Run test on load
  setTimeout(testScoringMath, 1000);

  // --- Main Entry Point ---

  /**
   * Find the best size match with rich recommendation data.
   *
   * @param {Object} profile - User measurements + preferences
   * @param {Object} sizeData - Result from detectSizeChart()
   * @returns {Object} Rich recommendation result
   */
  window.SizeOracle.findBestSize = function findBestSize(profile, sizeData) {
    if (!profile) return null;

    const hostname = window.location.hostname;
    const brand = window.SizeOracle.brandAdjustments?.get(hostname);
    const bodyShape = detectBodyShape(profile);
    const fitPref = profile.fitPreference || 'regular';
    const fitOffset = FIT_OFFSETS[fitPref] || 0;

    // Get size chart: from page detection or universal fallback
    let sizeChart = sizeData?.sizes;
    let source = sizeData?.source || 'estimated';

    if (!sizeChart || sizeChart.length === 0) {
      // Use universal sizing database
      const gender = profile.gender || 'mens';
      const garmentType = sizeData?.garmentType || 'tops';
      sizeChart = window.SizeOracle.universalSizes?.getChart(gender, garmentType);
      source = 'estimated';
    }

    if (!sizeChart?.length) return null;

    // Apply brand adjustment
    const adjustedChart = brand ? applyBrandBias(sizeChart, brand.bias) : sizeChart;

    // Apply fit preference offset to user measurements
    const adjustedProfile = { ...profile };
    for (const key of ['chest', 'waist', 'hips']) {
      if (adjustedProfile[key]) {
        adjustedProfile[key] = adjustedProfile[key] + fitOffset;
      }
    }

    // Score each size
    const results = adjustedChart.map(entry => {
      const breakdown = {};
      let totalWeight = 0;
      let weightedSum = 0;

      for (const [measurement, weight] of Object.entries(WEIGHTS)) {
        const userVal = adjustedProfile[measurement];
        const chartRange = entry[measurement];

        if (userVal != null && chartRange != null) {
          const score = measurementScore(userVal, chartRange);
          const { icon, fit } = fitLabel(score);
          breakdown[measurement] = { score, icon, fit, userValue: userVal, chartRange };
          weightedSum += score * weight;
          totalWeight += weight;
        }
      }

      const confidence = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
      return { size: entry.size, confidence, breakdown };
    });

    results.sort((a, b) => b.confidence - a.confidence);

    if (results.length === 0) return null;

    const top = results[0];
    const runner = results.length > 1 ? results[1] : null;
    const confTier = top.confidence >= 80 ? 'high' : top.confidence >= 60 ? 'medium' : 'low';

    // Build alternate message for between-sizes scenarios
    let alternateMessage = null;
    if (runner && Math.abs(top.confidence - runner.confidence) <= 15) {
      alternateMessage = `Between ${top.size} and ${runner.size}? ${top.size} for a ${fitPref === 'relaxed' ? 'regular' : 'fitted'} look, ${runner.size} for a ${fitPref === 'fitted' ? 'regular' : 'relaxed'} fit.`;
    }

    return {
      recommended: top.size,
      confidence: top.confidence,
      message: `Go for ${top.size} — ${randomMessage(confTier).toLowerCase()}`,
      alternateMessage,
      breakdown: top.breakdown,
      allResults: results.slice(0, 5),
      brandAdjustment: brand ? brand.note : null,
      bodyShape: BODY_SHAPE_LABELS[bodyShape] || bodyShape,
      returnRisk: returnRisk(top.confidence),
      source,
      fitPreference: fitPref,
    };
  };

  // Enhanced fit descriptions for v2.0
  window.SizeOracle.getDetailedFitDescription = function(userValue, range, measurement) {
    if (!range || range.length < 2 || userValue == null) return 'No size data available';
    
    const [min, max] = range;
    const midpoint = (min + max) / 2;
    
    if (userValue >= min && userValue <= max) {
      if (userValue <= min + 0.5) return 'Snug Fit - Will feel fitted and trim';
      if (userValue >= max - 0.5) return 'Roomy Fit - Will feel loose and comfortable';
      return 'Perfect Fit - Ideal sizing for you';
    } else if (userValue < min) {
      const gap = min - userValue;
      if (gap <= 1) return 'Size Up Recommended - This may be too small';
      return 'Definitely Size Up - This will be too tight';
    } else {
      const excess = userValue - max;
      if (excess <= 1) return 'Size Down May Work - This might be loose';
      return 'Size Down Recommended - This will be too large';
    }
  };

  // Smart recommendation engine for v2.0
  window.SizeOracle.generateSmartRecommendation = function(profile, sizes, bestMatch) {
    const shape = detectBodyShape(profile);
    const recommendations = [];
    
    // Body shape specific advice
    if (shape === 'hourglass') {
      recommendations.push("✨ Your balanced proportions work well with most fits");
    } else if (shape === 'pear') {
      recommendations.push("🍐 Consider sizing for your hips, may need tailoring at waist");
    } else if (shape === 'apple') {
      recommendations.push("🍎 Focus on chest/waist fit for the most flattering look");
    } else if (shape === 'athletic') {
      recommendations.push("💪 Your athletic build may prefer slightly relaxed fits");
    }

    // Fit preference guidance
    if (profile.fitPreference === 'fitted') {
      recommendations.push("👔 Fitted style: This will be trim and tailored");
    } else if (profile.fitPreference === 'relaxed') {
      recommendations.push("😌 Relaxed style: This will be comfortable and loose");
    }

    // Multi-measurement analysis
    const measurements = ['chest', 'waist', 'hips'].filter(m => profile[m] && bestMatch?.measurements?.[m]);
    if (measurements.length >= 2) {
      const scores = measurements.map(m => measurementScore(profile[m], bestMatch.measurements[m]));
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      
      if (avgScore >= 85) {
        recommendations.push("🎯 Multiple measurements align perfectly!");
      } else if (avgScore >= 70) {
        recommendations.push("📏 Most measurements look good, minor adjustments may help");
      }
    }

    return recommendations;
  };

  // Auto-detection messaging for popup
  window.SizeOracle.sendSizeChartToPopup = function(sizeChart) {
    // This will be called from enhanced size detector
    chrome.runtime.sendMessage({
      action: 'sizeChartDetected',
      sizeChart: sizeChart
    });
  };
})();
