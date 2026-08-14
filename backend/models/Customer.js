const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
    },
    addresses: [addressSchema],
    active: {
      type: Boolean,
      default: true,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalSpending: {
      type: Number,
      default: 0,
    },
    lastOrderDate: {
      type: Date,
    },
    fcmToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for name+phone identification
customerSchema.index({ name: 1, phone: 1 });

module.exports = mongoose.model('Customer', customerSchema);
