const Product = require('../models/Product');
const StockLedger = require('../models/StockLedger');

/**
 * Stock Service - manages all stock operations with ledger entries
 * Product.stock is the single authoritative source of truth
 * Every operation creates a StockLedger entry
 * Stock can never go negative
 */

const addStock = async (productId, quantity, userId, notes = '', session = null) => {
  const product = await Product.findById(productId).session(session);
  if (!product) throw new Error('Product not found');

  const previousStock = product.stock;
  const newStock = previousStock + quantity;

  product.stock = newStock;
  product.lastStockUpdate = new Date();
  await product.save({ session });

  await StockLedger.create(
    [
      {
        product: product._id,
        sku: product.sku,
        transactionType: 'Stock Added',
        quantityChange: quantity,
        previousStock,
        newStock,
        user: userId,
        notes,
      },
    ],
    { session }
  );

  return product;
};

const setOpeningStock = async (productId, quantity, userId, notes = '', session = null) => {
  const product = await Product.findById(productId).session(session);
  if (!product) throw new Error('Product not found');

  const previousStock = product.stock;
  product.stock = quantity;
  product.lastStockUpdate = new Date();
  await product.save({ session });

  await StockLedger.create(
    [
      {
        product: product._id,
        sku: product.sku,
        transactionType: 'Opening Stock',
        quantityChange: quantity - previousStock,
        previousStock,
        newStock: quantity,
        user: userId,
        notes,
      },
    ],
    { session }
  );

  return product;
};

const adjustStock = async (productId, newStockValue, userId, notes = '', session = null) => {
  const product = await Product.findById(productId).session(session);
  if (!product) throw new Error('Product not found');
  if (newStockValue < 0) throw new Error('Stock cannot be negative');

  const previousStock = product.stock;
  product.stock = newStockValue;
  product.lastStockUpdate = new Date();
  await product.save({ session });

  await StockLedger.create(
    [
      {
        product: product._id,
        sku: product.sku,
        transactionType: 'Adjustment',
        quantityChange: newStockValue - previousStock,
        previousStock,
        newStock: newStockValue,
        user: userId,
        notes,
      },
    ],
    { session }
  );

  return product;
};

/**
 * Deduct stock for an online sale
 * @param {Array} items - [{productId, quantity}]
 * @param {String} referenceId - Order ID
 * @param {String} userId - Admin/system user
 * @param {Object} session - Mongoose session for transaction
 */
const deductStockForOnlineSale = async (items, referenceId, userId = null, session = null) => {
  for (const item of items) {
    const product = await Product.findById(item.productId).session(session);
    if (!product) throw new Error(`Product not found: ${item.productId}`);
    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
    }

    const previousStock = product.stock;
    product.stock -= item.quantity;
    product.lastStockUpdate = new Date();
    await product.save({ session });

    await StockLedger.create(
      [
        {
          product: product._id,
          sku: product.sku,
          transactionType: 'Online Sale',
          quantityChange: -item.quantity,
          previousStock,
          newStock: product.stock,
          reference: `Order`,
          referenceId,
          user: userId,
          notes: `Online order stock deduction`,
        },
      ],
      { session }
    );
  }
};

const deductStockForPOSSale = async (items, referenceId, userId, session = null) => {
  for (const item of items) {
    const product = await Product.findById(item.productId).session(session);
    if (!product) throw new Error(`Product not found: ${item.productId}`);
    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
    }

    const previousStock = product.stock;
    product.stock -= item.quantity;
    product.lastStockUpdate = new Date();
    await product.save({ session });

    await StockLedger.create(
      [
        {
          product: product._id,
          sku: product.sku,
          transactionType: 'POS Sale',
          quantityChange: -item.quantity,
          previousStock,
          newStock: product.stock,
          reference: `POS Bill`,
          referenceId,
          user: userId,
          notes: `POS sale stock deduction`,
        },
      ],
      { session }
    );
  }
};

/**
 * Deduct stock for combo purchase - deducts each component product
 */
const deductStockForComboSale = async (comboProducts, quantity, referenceId, transactionType, userId, session = null) => {
  for (const cp of comboProducts) {
    const product = await Product.findById(cp.product).session(session);
    if (!product) throw new Error(`Product not found in combo: ${cp.product}`);

    const totalDeduct = cp.quantity * quantity;
    if (product.stock < totalDeduct) {
      throw new Error(`Insufficient stock for ${product.name} in combo. Available: ${product.stock}, Needed: ${totalDeduct}`);
    }

    const previousStock = product.stock;
    product.stock -= totalDeduct;
    product.lastStockUpdate = new Date();
    await product.save({ session });

    await StockLedger.create(
      [
        {
          product: product._id,
          sku: product.sku,
          transactionType: 'Combo Sale',
          quantityChange: -totalDeduct,
          previousStock,
          newStock: product.stock,
          reference: transactionType,
          referenceId,
          user: userId,
          notes: `Combo sale - component deduction`,
        },
      ],
      { session }
    );
  }
};

/**
 * Reverse stock deduction on order cancellation
 * Only reverses once (checks order.stockReversed flag)
 */
const reverseStockForCancellation = async (items, referenceId, userId, session = null) => {
  for (const item of items) {
    const productId = item.product || item.productId;
    const product = await Product.findById(productId).session(session);
    if (!product) continue; // Product may have been deleted

    const previousStock = product.stock;
    product.stock += item.quantity;
    product.lastStockUpdate = new Date();
    await product.save({ session });

    await StockLedger.create(
      [
        {
          product: product._id,
          sku: product.sku,
          transactionType: 'Cancellation/Reversal',
          quantityChange: item.quantity,
          previousStock,
          newStock: product.stock,
          reference: `Order Cancelled`,
          referenceId,
          user: userId,
          notes: `Stock restored due to order cancellation`,
        },
      ],
      { session }
    );
  }
};

module.exports = {
  addStock,
  setOpeningStock,
  adjustStock,
  deductStockForOnlineSale,
  deductStockForPOSSale,
  deductStockForComboSale,
  reverseStockForCancellation,
};
