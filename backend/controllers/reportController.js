const Order = require('../models/Order');
const POSSale = require('../models/POSSale');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const StockLedger = require('../models/StockLedger');
const Settings = require('../models/Settings');
const { exportToCSV, exportToExcel } = require('../utils/exportHelper');
const { generateInvoicePDF } = require('../utils/pdfGenerator');

// GET /api/reports/sales
exports.getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, period = 'daily', source } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate + 'T23:59:59.999Z');

    const matchFilter = { status: { $ne: 'Cancelled' } };
    if (Object.keys(dateFilter).length) matchFilter.createdAt = dateFilter;
    if (source) matchFilter.source = source;

    let dateFormat;
    switch (period) {
      case 'monthly': dateFormat = '%Y-%m'; break;
      case 'weekly': dateFormat = '%Y-W%V'; break;
      default: dateFormat = '%Y-%m-%d';
    }

    const orderSales = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          totalSales: { $sum: { $subtract: ['$grandTotal', { $ifNull: ['$gstAmount', 0] }] } },
          totalCollections: { $sum: '$grandTotal' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$grandTotal' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const posFilter = {};
    if (Object.keys(dateFilter).length) posFilter.createdAt = dateFilter;

    const posSalesData = await POSSale.aggregate([
      { $match: posFilter },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          totalSales: { $sum: { $subtract: ['$grandTotal', { $ifNull: ['$gstAmount', 0] }] } },
          totalCollections: { $sum: '$grandTotal' },
          saleCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data: { orderSales, posSalesData } });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/orders
exports.getOrderReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const [processing, dispatched, cancelled, totalAmount] = await Promise.all([
      Order.countDocuments({ ...filter, status: 'Processing' }),
      Order.countDocuments({ ...filter, status: 'Dispatched' }),
      Order.countDocuments({ ...filter, status: 'Cancelled' }),
      Order.aggregate([
        { $match: { ...filter, status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, gst: { $sum: { $ifNull: ['$gstAmount', 0] } } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        processing,
        dispatched,
        cancelled,
        totalSales: totalAmount[0] ? (totalAmount[0].total - totalAmount[0].gst) : 0,
        totalCollections: totalAmount[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/products
exports.getProductReport = async (req, res, next) => {
  try {
    const { startDate, endDate, type = 'best' } = req.query;

    const filter = { status: { $ne: 'Cancelled' } };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const sortDir = type === 'slow' ? 1 : -1;

    const productSales = await Order.aggregate([
      { $match: filter },
      { $unwind: '$items' },
      {
        $group: {
          _id: { name: '$items.productSnapshot.name', sku: '$items.productSnapshot.sku' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: sortDir } },
      { $limit: 50 },
    ]);

    res.json({ success: true, data: productSales });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/stock
exports.getStockReport = async (req, res, next) => {
  try {
    const { type = 'current' } = req.query;
    const settings = await Settings.getSettings();
    const threshold = settings.inventory?.lowStockThreshold || 10;

    let filter = { active: true };
    if (type === 'low') filter.stock = { $gt: 0, $lte: threshold };
    if (type === 'out') filter.stock = 0;

    const products = await Product.find(filter)
      .select('name sku stock category lastStockUpdate')
      .populate('category', 'name')
      .sort({ stock: 1 })
      .lean();

    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/gst
exports.getGSTReport = async (req, res, next) => {
  try {
    const { startDate, endDate, type } = req.query;

    const filter = { type: 'gst' };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const invoices = await Invoice.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate totals
    const totals = invoices.reduce(
      (acc, inv) => {
        acc.taxableAmount += inv.taxableAmount || 0;
        acc.cgstTotal += inv.cgstTotal || 0;
        acc.sgstTotal += inv.sgstTotal || 0;
        acc.igstTotal += inv.igstTotal || 0;
        acc.totalTax += inv.totalTax || 0;
        acc.grandTotal += inv.grandTotal || 0;

        // B2B vs B2C
        if (inv.customerSnapshot?.gstin) {
          acc.b2b.count++;
          acc.b2b.total += inv.grandTotal || 0;
        } else {
          acc.b2c.count++;
          acc.b2c.total += inv.grandTotal || 0;
        }

        return acc;
      },
      {
        taxableAmount: 0,
        cgstTotal: 0,
        sgstTotal: 0,
        igstTotal: 0,
        totalTax: 0,
        grandTotal: 0,
        b2b: { count: 0, total: 0 },
        b2c: { count: 0, total: 0 },
      }
    );

    res.json({ success: true, data: { invoices, totals } });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/category
exports.getCategoryReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = { status: { $ne: 'Cancelled' } };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const categorySales = await Order.aggregate([
      { $match: filter },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productInfo' } },
      { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'categories', localField: 'productInfo.category', foreignField: '_id', as: 'categoryInfo' } },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$categoryInfo.name', 'Uncategorized'] },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    res.json({ success: true, data: categorySales });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/payment
exports.getPaymentReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = { paymentStatus: 'Completed' };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const onlinePayments = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$grandTotal' },
          count: { $sum: 1 },
        },
      },
    ]);

    const posPayments = await POSSale.aggregate([
      { $match: startDate || endDate ? { createdAt: filter.createdAt } : {} },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$grandTotal' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ success: true, data: { onlinePayments, posPayments } });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/export/:type
exports.exportReport = async (req, res, next) => {
  try {
    const { type } = req.params; // csv, excel, pdf
    const { report, startDate, endDate } = req.query;

    // Build report data based on report type
    let data = [];
    let columns = [];
    let fileName = 'report';

    const filter = { status: { $ne: 'Cancelled' } };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    switch (report) {
      case 'sales': {
        const orders = await Order.find(filter).lean();
        data = orders.map((o) => ({
          orderNumber: o.orderNumber,
          date: new Date(o.createdAt).toLocaleDateString('en-IN'),
          customer: o.customerDetails?.name,
          items: o.items?.length,
          subtotal: o.subtotal,
          discount: o.discount,
          gst: o.gstAmount,
          grandTotal: o.grandTotal,
          status: o.status,
          paymentStatus: o.paymentStatus,
        }));
        columns = [
          { header: 'Order #', key: 'orderNumber', width: 20 },
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Customer', key: 'customer', width: 20 },
          { header: 'Items', key: 'items', width: 10 },
          { header: 'Subtotal', key: 'subtotal', width: 12 },
          { header: 'Discount', key: 'discount', width: 12 },
          { header: 'GST', key: 'gst', width: 12 },
          { header: 'Grand Total', key: 'grandTotal', width: 12 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Payment', key: 'paymentStatus', width: 15 },
        ];
        fileName = 'sales-report';
        break;
      }

      case 'stock': {
        const products = await Product.find({ active: true })
          .populate('category', 'name')
          .sort({ stock: 1 })
          .lean();
        data = products.map((p) => ({
          name: p.name,
          sku: p.sku,
          category: p.category?.name,
          stock: p.stock,
          price: p.sellingPrice,
          lastUpdate: p.lastStockUpdate ? new Date(p.lastStockUpdate).toLocaleDateString('en-IN') : '',
        }));
        columns = [
          { header: 'Product', key: 'name', width: 30 },
          { header: 'SKU', key: 'sku', width: 15 },
          { header: 'Category', key: 'category', width: 20 },
          { header: 'Stock', key: 'stock', width: 10 },
          { header: 'Price', key: 'price', width: 12 },
          { header: 'Last Update', key: 'lastUpdate', width: 15 },
        ];
        fileName = 'stock-report';
        break;
      }

      case 'gst': {
        const invoices = await Invoice.find({ type: 'gst', ...(filter.createdAt ? { createdAt: filter.createdAt } : {}) }).lean();
        data = invoices.map((inv) => ({
          invoiceNumber: inv.invoiceNumber,
          date: new Date(inv.createdAt).toLocaleDateString('en-IN'),
          customer: inv.customerSnapshot?.name,
          gstin: inv.customerSnapshot?.gstin || '',
          taxable: inv.taxableAmount,
          cgst: inv.cgstTotal,
          sgst: inv.sgstTotal,
          igst: inv.igstTotal,
          totalTax: inv.totalTax,
          grandTotal: inv.grandTotal,
        }));
        columns = [
          { header: 'Invoice #', key: 'invoiceNumber', width: 20 },
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Customer', key: 'customer', width: 20 },
          { header: 'GSTIN', key: 'gstin', width: 20 },
          { header: 'Taxable', key: 'taxable', width: 12 },
          { header: 'CGST', key: 'cgst', width: 10 },
          { header: 'SGST', key: 'sgst', width: 10 },
          { header: 'IGST', key: 'igst', width: 10 },
          { header: 'Total Tax', key: 'totalTax', width: 12 },
          { header: 'Grand Total', key: 'grandTotal', width: 12 },
        ];
        fileName = 'gst-report';
        break;
      }

      default:
        return res.status(400).json({ success: false, message: 'Invalid report type.' });
    }

    if (type === 'csv') {
      const csv = exportToCSV(data, columns.map((c) => ({ label: c.header, value: c.key })));
      res.set({ 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="${fileName}.csv"` });
      return res.send(csv);
    }

    if (type === 'excel') {
      const buffer = await exportToExcel(data, columns, fileName);
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}.xlsx"`,
      });
      return res.send(Buffer.from(buffer));
    }

    return res.status(400).json({ success: false, message: 'Supported export types: csv, excel' });
  } catch (error) {
    next(error);
  }
};
