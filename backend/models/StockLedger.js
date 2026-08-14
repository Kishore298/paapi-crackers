const mongoose = require('mongoose');

const stockLedgerSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
    },
    transactionType: {
      type: String,
      enum: [
        'Opening Stock',
        'Stock Added',
        'Online Sale',
        'POS Sale',
        'Return',
        'Adjustment',
        'Combo Sale',
        'Cancellation/Reversal',
      ],
      required: true,
    },
    quantityChange: {
      type: Number,
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },
    newStock: {
      type: Number,
      required: true,
      min: 0,
    },
    reference: {
      type: String,
      trim: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
stockLedgerSchema.index({ createdAt: -1 });
stockLedgerSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model('StockLedger', stockLedgerSchema);
