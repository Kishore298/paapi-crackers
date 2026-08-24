const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema(
  {
    productSnapshot: {
      name: { type: String, required: true },
      sku: { type: String },
      hsnCode: { type: String },
      packQuantity: { type: String },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },

    taxableValue: {
      type: Number,
      required: true,
      min: 0,
    },
    cgstRate: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstRate: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstRate: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    posSale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'POSSale',
    },
    type: {
      type: String,
      enum: ['normal', 'gst'],
      required: true,
    },
    // Business snapshot at time of invoice generation
    businessSnapshot: {
      name: String,
      gstin: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
      phone: String,
      email: String,
    },
    // Customer snapshot at time of invoice generation
    customerSnapshot: {
      name: String,
      phone: String,
      email: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
      gstin: String,
    },
    items: [invoiceItemSchema],
    taxableAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    cgstTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    sgstTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    igstTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
      min: 0,
    },

    deliveryCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
