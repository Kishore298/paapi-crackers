const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    // Singleton pattern - only one settings document
    _id: {
      type: String,
      default: 'app-settings',
    },

    business: {
      name: { type: String, default: 'Paapi Crackers' },
      logo: {
        url: { type: String },
        publicId: { type: String },
      },
      gstin: { type: String, trim: true, uppercase: true },
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, default: 'Tamil Nadu', trim: true },
      pincode: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
    },

    website: {
      title: { type: String, default: 'Paapi Crackers' },
      description: { type: String },
      contactInfo: {
        phone: { type: String },
        email: { type: String },
        address: { type: String },
        whatsapp: { type: String },
      },
    },

    orders: {
      minOrderAmount: { type: Number, default: 0 },
      maxOrderAmount: { type: Number, default: 0 }, // 0 = no limit
      cancellationEnabled: { type: Boolean, default: true },
    },

    inventory: {
      deductStockOnOrder: { type: Boolean, default: true },
      showOutOfStock: { type: Boolean, default: true },
      lowStockThreshold: { type: Number, default: 10 },
    },

    payments: {
      cash: {
        enabled: { type: Boolean, default: true },
      },
      gpay: {
        enabled: { type: Boolean, default: false },
        upiId: { type: String, trim: true },
        displayName: { type: String, default: 'GPay' },
      },
      phonepe: {
        enabled: { type: Boolean, default: false },
        upiId: { type: String, trim: true },
        displayName: { type: String, default: 'PhonePe' },
      },
      paytm: {
        enabled: { type: Boolean, default: false },
        upiId: { type: String, trim: true },
        displayName: { type: String, default: 'Paytm' },
      },
      otherUpi: {
        enabled: { type: Boolean, default: false },
        upiId: { type: String, trim: true },
        displayName: { type: String, default: 'UPI' },
      },
      paymentInstructions: { type: String, default: '' },
    },

    gst: {
      enabled: { type: Boolean, default: true },
      businessGstin: { type: String, trim: true, uppercase: true },
      invoicePrefix: { type: String, default: 'INV', trim: true },
      financialYear: { type: String, default: '2026-27', trim: true },
      // GST rate configured here, NOT on Product
      defaultRate: { type: Number, default: 18 },
      // Optional HSN-specific rate overrides for future use
      hsnRates: {
        type: Map,
        of: Number,
        default: {},
      },
      isPriceInclusive: { type: Boolean, default: false },
    },

    pricing: {
      globalDiscount: { type: Number, default: 0, min: 0, max: 100 },
    },

    delivery: {
      enabled: { type: Boolean, default: true },
      deliveryCharge: { type: Number, default: 0 },
      freeDeliveryThreshold: { type: Number, default: 0 }, // 0 = no free delivery
      serviceableLocations: [{ type: String, trim: true }],
      pickupEnabled: { type: Boolean, default: false },
      pickupAddress: { type: String, trim: true },
    },

    notifications: {
      inAppEnabled: { type: Boolean, default: true },
      pushEnabled: { type: Boolean, default: false },
      firebaseConfig: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },

    roles: {
      superAdmin: { permissions: { type: [String], default: ['all'] } },
      admin: { permissions: { type: [String], default: ['all'] } },
      posOperator: { permissions: { type: [String], default: ['pos', 'products.read', 'customers.read'] } },
      inventoryManager: { permissions: { type: [String], default: ['products', 'stock', 'categories'] } },
      orderManager: { permissions: { type: [String], default: ['orders', 'customers.read', 'products.read'] } },
    },

    onlineSalesEnabled: {
      type: Boolean,
      default: true,
    },

    // Online Orders Closed page customization
    closedPage: {
      title: { type: String, default: 'Online Orders Closed' },
      message: { type: String, default: 'We are currently not accepting online orders. Please check back later!' },
      image: {
        url: { type: String },
        publicId: { type: String },
      },
      reopeningDate: { type: Date },
      showContactUs: { type: Boolean, default: true },
      showCallButton: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure singleton
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findById('app-settings');
  if (!settings) {
    settings = await this.create({ _id: 'app-settings' });
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
