/**
 * Size-Oracle — Universal Sizing Database
 * Comprehensive size charts for when no site-specific data is found.
 * All measurements in inches.
 */

window.SizeOracle = window.SizeOracle || {};

window.SizeOracle.universalSizes = {
  womens: {
    tops: [
      { size: 'XXS', us: '00-0', uk: '2-4', eu: '30-32', chest: [30, 31], waist: [23, 24], hips: [33, 34] },
      { size: 'XS',  us: '0-2',  uk: '4-6', eu: '32-34', chest: [31, 33], waist: [24, 26], hips: [34, 36] },
      { size: 'S',   us: '4-6',  uk: '8-10', eu: '36-38', chest: [33, 35], waist: [26, 28], hips: [36, 38] },
      { size: 'M',   us: '8-10', uk: '12-14', eu: '40-42', chest: [35, 37], waist: [28, 30], hips: [38, 40] },
      { size: 'L',   us: '12-14', uk: '16-18', eu: '44-46', chest: [37, 40], waist: [30, 33], hips: [40, 43] },
      { size: 'XL',  us: '16-18', uk: '20-22', eu: '48-50', chest: [40, 43], waist: [33, 36], hips: [43, 46] },
      { size: 'XXL', us: '20-22', uk: '24-26', eu: '52-54', chest: [43, 46], waist: [36, 39], hips: [46, 49] },
      { size: '3XL', us: '24-26', uk: '28-30', eu: '56-58', chest: [46, 49], waist: [39, 42], hips: [49, 52] },
    ],
    bottoms: [
      { size: 'XXS', us: '00-0', uk: '2-4', eu: '30-32', waist: [23, 24], hips: [33, 34], inseam: [30, 31] },
      { size: 'XS',  us: '0-2',  uk: '4-6', eu: '32-34', waist: [24, 26], hips: [34, 36], inseam: [30, 31] },
      { size: 'S',   us: '4-6',  uk: '8-10', eu: '36-38', waist: [26, 28], hips: [36, 38], inseam: [30, 31] },
      { size: 'M',   us: '8-10', uk: '12-14', eu: '40-42', waist: [28, 30], hips: [38, 40], inseam: [30, 31] },
      { size: 'L',   us: '12-14', uk: '16-18', eu: '44-46', waist: [30, 33], hips: [40, 43], inseam: [31, 32] },
      { size: 'XL',  us: '16-18', uk: '20-22', eu: '48-50', waist: [33, 36], hips: [43, 46], inseam: [31, 32] },
      { size: 'XXL', us: '20-22', uk: '24-26', eu: '52-54', waist: [36, 39], hips: [46, 49], inseam: [31, 32] },
      { size: '3XL', us: '24-26', uk: '28-30', eu: '56-58', waist: [39, 42], hips: [49, 52], inseam: [31, 32] },
    ],
    shoes: [
      { us: 5,    uk: 2.5,  eu: 35 },
      { us: 5.5,  uk: 3,    eu: 35.5 },
      { us: 6,    uk: 3.5,  eu: 36 },
      { us: 6.5,  uk: 4,    eu: 37 },
      { us: 7,    uk: 4.5,  eu: 37.5 },
      { us: 7.5,  uk: 5,    eu: 38 },
      { us: 8,    uk: 5.5,  eu: 38.5 },
      { us: 8.5,  uk: 6,    eu: 39 },
      { us: 9,    uk: 6.5,  eu: 40 },
      { us: 9.5,  uk: 7,    eu: 40.5 },
      { us: 10,   uk: 7.5,  eu: 41 },
      { us: 10.5, uk: 8,    eu: 42 },
      { us: 11,   uk: 8.5,  eu: 42.5 },
      { us: 12,   uk: 9.5,  eu: 43 },
    ],
  },
  mens: {
    tops: [
      { size: 'XS',  us: '32-34', uk: '32-34', eu: '42-44', chest: [33, 35], waist: [27, 29], hips: [33, 35] },
      { size: 'S',   us: '34-36', uk: '34-36', eu: '44-46', chest: [35, 37], waist: [29, 31], hips: [35, 37] },
      { size: 'M',   us: '38-40', uk: '38-40', eu: '48-50', chest: [38, 40], waist: [32, 34], hips: [38, 40] },
      { size: 'L',   us: '42-44', uk: '42-44', eu: '52-54', chest: [41, 44], waist: [35, 37], hips: [41, 44] },
      { size: 'XL',  us: '46-48', uk: '46-48', eu: '56-58', chest: [45, 48], waist: [38, 41], hips: [45, 48] },
      { size: 'XXL', us: '50-52', uk: '50-52', eu: '60-62', chest: [49, 52], waist: [42, 45], hips: [49, 52] },
      { size: '3XL', us: '54-56', uk: '54-56', eu: '64-66', chest: [53, 56], waist: [46, 49], hips: [53, 56] },
    ],
    bottoms: [
      { size: 'XS',  us: '28', waist: [27, 29], hips: [33, 35], inseam: [30, 32] },
      { size: 'S',   us: '30-32', waist: [29, 32], hips: [35, 38], inseam: [30, 32] },
      { size: 'M',   us: '32-34', waist: [32, 34], hips: [38, 40], inseam: [30, 32] },
      { size: 'L',   us: '36-38', waist: [35, 38], hips: [41, 44], inseam: [30, 32] },
      { size: 'XL',  us: '40-42', waist: [39, 42], hips: [45, 48], inseam: [30, 32] },
      { size: 'XXL', us: '44-46', waist: [43, 46], hips: [49, 52], inseam: [30, 32] },
      { size: '3XL', us: '48-50', waist: [47, 50], hips: [53, 56], inseam: [30, 32] },
    ],
    shoes: [
      { us: 7,    uk: 6,    eu: 40 },
      { us: 7.5,  uk: 6.5,  eu: 40.5 },
      { us: 8,    uk: 7,    eu: 41 },
      { us: 8.5,  uk: 7.5,  eu: 41.5 },
      { us: 9,    uk: 8,    eu: 42 },
      { us: 9.5,  uk: 8.5,  eu: 42.5 },
      { us: 10,   uk: 9,    eu: 43 },
      { us: 10.5, uk: 9.5,  eu: 44 },
      { us: 11,   uk: 10,   eu: 44.5 },
      { us: 11.5, uk: 10.5, eu: 45 },
      { us: 12,   uk: 11,   eu: 46 },
      { us: 13,   uk: 12,   eu: 47 },
      { us: 14,   uk: 13,   eu: 48 },
      { us: 15,   uk: 14,   eu: 49 },
    ],
  },

  /**
   * Get the appropriate universal size chart based on gender and garment type.
   * @param {'mens'|'womens'} gender
   * @param {'tops'|'bottoms'|'shoes'} type
   * @returns {Array} Size chart entries
   */
  getChart(gender, type) {
    return this[gender]?.[type] || this[gender]?.tops || [];
  },

  /**
   * Convert a shoe size between systems.
   * @param {number} size - The shoe size value
   * @param {'us'|'uk'|'eu'} from - Source system
   * @param {'us'|'uk'|'eu'} to - Target system
   * @param {'mens'|'womens'} gender
   * @returns {number|null}
   */
  convertShoeSize(size, from, to, gender = 'mens') {
    const chart = this[gender]?.shoes || [];
    const entry = chart.find(e => Math.abs(e[from] - size) < 0.5);
    return entry ? entry[to] : null;
  },
};
