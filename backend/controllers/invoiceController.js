const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const POSSale = require('../models/POSSale');
const invoiceService = require('../services/invoiceService');
const { generateInvoicePDF } = require('../utils/pdfGenerator');

// POST /api/invoices/generate
exports.generateInvoice = async (req, res, next) => {
  try {
    const { orderId, posSaleId, type, gstin, customerDetails } = req.body;

    let order, posSale;
    if (orderId) {
      order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (posSaleId) {
      posSale = await POSSale.findById(posSaleId);
      if (!posSale) return res.status(404).json({ success: false, message: 'POS sale not found.' });
    }

    let invoice;
    if (type === 'gst') {
      // For GST invoice, GSTIN might be required
      const gstinValue = gstin || order?.gstin || posSale?.gstin;

      invoice = await invoiceService.generateGSTInvoice({
        order,
        posSale,
        gstin: gstinValue,
        customerDetails,
        generatedBy: req.user._id,
      });
    } else {
      invoice = await invoiceService.generateNormalInvoice({
        order,
        posSale,
        generatedBy: req.user._id,
      });
    }

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// GET /api/invoices
exports.getInvoices = async (req, res, next) => {
  try {
    const { type, search, page = 1, limit = 20, startDate, endDate } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.gstin': { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('generatedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Invoice.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/invoices/:id
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('generatedBy', 'name')
      .populate('order', 'orderNumber status')
      .populate('posSale', 'billNumber');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// GET /api/invoices/:id/pdf
exports.downloadInvoicePDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const pdfBuffer = await generateInvoicePDF(invoice);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
