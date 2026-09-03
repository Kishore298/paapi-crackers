const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    combo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Combo',
    },
    isCombo: {
      type: Boolean,
      default: false,
    },
    // Snapshot of product/combo at time of order
    productSnapshot: {
      name: String,
      sku: String,
      image: String,
      packQuantity: String,
      hsnCode: String,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    // Customer details snapshot
    customerDetails: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
    },
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    gstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Processing', 'Dispatched', 'Cancelled'],
      default: 'Processing',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed'],
      default: 'Pending',
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    cancelledBy: {
      type: String,
      enum: ['customer', 'admin'],
    },
    cancelledAt: {
      type: Date,
    },
    source: {
      type: String,
      enum: ['online', 'pos'],
      default: 'online',
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },
    stockDeducted: {
      type: Boolean,
      default: false,
    },
    stockReversed: {
      type: Boolean,
      default: false,
    },
    statusHistory: [
      {
        status: String,
        reason: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: String
      }
    ]
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
