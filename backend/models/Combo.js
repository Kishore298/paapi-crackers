const mongoose = require('mongoose');

const comboProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const comboSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Combo name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      url: { type: String },
      publicId: { type: String },
    },
    price: {
      type: Number,
      required: [true, 'Combo price is required'],
      min: 0,
    },
    savings: {
      type: Number,
      default: 0,
      min: 0,
    },
    products: {
      type: [comboProductSchema],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'Combo must include at least one product',
      },
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// No stock field on Combo - availability is derived from component product stocks

module.exports = mongoose.model('Combo', comboSchema);
