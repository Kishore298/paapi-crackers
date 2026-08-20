const Invoice = require('../models/Invoice');
const Settings = require('../models/Settings');
const gstService = require('./gstService');

/**
 * Invoice Service - generates normal and GST invoices
 * Snapshots business/customer/product data at generation time
 */

/**
 * Generate next invoice number based on prefix and count
 */
const generateInvoiceNumber = async (settings) => {
  const prefix = settings.gst?.invoicePrefix || 'INV';
  const fy = settings.gst?.financialYear || '2026-27';
  const fyShort = fy.replace('-', '').slice(-4) || '2627';

  const count = await Invoice.countDocuments();
  const num = String(count + 1).padStart(5, '0');

  return `${prefix}-${fyShort}-${num}`;
};

/**
 * Generate normal bill (no GST breakdown)
 */
const generateNormalInvoice = async ({ order, posSale, generatedBy }) => {
  const settings = await Settings.getSettings();
  const source = order || posSale;

  const invoiceNumber = await generateInvoiceNumber(settings);

  const customerSnapshot = order
    ? {
        name: order.customerDetails.name,
        phone: order.customerDetails.phone,
        email: order.customerDetails.email,
        address: order.shippingAddress?.address,
        city: order.shippingAddress?.city,
        state: order.shippingAddress?.state,
        pincode: order.shippingAddress?.pincode,
        gstin: order.gstin,
      }
    : {
        name: posSale.customerName || '',
        phone: posSale.customerPhone || '',
        gstin: posSale.gstin,
      };

  const items = source.items.map((item) => {
    const itemTotal = item.total !== undefined ? item.total : (item.price * item.quantity);
    return {
      productSnapshot: item.productSnapshot || {
        name: item.name || 'Product',
        sku: item.sku,
      },
      quantity: item.quantity,
      rate: item.price,
      discount: item.discount || 0,
      taxableValue: itemTotal,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: 0,
      igstAmount: 0,
      total: itemTotal,
    };
  });

  const invoice = await Invoice.create({
    invoiceNumber,
    order: order?._id,
    posSale: posSale?._id,
    type: 'normal',
    businessSnapshot: {
      name: settings.business.name,
      gstin: settings.business.gstin,
      address: settings.business.address,
      city: settings.business.city,
      state: settings.business.state,
      pincode: settings.business.pincode,
      phone: settings.business.phone,
      email: settings.business.email,
    },
    customerSnapshot,
    items,
    taxableAmount: source.subtotal,
    grandTotal: source.grandTotal,
    discount: source.discount || 0,
    deliveryCharge: source.deliveryCharge || 0,
    paymentMethod: source.paymentMethod,
    generatedBy,
  });

  // Link invoice to order/POS sale
  if (order) {
    order.invoice = invoice._id;
    await order.save();
  }
  if (posSale) {
    posSale.invoice = invoice._id;
    await posSale.save();
  }

  return invoice;
};

/**
 * Generate GST invoice with full tax breakdown
 */
const generateGSTInvoice = async ({ order, posSale, gstin, customerDetails, generatedBy }) => {
  const settings = await Settings.getSettings();
  const source = order || posSale;

  const invoiceNumber = await generateInvoiceNumber(settings);

  const customerState = order?.shippingAddress?.state || customerDetails?.state || '';

  // Calculate GST for each item
  const itemsForGST = source.items.map((item) => ({
    productSnapshot: item.productSnapshot || { name: item.name, sku: item.sku },
    quantity: item.quantity,
    price: item.price,
    discount: item.discount || 0,
    hsnCode: item.productSnapshot?.hsnCode || '',
  }));

  const gstCalc = gstService.calculateOrderGST(itemsForGST, settings, customerState);

  const invoiceItems = gstCalc.items.map((item) => ({
    productSnapshot: item.productSnapshot,
    quantity: item.quantity,
    rate: item.price,
    discount: item.discount,
    taxableValue: item.taxableValue,
    cgstRate: item.cgstRate,
    cgstAmount: item.cgstAmount,
    sgstRate: item.sgstRate,
    sgstAmount: item.sgstAmount,
    igstRate: item.igstRate,
    igstAmount: item.igstAmount,
    total: item.total,
  }));

  const customerSnapshot = order
    ? {
        name: order.customerDetails.name,
        phone: order.customerDetails.phone,
        email: order.customerDetails.email,
        address: order.shippingAddress?.address,
        city: order.shippingAddress?.city,
        state: order.shippingAddress?.state,
        pincode: order.shippingAddress?.pincode,
        gstin: gstin || order.gstin,
      }
    : {
        name: posSale.customerName || customerDetails?.name || '',
        phone: posSale.customerPhone || customerDetails?.phone || '',
        address: customerDetails?.address || '',
        city: customerDetails?.city || '',
        state: customerDetails?.state || '',
        pincode: customerDetails?.pincode || '',
        gstin: gstin || posSale.gstin,
      };

  const invoice = await Invoice.create({
    invoiceNumber,
    order: order?._id,
    posSale: posSale?._id,
    type: 'gst',
    businessSnapshot: {
      name: settings.business.name,
      gstin: settings.business.gstin || settings.gst?.businessGstin,
      address: settings.business.address,
      city: settings.business.city,
      state: settings.business.state,
      pincode: settings.business.pincode,
      phone: settings.business.phone,
      email: settings.business.email,
    },
    customerSnapshot,
    items: invoiceItems,
    taxableAmount: gstCalc.taxableAmount,
    cgstTotal: gstCalc.cgstTotal,
    sgstTotal: gstCalc.sgstTotal,
    igstTotal: gstCalc.igstTotal,
    totalTax: gstCalc.totalTax,
    discount: source.discount || 0,
    deliveryCharge: source.deliveryCharge || 0,
    grandTotal: gstCalc.taxableAmount + gstCalc.totalTax + (source.deliveryCharge || 0),
    paymentMethod: source.paymentMethod,
    generatedBy,
  });

  // Link invoice
  if (order) {
    order.invoice = invoice._id;
    if (gstin) order.gstin = gstin;
    await order.save();
  }
  if (posSale) {
    posSale.invoice = invoice._id;
    if (gstin) posSale.gstin = gstin;
    await posSale.save();
  }

  return invoice;
};

module.exports = {
  generateNormalInvoice,
  generateGSTInvoice,
  generateInvoiceNumber,
};
