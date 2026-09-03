const Customer = require('../models/Customer');
const Order = require('../models/Order');
const POSSale = require('../models/POSSale');
const Invoice = require('../models/Invoice');

// POST /api/customers/identify (customer login - name + phone)
exports.identifyCustomer = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required.' });
    }

    // Find or create customer
    let customer = await Customer.findOne({ phone: phone.trim() });

    if (!customer) {
      customer = await Customer.create({
        name: name.trim(),
        phone: phone.trim(),
      });
    } else {
      // Update name if different
      if (customer.name !== name.trim()) {
        customer.name = name.trim();
        await customer.save();
      }
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// POST /api/customers (Admin creates customer)
exports.createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, gstin } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required.' });
    }

    // Check if phone exists
    let customer = await Customer.findOne({ phone: phone.trim() });
    if (customer) {
      return res.status(400).json({ success: false, message: 'Customer with this phone already exists.' });
    }

    customer = await Customer.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : undefined,
      gstin: gstin ? gstin.trim().toUpperCase() : undefined,
      source: 'admin'
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// GET /api/customers
exports.getCustomers = async (req, res, next) => {
  try {
    const { search, active, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { gstin: searchRegex },
      ];
      
      // Fast lookup for order ID or POS receipt number
      const matchingOrders = await Order.find({ orderNumber: searchRegex }, 'customer').lean();
      const matchingPOS = await POSSale.find({ receiptNumber: searchRegex }, 'customer').lean();
      
      const customerIds = [
        ...matchingOrders.map(o => o.customer),
        ...matchingPOS.map(p => p.customer)
      ].filter(id => id); // remove nulls

      if (customerIds.length > 0) {
        filter.$or.push({ _id: { $in: customerIds } });
      }
    }
    if (active !== undefined) filter.active = active === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [customers, total] = await Promise.all([
      Customer.find(filter).sort({ lastOrderDate: -1, createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Customer.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: customers,
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

// GET /api/customers/:id
exports.getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    // Get order history
    const orders = await Order.find({ customer: customer._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Get POS history
    const posSales = await POSSale.find({ customer: customer._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Get invoice history
    const invoices = await Invoice.find({
      $or: [
        { order: { $in: orders.map((o) => o._id) } },
        { posSale: { $in: posSales.map((p) => p._id) } },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        ...customer.toObject(),
        orders,
        posSales,
        invoices,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/customers/:id
exports.updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const { name, phone, email, gstin, addresses, active, fcmToken } = req.body;

    if (name !== undefined) customer.name = name;
    if (phone !== undefined) customer.phone = phone;
    if (email !== undefined) customer.email = email;
    if (gstin !== undefined) customer.gstin = gstin;
    if (addresses !== undefined) customer.addresses = addresses;
    if (active !== undefined) customer.active = active;
    if (fcmToken !== undefined) customer.fcmToken = fcmToken;

    await customer.save();
    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// PUT /api/customers/:id/toggle
exports.toggleCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    customer.active = !customer.active;
    await customer.save();

    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};
