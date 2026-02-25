/**
 * Size-Oracle — Brand-Specific Fit Adjustments
 * Scale: -2 (runs very small) to +2 (runs very large)
 * Negative = runs small, recommend sizing UP
 * Positive = runs large, recommend sizing DOWN
 */

window.SizeOracle = window.SizeOracle || {};

window.SizeOracle.brandAdjustments = {
  // Fast Fashion
  'zara.com':           { bias: -0.5, note: 'Zara tends to run small' },
  'hm.com':             { bias: 0.5,  note: 'H&M tends to run large' },
  'uniqlo.com':         { bias: 0.5,  note: 'Uniqlo has a relaxed Asian fit' },
  'forever21.com':      { bias: -0.5, note: 'Forever 21 runs slightly small' },
  'primark.com':        { bias: 0,    note: 'Primark is generally true to size' },
  'pull-and-bear.com':  { bias: -0.5, note: 'Pull & Bear runs slightly small' },
  'bershka.com':        { bias: -0.5, note: 'Bershka runs slightly small' },
  'stradivarius.com':   { bias: -0.5, note: 'Stradivarius runs slightly small' },
  'mango.com':          { bias: -0.5, note: 'Mango runs slightly small' },
  'reserved.com':       { bias: 0,    note: 'Reserved is true to size' },
  'massimodutti.com':   { bias: 0,    note: 'Massimo Dutti is true to size' },

  // Marketplaces
  'shein.com':          { bias: -1,   note: 'SHEIN runs small — consider sizing up' },
  'temu.com':           { bias: -1,   note: 'Temu items often run small' },
  'aliexpress.com':     { bias: -1.5, note: 'AliExpress uses Asian sizing — size up 1-2' },
  'wish.com':           { bias: -1.5, note: 'Wish uses Asian sizing — size up 1-2' },

  // Department Stores
  'nordstrom.com':      { bias: 0,    note: 'Nordstrom brands are generally true to size' },
  'macys.com':          { bias: 0,    note: "Macy's brands vary — check individual brand" },
  'bloomingdales.com':  { bias: 0,    note: 'True to size' },
  'jcpenney.com':       { bias: 0.5,  note: 'JCPenney tends to run slightly large' },
  'kohls.com':          { bias: 0.5,  note: "Kohl's brands tend to run slightly large" },

  // Online Fashion
  'asos.com':           { bias: 0,    note: 'ASOS is generally true to size' },
  'boohoo.com':         { bias: -0.5, note: 'Boohoo runs slightly small' },
  'prettylittlething.com': { bias: -0.5, note: 'PLT runs slightly small' },
  'fashionnova.com':    { bias: -1,   note: 'Fashion Nova runs small — size up' },
  'revolve.com':        { bias: 0,    note: 'Revolve brands vary' },
  'ssense.com':         { bias: 0,    note: 'Designer brands — check specific brand' },
  'farfetch.com':       { bias: 0,    note: 'Designer brands — check specific brand' },
  'net-a-porter.com':   { bias: 0,    note: 'Designer brands — check specific brand' },
  'urbanoutfitters.com':{ bias: 0.5,  note: 'UO tends to run slightly large/oversized' },
  'freepeople.com':     { bias: 0.5,  note: 'Free People has a relaxed/oversized fit' },
  'anthropologie.com':  { bias: 0.5,  note: 'Anthropologie tends to run slightly large' },

  // Athletic/Sports
  'nike.com':           { bias: 0,    note: 'Nike is generally true to size' },
  'adidas.com':         { bias: 0,    note: 'Adidas is generally true to size' },
  'underarmour.com':    { bias: -0.5, note: 'Under Armour runs slightly small/fitted' },
  'puma.com':           { bias: 0,    note: 'Puma is true to size' },
  'newbalance.com':     { bias: 0,    note: 'New Balance is true to size' },
  'lululemon.com':      { bias: 0,    note: 'Lululemon is true to size' },
  'gymshark.com':       { bias: -0.5, note: 'Gymshark has a fitted/compression fit' },
  'fabletics.com':      { bias: 0,    note: 'Fabletics is true to size' },
  'columbia.com':       { bias: 0.5,  note: 'Columbia runs slightly large' },
  'thenorthface.com':   { bias: 0,    note: 'The North Face is true to size' },
  'patagonia.com':      { bias: 0,    note: 'Patagonia is true to size' },
  'arcteryx.com':       { bias: 0,    note: "Arc'teryx is true to size" },

  // Denim/Casual
  'levis.com':          { bias: 0,    note: "Levi's is generally true to size" },
  'gap.com':            { bias: 0.5,  note: 'Gap tends to run slightly large' },
  'oldnavy.com':        { bias: 0.5,  note: 'Old Navy runs slightly large' },
  'bananarepublic.com': { bias: 0,    note: 'Banana Republic is true to size' },
  'abercrombie.com':    { bias: 0,    note: 'Abercrombie is true to size' },
  'hollisterco.com':    { bias: -0.5, note: 'Hollister runs slightly small' },
  'express.com':        { bias: -0.5, note: 'Express runs slightly slim' },
  'calvinklein.com':    { bias: 0,    note: 'Calvin Klein is true to size' },
  'tommyhilfiger.com':  { bias: 0,    note: 'Tommy Hilfiger is true to size' },
  'ralphlauren.com':    { bias: 0.5,  note: 'Ralph Lauren runs slightly large' },

  // Luxury
  'gucci.com':          { bias: -0.5, note: 'Gucci runs small — Italian sizing' },
  'louisvuitton.com':   { bias: -0.5, note: 'Louis Vuitton runs small — French sizing' },
  'prada.com':          { bias: -0.5, note: 'Prada runs small — Italian sizing' },
  'burberry.com':       { bias: 0,    note: 'Burberry is true to size' },
  'versace.com':        { bias: -0.5, note: 'Versace runs small — Italian sizing' },
  'balenciaga.com':     { bias: 0.5,  note: 'Balenciaga is intentionally oversized' },
  'dior.com':           { bias: -0.5, note: 'Dior runs small — French sizing' },

  // Shoes
  'zappos.com':         { bias: 0,    note: 'Varies by brand' },
  'footlocker.com':     { bias: 0,    note: 'Varies by brand' },
  'crocs.com':          { bias: 0.5,  note: 'Crocs run slightly large' },
  'skechers.com':       { bias: 0.5,  note: 'Skechers tend to run slightly large' },

  // Plus Size
  'torrid.com':         { bias: 0,    note: 'Torrid is true to size' },
  'lanebryant.com':     { bias: 0,    note: 'Lane Bryant is true to size' },
  'eloquii.com':        { bias: 0,    note: 'Eloquii is true to size' },

  // Indian/Global
  'myntra.com':         { bias: -0.5, note: 'Indian sizing tends to run small' },
  'ajio.com':           { bias: -0.5, note: 'Indian sizing tends to run small' },
  'zalando.com':        { bias: 0,    note: 'European sizing — check EU conversion' },

  /**
   * Get brand adjustment for a given hostname.
   * @param {string} hostname
   * @returns {{ bias: number, note: string } | null}
   */
  get(hostname) {
    for (const [domain, data] of Object.entries(this)) {
      if (typeof data === 'object' && data.bias !== undefined && hostname.includes(domain)) {
        return data;
      }
    }
    return null;
  },
};
