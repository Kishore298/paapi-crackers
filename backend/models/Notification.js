const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientType: {
      type: String,
      enum: ['customer', 'admin'],
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'order_confirmation',
        'order_dispatched',
        'order_cancelled',
        'payment_update',
        'announcement',
        'new_order',       // for admin
        'low_stock',       // for admin
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipientType: 1, recipientId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
