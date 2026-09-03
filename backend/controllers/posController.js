const mongoose = require('mongoose');
const POSSale = require('../models/POSSale');
const Product = require('../models/Product');
const Combo = require('../models/Combo');
const Customer = require('../models/Customer');
const Settings = require('../models/Settings');
const stockService = require('../services/stockService');
const gstService = require('../services/gstService');

// Helper: generate POS bill number
const generateBillNumber = async () => {
  const count = await POSSale.countDocuments();
  const date = new Date();
  const yearSuffix = date.getFullYear().toString().slice(-2);
  return `POS-${yearSuffix}${String(count + 1).padStart(4, '0')}`;
};

// POST /api/pos/sale
exports.createPOSSale = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { customerName, customerPhone, items, paymentMethod, billType, gstin } = req.body;

    if (!items || items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Sale must have at least one item.' });
    }

    if (!paymentMethod) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Payment method is required.' });
    }

    // Link to customer if phone provided
    let customerId = null;
    if (customerPhone) {
      let customer = await Customer.findOne({ phone: customerPhone.trim() }).session(session);
      if (!customer && customerName) {
        [customer] = await Customer.create([{ name: customerName.trim(), phone: customerPhone.trim(), source: 'admin' }], { session });
      }
      if (customer) {
        customerId = customer._id;
      }
    }

    const saleItems = [];
    const stockDeductions = [];
    let subtotal = 0;

    for (const item of items) {
      if (item.isCombo) {
        const combo = await Combo.findById(item.comboId).populate('products.product').session(session);
        if (!combo) {
          await session.abortTransaction();
          return res.status(400).json({ success: false, message: `Combo not found: ${item.comboId}` });
        }

        for (const cp of combo.products) {
          const product = await Product.findById(cp.product._id || cp.product).session(session);
          if (!product || product.stock < cp.quantity * item.quantity) {
            await session.abortTransaction();
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for ${product?.name || 'product'} in combo.`,
            });
          }
        }

        const itemTotal = combo.price * item.quantity;
        saleItems.push({
          combo: combo._id,
          isCombo: true,
          productSnapshot: { name: combo.name, image: combo.image?.url },
          quantity: item.quantity,
          price: combo.price,
          total: itemTotal,
        });

        subtotal += itemTotal;
        stockDeductions.push({ type: 'combo', comboProducts: combo.products, quantity: item.quantity });
      } else {
        const product = await Product.findById(item.productId).session(session);
        if (!product) {
          await session.abortTransaction();
          return res.status(400).json({ success: false, message: `Product not found: ${item.productId}` });
        }

        if (product.stock < item.quantity) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          });
        }

        const price = product.mrp;
        const itemTotal = price * item.quantity;

        saleItems.push({
          product: product._id,
          isCombo: false,
          productSnapshot: {
            name: product.name,
            sku: product.sku,
            image: product.image?.url,
            packQuantity: product.packQuantity,
            hsnCode: product.hsnCode,
          },
          quantity: item.quantity,
          price,
          total: itemTotal,
        });

        subtotal += itemTotal;
        stockDeductions.push({ type: 'product', productId: product._id, quantity: item.quantity });
      }
    }

    const gstInfo = await gstService.calculateGSTAmount(subtotal);
    const grandTotal = subtotal;
    const billNumber = await generateBillNumber();

    const [sale] = await POSSale.create(
      [
        {
          billNumber,
          customer: customerId,
          customerName: customerName || '',
          customerPhone: customerPhone || '',
          items: saleItems,
          subtotal,
          gstAmount: gstInfo.gstAmount,
          grandTotal,
          paymentMethod,
          billType: billType || 'normal',
          gstin,
          operator: req.user._id,
        },
      ],
      { session }
    );

    // Deduct stock
    for (const deduction of stockDeductions) {
      if (deduction.type === 'product') {
        await stockService.deductStockForPOSSale(
          [{ productId: deduction.productId, quantity: deduction.quantity }],
          sale._id,
          req.user._id,
          session
        );
      } else if (deduction.type === 'combo') {
        await stockService.deductStockForComboSale(
          deduction.comboProducts,
          deduction.quantity,
          sale._id,
          'POS Sale',
          req.user._id,
          session
        );
      }
    }

    // Update customer stats
    if (customerId) {
      await Customer.findByIdAndUpdate(
        customerId,
        {
          $inc: { totalOrders: 1, totalSpending: grandTotal },
          lastOrderDate: new Date(),
        },
        { session }
      );
    }

    await session.commitTransaction();
    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// GET /api/pos/sales
exports.getPOSSales = async (req, res, next) => {
  try {
    const { search, paymentMethod, billType, page = 1, limit = 20, startDate, endDate } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (billType) filter.billType = billType;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sales, total] = await Promise.all([
      POSSale.find(filter)
        .populate('operator', 'name')
        .populate('invoice', 'invoiceNumber type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      POSSale.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: sales,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/pos/sales/:id
exports.getPOSSale = async (req, res, next) => {
  try {
    const sale = await POSSale.findById(req.params.id)
      .populate('operator', 'name')
      .populate('customer', 'name phone email gstin')
      .populate('invoice');

    if (!sale) {
      return res.status(404).json({ success: false, message: 'POS sale not found.' });
    }

    res.json({ success: true, data: sale });
  } catch (error) {
    next(error);
  }
};

// GET /api/pos/stats/today
exports.getTodayStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filter = { createdAt: { $gte: today, $lt: tomorrow } };

    const sales = await POSSale.find(filter).lean();

    const stats = {
      totalSales: 0,
      totalCollections: 0,
      billCount: sales.length,
      cashCollection: 0,
      upiCollection: 0,
      gstBills: 0,
      normalBills: 0,
    };

    for (const sale of sales) {
      // GST-exclusive sales figure
      stats.totalSales += (sale.grandTotal - (sale.gstAmount || 0));
      stats.totalCollections += sale.grandTotal;

      if (sale.paymentMethod === 'cash') {
        stats.cashCollection += sale.grandTotal;
      } else {
        stats.upiCollection += sale.grandTotal;
      }

      if (sale.billType === 'gst') {
        stats.gstBills++;
      } else {
        stats.normalBills++;
      }
    }

    // Round values
    stats.totalSales = Math.round(stats.totalSales * 100) / 100;
    stats.totalCollections = Math.round(stats.totalCollections * 100) / 100;
    stats.cashCollection = Math.round(stats.cashCollection * 100) / 100;
    stats.upiCollection = Math.round(stats.upiCollection * 100) / 100;

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// PUT /api/pos/sales/:id/cancel
exports.cancelPOSSale = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reason } = req.body;
    const sale = await POSSale.findById(req.params.id).session(session);

    if (!sale) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'POS sale not found.' });
    }

    if (sale.status === 'Cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'POS sale is already cancelled.' });
    }

    // Set as cancelled
    sale.status = 'Cancelled';
    sale.cancellationReason = reason || 'Cancelled by admin';
    sale.cancelledAt = new Date();
    sale.cancelledBy = req.user._id;

    // Reverse stock
    const reversalItems = [];
    for (const item of sale.items) {
      if (!item.isCombo && item.product) {
        reversalItems.push({ product: item.product, quantity: item.quantity });
      }
      if (item.isCombo && item.combo) {
        const combo = await Combo.findById(item.combo).session(session);
        if (combo) {
          for (const cp of combo.products) {
            reversalItems.push({
              product: cp.product,
              quantity: cp.quantity * item.quantity,
            });
          }
        }
      }
    }

    await stockService.reverseStockForCancellation(
      reversalItems,
      sale._id,
      req.user._id,
      session
    );

    // Reverse Customer metrics
    if (sale.customer) {
      await Customer.findByIdAndUpdate(
        sale.customer,
        {
          $inc: { totalOrders: -1, totalSpending: -sale.grandTotal },
        },
        { session }
      );
    }

    await sale.save({ session });
    await session.commitTransaction();

    res.json({ success: true, data: sale });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};
