const Product = require('../models/Product');

/**
 * Auto-generate unique SKU in format CRK-XXXXXX
 * Sequential, padded to 6 digits
 */
const generateSKU = async () => {
  const lastProduct = await Product.findOne({}, { sku: 1 })
    .sort({ createdAt: -1 })
    .lean();

  let nextNumber = 1;

  if (lastProduct && lastProduct.sku) {
    const match = lastProduct.sku.match(/CRK-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  // Ensure uniqueness by checking if the generated SKU already exists
  let sku = `CRK-${String(nextNumber).padStart(6, '0')}`;
  while (await Product.findOne({ sku }).lean()) {
    nextNumber++;
    sku = `CRK-${String(nextNumber).padStart(6, '0')}`;
  }

  return sku;
};

module.exports = { generateSKU };
