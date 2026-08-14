const Product = require('../models/Product');
const StockLedger = require('../models/StockLedger');
const stockService = require('../services/stockService');

// GET /api/stock (sorted by low stock first)
exports.getStock = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    const settings = await require('../models/Settings').getSettings();
    const lowStockThreshold = settings.inventory?.lowStockThreshold || 10;

    const filter = { active: true };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }
    if (status === 'out') filter.stock = 0;
    if (status === 'low') filter.stock = { $gt: 0, $lte: lowStockThreshold };
    if (status === 'in') filter.stock = { $gt: lowStockThreshold };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select('name sku stock category lastStockUpdate image')
        .populate('category', 'name')
        .sort({ stock: 1, name: 1 }) // Low stock first
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(filter),
    ]);

    // Add stock status
    const productsWithStatus = products.map((p) => ({
      ...p,
      stockStatus: p.stock === 0 ? 'Out of Stock' : p.stock <= lowStockThreshold ? 'Low Stock' : 'In Stock',
    }));

    res.json({
      success: true,
      data: productsWithStatus,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/stock/:productId/add
exports.addStock = async (req, res, next) => {
  try {
    const { quantity, notes } = req.body;
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be positive.' });
    }

    const product = await stockService.addStock(req.params.productId, parseInt(quantity), req.user._id, notes);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// PUT /api/stock/:productId/adjust
exports.adjustStock = async (req, res, next) => {
  try {
    const { newStock, notes } = req.body;
    if (newStock === undefined || newStock < 0) {
      return res.status(400).json({ success: false, message: 'New stock value must be non-negative.' });
    }

    const product = await stockService.adjustStock(req.params.productId, parseInt(newStock), req.user._id, notes);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// GET /api/stock/ledger
exports.getStockLedger = async (req, res, next) => {
  try {
    const { productId, transactionType, page = 1, limit = 50, startDate, endDate } = req.query;

    const filter = {};
    if (productId) filter.product = productId;
    if (transactionType) filter.transactionType = transactionType;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [entries, total] = await Promise.all([
      StockLedger.find(filter)
        .populate('product', 'name sku')
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      StockLedger.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: entries,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};
