const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    sku: {
      type: String,
      unique: true,
      index: true,
    },
    mrp: {
      type: Number,
      min: 0,
      required: [true, 'MRP is required']
    },
    pcs: {
      type: String,
      trim: true,
    },
    image: {
      url: { type: String },
      publicId: { type: String },
    },
    youtubeVideoId: {
      type: String,
      trim: true,
    },
    hsnCode: {
      type: String,
      trim: true,
    },
    // Stock is the single authoritative source of truth
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    barcodeData: {
      type: String,
    },
    lastStockUpdate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search
productSchema.index({ name: 'text', sku: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
