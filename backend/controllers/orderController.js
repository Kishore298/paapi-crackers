const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Combo = require('../models/Combo');
const Customer = require('../models/Customer');
const Settings = require('../models/Settings');
const stockService = require('../services/stockService');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');
const gstService = require('../services/gstService');
const { generateInvoicePDF } = require('../utils/pdfGenerator');

// Helper: generate order number
const generateOrderNumber = async () => {
  const count = await Order.countDocuments();
  const date = new Date();
  const prefix = `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  return `${prefix}-${String(count + 1).padStart(5, '0')}`;
};

// POST /api/orders (customer places order)
exports.createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { customerId, customerDetails, shippingAddress, items, gstin, paymentMethod } = req.body;

    const settings = await Settings.getSettings();

    // Validate online sales enabled
    if (!settings.onlineSalesEnabled) {
      await session.abortTransaction();
      return res.status(503).json({ success: false, message: 'Online orders are currently closed.' });
    }

    // Validate customer
    if (!customerId || !customerDetails?.name || !customerDetails?.phone) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Customer details required.' });
    }

    // Validate shipping address
    if (!shippingAddress?.address || !shippingAddress?.city || !shippingAddress?.state || !shippingAddress?.pincode) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Complete shipping address required.' });
    }

    if (!items || items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Order must have at least one item.' });
    }

    // Validate and build order items with server-side price calculation
    const orderItems = [];
    const stockDeductions = [];
    let subtotal = 0;
    let totalDiscount = 0;

    for (const item of items) {
      if (item.isCombo) {
        // Handle combo
        const combo = await Combo.findById(item.comboId).populate('products.product').session(session);
        if (!combo || !combo.active) {
          await session.abortTransaction();
          return res.status(400).json({ success: false, message: `Combo not found or inactive: ${item.comboId}` });
        }

        // Validate combo component stock
        for (const cp of combo.products) {
          const product = await Product.findById(cp.product._id || cp.product).session(session);
          if (!product || product.stock < cp.quantity * item.quantity) {
            await session.abortTransaction();
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for ${product?.name || 'product'} in combo ${combo.name}.`,
            });
          }
        }

        const itemTotal = combo.price * item.quantity;
        orderItems.push({
          combo: combo._id,
          isCombo: true,
          productSnapshot: {
            name: combo.name,
            image: combo.image?.url,
          },
          quantity: item.quantity,
          price: combo.price,
          discount: 0,
          total: itemTotal,
        });

        subtotal += itemTotal;

        // Queue combo stock deductions
        stockDeductions.push({
          type: 'combo',
          comboProducts: combo.products,
          quantity: item.quantity,
        });
      } else {
        // Handle regular product
        const product = await Product.findById(item.productId).session(session);
        if (!product || !product.active) {
          await session.abortTransaction();
          return res.status(400).json({ success: false, message: `Product not found or inactive: ${item.productId}` });
        }

        if (product.stock < item.quantity) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          });
        }

        // Use MRP as base, calculate discount using settings global discount
        const globalDiscount = settings.pricing?.globalDiscount || 0;
        const discountPrice = globalDiscount > 0 
          ? product.mrp - (product.mrp * globalDiscount / 100) 
          : product.mrp;
          
        const price = discountPrice < product.mrp ? discountPrice : product.mrp;
        const discount = discountPrice < product.mrp 
          ? (product.mrp - discountPrice) * item.quantity
          : 0;
        const itemTotal = price * item.quantity;

        orderItems.push({
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
          discount,
          total: itemTotal,
        });

        subtotal += itemTotal;
        totalDiscount += discount;

        stockDeductions.push({
          type: 'product',
          productId: product._id,
          quantity: item.quantity,
        });
      }
    }

    // Calculate delivery charge
    let deliveryCharge = settings.delivery?.deliveryCharge || 0;
    if (settings.delivery?.freeDeliveryThreshold > 0 && subtotal >= settings.delivery.freeDeliveryThreshold) {
      deliveryCharge = 0;
    }

    // Validate min/max order
    if (settings.orders?.minOrderAmount > 0 && subtotal < settings.orders.minOrderAmount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ₹${settings.orders.minOrderAmount}.`,
      });
    }
    if (settings.orders?.maxOrderAmount > 0 && subtotal > settings.orders.maxOrderAmount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Maximum order amount is ₹${settings.orders.maxOrderAmount}.`,
      });
    }

    // Calculate GST amount (prices are GST-inclusive)
    const gstInfo = await gstService.calculateGSTAmount(subtotal);

    const grandTotal = subtotal + deliveryCharge;
    const orderNumber = await generateOrderNumber();

    // Create order
    const [order] = await Order.create(
      [
        {
          orderNumber,
          customer: customerId,
          customerDetails,
          shippingAddress,
          items: orderItems,
          subtotal,
          discount: totalDiscount,
          deliveryCharge,
          gstAmount: gstInfo.gstAmount,
          grandTotal,
          status: 'Processing',
          paymentStatus: 'Pending',
          paymentMethod,
          gstin,
          source: 'online',
          stockDeducted: true,
        },
      ],
      { session }
    );

    // Deduct stock
    for (const deduction of stockDeductions) {
      if (deduction.type === 'product') {
        await stockService.deductStockForOnlineSale(
          [{ productId: deduction.productId, quantity: deduction.quantity }],
          order._id,
          null,
          session
        );
      } else if (deduction.type === 'combo') {
        await stockService.deductStockForComboSale(
          deduction.comboProducts,
          deduction.quantity,
          order._id,
          'Online Order',
          null,
          session
        );
      }
    }

    // Update customer stats
    await Customer.findByIdAndUpdate(
      customerId,
      {
        $inc: { totalOrders: 1, totalSpending: grandTotal },
        lastOrderDate: new Date(),
      },
      { session }
    );

    await session.commitTransaction();

    // Post-transaction notifications (non-critical)
    notificationService.notifyNewOrder(order).catch(console.error);
    notificationService.notifyOrderConfirmation(order).catch(console.error);
    // Generate order summary PDF and send email
    (async () => {
      try {
        const settings = await Settings.getSettings();
        const mockInvoice = {
          invoiceNumber: `ORD-${order.orderNumber}`,
          type: 'normal',
          businessSnapshot: settings.business,
          customerSnapshot: {
            name: order.customerDetails.name,
            phone: order.customerDetails.phone,
            email: order.customerDetails.email,
            address: order.shippingAddress?.address,
            city: order.shippingAddress?.city,
            state: order.shippingAddress?.state,
            pincode: order.shippingAddress?.pincode,
          },
          items: order.items.map(item => ({
            productSnapshot: item.productSnapshot || { name: item.name },
            quantity: item.quantity,
            rate: item.price,
            total: item.total !== undefined ? item.total : item.price * item.quantity,
          })),
          taxableAmount: order.subtotal,
          grandTotal: order.grandTotal,
          discount: order.discount || 0,
          deliveryCharge: order.deliveryCharge || 0,
        };
        const pdfBuffer = await generateInvoicePDF(mockInvoice);
        await emailService.sendOrderConfirmationEmail(order, pdfBuffer);
      } catch (err) {
        console.error('Failed to send email with PDF:', err);
        // Fallback without PDF
        emailService.sendOrderConfirmationEmail(order).catch(console.error);
      }
    })();

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// GET /api/orders
exports.getOrders = async (req, res, next) => {
  try {
    const {
      search, status, paymentStatus, source, page = 1, limit = 20,
      startDate, endDate, sort = '-createdAt',
    } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerDetails.name': { $regex: search, $options: 'i' } },
        { 'customerDetails.phone': { $regex: search, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (source) filter.source = source;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('customer', 'name phone email')
        .populate('invoice', 'invoiceNumber type')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const query = isObjectId ? { _id: req.params.id } : { orderNumber: req.params.id };

    const order = await Order.findOne(query)
      .populate('customer', 'name phone email gstin')
      .populate('invoice');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/customer/:customerId
exports.getCustomerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.params.customerId })
      .populate('invoice', 'invoiceNumber type')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { status, reason, cancelledBy } = req.body;
    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Validate status transitions
    if (order.status === 'Cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Cannot change status of a cancelled order.' });
    }
    if (order.status === 'Dispatched') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Cannot change status after dispatch.' });
    }

    if (status === 'Dispatched' && order.status === 'Processing') {
      order.status = 'Dispatched';
      await order.save({ session });
      await session.commitTransaction();

      notificationService.notifyOrderDispatched(order).catch(console.error);
      emailService.sendOrderDispatchedEmail(order).catch(console.error);
    } else if (status === 'Cancelled' && order.status === 'Processing') {
      if (!reason) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: 'Cancellation reason is required.' });
      }

      order.status = 'Cancelled';
      order.cancellationReason = reason;
      order.cancelledBy = cancelledBy || 'admin';
      order.cancelledAt = new Date();

      // Reverse stock - only if it was deducted and not yet reversed
      if (order.stockDeducted && !order.stockReversed) {
        // Build reversal items from order items (non-combo products)
        const reversalItems = [];
        for (const item of order.items) {
          if (!item.isCombo && item.product) {
            reversalItems.push({ product: item.product, quantity: item.quantity });
          }
          // For combos, reverse component products
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
          order._id,
          req.user._id,
          session
        );
        order.stockReversed = true;
      }

      // Reverse Customer metrics
      if (order.customer) {
        await Customer.findByIdAndUpdate(
          order.customer,
          {
            $inc: { totalOrders: -1, totalSpending: -order.grandTotal },
          },
          { session }
        );
      }

      await order.save({ session });
      await session.commitTransaction();

      notificationService.notifyOrderCancelled(order, reason).catch(console.error);
      emailService.sendOrderCancellationEmail(order, reason).catch(console.error);
    } else {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Invalid status transition: ${order.status} → ${status}` });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// PUT /api/orders/:id/payment
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus, paymentMethod } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    order.paymentStatus = paymentStatus;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    await order.save();

    notificationService.notifyPaymentUpdate(order).catch(console.error);

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
