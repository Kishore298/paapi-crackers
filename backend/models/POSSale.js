const mongoose = require('mongoose');

const posSaleItemSchema = new mongoose.Schema(
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

const posSaleSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      unique: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customerName: {
      type: String,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    items: [posSaleItemSchema],
    subtotal: {
      type: Number,
      required: true,
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
    paymentMethod: {
      type: String,
      enum: ['cash', 'gpay', 'phonepe', 'paytm', 'other'],
      required: true,
    },
    billType: {
      type: String,
      enum: ['normal', 'gst'],
      default: 'normal',
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
    },
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('POSSale', posSaleSchema);
