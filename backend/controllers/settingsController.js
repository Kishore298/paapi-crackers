const Settings = require('../models/Settings');
const storageProvider = require('../utils/storageProvider');

// GET /api/settings
exports.getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings
exports.updateSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    const updates = req.body;

    // Update each section if provided
    const sections = [
      'business', 'website', 'orders', 'inventory', 'payments',
      'gst', 'delivery', 'notifications', 'roles', 'closedPage', 'pricing'
    ];

    for (const section of sections) {
      if (updates[section]) {
        settings[section] = { ...settings[section].toObject?.() || settings[section], ...updates[section] };
      }
    }

    if (updates.onlineSalesEnabled !== undefined) {
      settings.onlineSalesEnabled = updates.onlineSalesEnabled;
    }

    // Handle logo upload
    if (req.file) {
      if (settings.business.logo?.publicId) {
        await storageProvider.delete(settings.business.logo.publicId);
      }
      settings.business.logo = await storageProvider.upload(req.file.buffer, 'paapi-crackers/settings');
    }

    await settings.save();

    // If globalDiscount is updated, update all products
    if (updates.pricing && updates.pricing.globalDiscount !== undefined) {
      const globalDiscount = Number(updates.pricing.globalDiscount);
      const Product = require('../models/Product');
      
      // Update all products with auto-calculated discountPrice
      await Product.updateMany({}, [
        { 
          $set: { 
            discountPrice: { 
              $subtract: ["$mrp", { $multiply: ["$mrp", { $divide: [globalDiscount, 100] }] }] 
            } 
          } 
        }
      ]);
    }

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings/online-sales
exports.toggleOnlineSales = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    const { enabled } = req.body;

    settings.onlineSalesEnabled = enabled;
    await settings.save();

    // Emit to all connected clients
    try {
      const { getIO } = require('../config/socket');
      const io = getIO();
      io.emit('online-sales-status', { enabled: settings.onlineSalesEnabled });
    } catch (e) {
      // Socket might not be initialized
    }

    res.json({ success: true, data: { onlineSalesEnabled: settings.onlineSalesEnabled } });
  } catch (error) {
    next(error);
  }
};

// GET /api/settings/public (for customer frontend - no auth)
exports.getPublicSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();

    res.json({
      success: true,
      data: {
        business: {
          name: settings.business.name,
          logo: settings.business.logo,
          phone: settings.business.phone,
          email: settings.business.email,
          address: settings.business.address,
          state: settings.business.state,
        },
        website: settings.website,
        orders: {
          minOrderAmount: settings.orders.minOrderAmount,
          maxOrderAmount: settings.orders.maxOrderAmount,
        },
        payments: settings.payments,
        delivery: {
          enabled: settings.delivery.enabled,
          deliveryCharge: settings.delivery.deliveryCharge,
          freeDeliveryThreshold: settings.delivery.freeDeliveryThreshold,
          pickupEnabled: settings.delivery.pickupEnabled,
        },
        onlineSalesEnabled: settings.onlineSalesEnabled,
        closedPage: settings.closedPage,
        inventory: {
          showOutOfStock: settings.inventory.showOutOfStock,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
