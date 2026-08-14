const Settings = require('../models/Settings');

/**
 * GST Service - All GST calculations read from Settings configuration
 * NO GST rate on Product model
 * Default rate comes from Settings.gst.defaultRate (default: 18%)
 * Optional HSN-specific rates from Settings.gst.hsnRates
 * Modular design for future GST API integration
 */

/**
 * Get GST rate from settings
 * Checks HSN-specific rate first, falls back to default
 */
const getGSTRate = async (hsnCode = null) => {
  const settings = await Settings.getSettings();
  const gstConfig = settings.gst || {};

  // Check HSN-specific rate if HSN code provided
  if (hsnCode && gstConfig.hsnRates && gstConfig.hsnRates.get) {
    const hsnRate = gstConfig.hsnRates.get(hsnCode);
    if (hsnRate !== undefined && hsnRate !== null) {
      return hsnRate;
    }
  }

  // Fall back to default rate from settings
  return gstConfig.defaultRate || 18;
};

/**
 * Get GST rate using pre-fetched settings (avoids repeated DB calls)
 */
const getGSTRateFromSettings = (settings, hsnCode = null) => {
  const gstConfig = settings.gst || {};

  if (hsnCode && gstConfig.hsnRates && gstConfig.hsnRates.get) {
    const hsnRate = gstConfig.hsnRates.get(hsnCode);
    if (hsnRate !== undefined && hsnRate !== null) {
      return hsnRate;
    }
  }

  return gstConfig.defaultRate || 18;
};

/**
 * Determine if transaction is intra-state or inter-state
 */
const isIntraState = (businessState, customerState) => {
  if (!businessState || !customerState) return true; // Default to intra-state
  return businessState.toLowerCase().trim() === customerState.toLowerCase().trim();
};

/**
 * Calculate GST for a given taxable amount
 * Intra-state: CGST (rate/2) + SGST (rate/2)
 * Inter-state: IGST (full rate)
 */
const calculateGST = (taxableAmount, gstRate, businessState, customerState) => {
  const intra = isIntraState(businessState, customerState);

  if (intra) {
    const halfRate = gstRate / 2;
    const cgst = roundToTwo(taxableAmount * halfRate / 100);
    const sgst = roundToTwo(taxableAmount * halfRate / 100);
    return {
      cgstRate: halfRate,
      cgstAmount: cgst,
      sgstRate: halfRate,
      sgstAmount: sgst,
      igstRate: 0,
      igstAmount: 0,
      totalTax: roundToTwo(cgst + sgst),
    };
  } else {
    const igst = roundToTwo(taxableAmount * gstRate / 100);
    return {
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: gstRate,
      igstAmount: igst,
      totalTax: igst,
    };
  }
};

/**
 * Calculate GST for order items (for invoice generation)
 * Returns per-item GST breakdown + totals
 */
const calculateOrderGST = (items, settings, customerState) => {
  const businessState = settings.business?.state || '';
  const invoiceItems = [];
  let totalTaxable = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  for (const item of items) {
    const hsnCode = item.productSnapshot?.hsnCode || item.hsnCode || null;
    const gstRate = getGSTRateFromSettings(settings, hsnCode);

    const itemTotal = item.price * item.quantity;
    const itemDiscount = item.discount || 0;
    const taxableValue = roundToTwo(itemTotal - itemDiscount);

    const gst = calculateGST(taxableValue, gstRate, businessState, customerState);

    invoiceItems.push({
      ...item,
      taxableValue,
      ...gst,
      total: roundToTwo(taxableValue + gst.totalTax),
    });

    totalTaxable += taxableValue;
    totalCGST += gst.cgstAmount;
    totalSGST += gst.sgstAmount;
    totalIGST += gst.igstAmount;
  }

  return {
    items: invoiceItems,
    taxableAmount: roundToTwo(totalTaxable),
    cgstTotal: roundToTwo(totalCGST),
    sgstTotal: roundToTwo(totalSGST),
    igstTotal: roundToTwo(totalIGST),
    totalTax: roundToTwo(totalCGST + totalSGST + totalIGST),
  };
};

/**
 * Calculate GST-inclusive price (for customer display)
 * Prices shown to customer already include GST
 */
const calculateGSTAmount = async (subtotal) => {
  const settings = await Settings.getSettings();
  const gstRate = settings.gst?.defaultRate || 18;

  // If price is GST-inclusive, extract GST component
  // Price = Taxable + GST => Taxable = Price / (1 + rate/100)
  const taxable = roundToTwo(subtotal / (1 + gstRate / 100));
  const gstAmount = roundToTwo(subtotal - taxable);

  return {
    taxableAmount: taxable,
    gstAmount,
    gstRate,
  };
};

function roundToTwo(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

module.exports = {
  getGSTRate,
  getGSTRateFromSettings,
  isIntraState,
  calculateGST,
  calculateOrderGST,
  calculateGSTAmount,
};
