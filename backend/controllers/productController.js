const Product = require('../models/Product');
const { generateSKU } = require('../services/skuService');
const { generateBarcodeBase64 } = require('../services/barcodeService');
const Category = require('../models/Category');
const Settings = require('../models/Settings');
const storageProvider = require('../utils/storageProvider');
const stockService = require('../services/stockService');

// GET /api/products
exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, active, inStock, page = 1, limit = 100, sort = 'category' } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (active !== undefined) filter.active = active === 'true';
    if (inStock === 'true') filter.stock = { $gt: 0 };
    if (inStock === 'false') filter.stock = 0;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let sortObj = {};
    if (sort === 'price_asc') sortObj = { mrp: 1 };
    else if (sort === 'price_desc') sortObj = { mrp: -1 };
    else if (sort === 'name') sortObj = { name: 1 };
    else if (sort === 'stock') sortObj = { stock: 1 };
    else sortObj = { globalOrder: 1, category: 1, name: 1 };

    const [products, total] = await Promise.all([
      Product.find(filter).populate('category', 'name slug').sort(sortObj).skip(skip).limit(parseInt(limit)).lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// POST /api/products
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, category, mrp, youtubeVideoId, hsnCode, stock, active, pcs } = req.body;

    // Auto-generate SKU
    const sku = await generateSKU();

    // Handle image upload
    let image = {};
    if (req.file) {
      image = await storageProvider.upload(req.file.buffer, 'paapi-crackers/products');
    }

    // Extract YouTube video ID from URL if full URL provided
    let videoId = youtubeVideoId;
    if (videoId) {
      const match = videoId.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (match) videoId = match[1];
    }

    const product = await Product.create({
      name,
      description,
      category,
      sku,
      mrp: parseFloat(mrp),
      pcs,
      image,
      youtubeVideoId: videoId,
      hsnCode,
      stock: parseInt(stock) || 0,
      active: active !== 'false',
    });

    // Generate barcode for SKU
    const barcodeData = await generateBarcodeBase64(sku);
    product.barcodeData = barcodeData;
    await product.save();

    // Create opening stock ledger entry if stock > 0
    if (product.stock > 0) {
      await stockService.setOpeningStock(product._id, product.stock, req.user?._id, 'Initial stock on product creation');
    }

    await product.populate('category', 'name slug');

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const { name, description, category, mrp, youtubeVideoId, hsnCode, active, pcs } = req.body;

    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (category) product.category = category;
    if (mrp !== undefined) {
      product.mrp = parseFloat(mrp);
    }
    if (pcs !== undefined) product.pcs = pcs;
    if (hsnCode !== undefined) product.hsnCode = hsnCode;
    if (active !== undefined) product.active = active === true || active === 'true';

    // YouTube video ID extraction
    if (youtubeVideoId !== undefined) {
      let videoId = youtubeVideoId;
      if (videoId) {
        const match = videoId.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (match) videoId = match[1];
      }
      product.youtubeVideoId = videoId;
    }

    // Handle image update
    if (req.file) {
      // Delete old image
      if (product.image?.publicId) {
        await storageProvider.delete(product.image.publicId);
      }
      product.image = await storageProvider.upload(req.file.buffer, 'paapi-crackers/products');
    }

    await product.save();
    await product.populate('category', 'name slug');

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Delete image from cloud
    if (product.image?.publicId) {
      await storageProvider.delete(product.image.publicId);
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Product deleted.' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id/stock
exports.updateStock = async (req, res, next) => {
  try {
    const { action, quantity, notes } = req.body;
    const productId = req.params.id;

    let product;
    if (action === 'add') {
      product = await stockService.addStock(productId, parseInt(quantity), req.user._id, notes);
    } else if (action === 'set') {
      product = await stockService.adjustStock(productId, parseInt(quantity), req.user._id, notes);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action. Use "add" or "set".' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id/barcode
exports.getBarcode = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Regenerate if not present
    if (!product.barcodeData) {
      product.barcodeData = await generateBarcodeBase64(product.sku);
      await product.save();
    }

    res.json({
      success: true,
      data: {
        sku: product.sku,
        barcode: product.barcodeData,
        productName: product.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/lookup/:sku (barcode scan lookup)
exports.lookupBySKU = async (req, res, next) => {
  try {
    const product = await Product.findOne({ sku: req.params.sku }).populate('category', 'name slug');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found for this SKU.' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// POST /api/products/bulk-upload
exports.bulkUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No excel file uploaded.' });
    }
    const xlsx = require('xlsx');
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (!data || data.length === 0) {
      return res.status(400).json({ success: false, message: 'Excel file is empty.' });
    }

    // --- Pre-fetch all categories into a case-insensitive map ---
    const allCategories = await Category.find().lean();
    const categoryMap = new Map(); // lowercase name -> category doc
    for (const cat of allCategories) {
      categoryMap.set(cat.name.toLowerCase().trim(), cat);
    }

    // --- Pre-fetch all existing products by name (case-insensitive) ---
    const allProducts = await Product.find({}, 'name mrp pcs category description hsnCode active stock').lean();
    const productMap = new Map(); // lowercase name -> product doc
    for (const prod of allProducts) {
      productMap.set(prod.name.toLowerCase().trim(), prod);
    }

    // Default fallback category (first one in DB)
    const defaultCategory = allCategories.length > 0 ? allCategories[0] : null;

    // --- Helper: resolve a column value from a row using multiple possible header names ---
    const getCol = (row, ...keys) => {
      for (const key of keys) {
        // Try exact key, then case-insensitive match
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') return row[key];
        const found = Object.keys(row).find(k => k.toLowerCase().trim() === key.toLowerCase());
        if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== '') return row[found];
      }
      return undefined;
    };

    // --- Helper: resolve category ObjectId from a name string ---
    const resolveCategory = async (categoryName) => {
      if (!categoryName) return null;
      const normalized = String(categoryName).toLowerCase().trim();
      if (!normalized) return null;

      // Check existing map
      if (categoryMap.has(normalized)) {
        return categoryMap.get(normalized)._id;
      }

      // Auto-create the category
      const newCat = await Category.create({ name: String(categoryName).trim() });
      categoryMap.set(normalized, newCat.toObject());
      return newCat._id;
    };

    // --- Helper: parse active/status field ---
    const parseActive = (val) => {
      if (val === undefined || val === null) return undefined;
      const s = String(val).toLowerCase().trim();
      if (['true', 'yes', 'active', '1'].includes(s)) return true;
      if (['false', 'no', 'inactive', '0'].includes(s)) return false;
      return undefined;
    };

    let added = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // Excel row (1-indexed header + 1-indexed data)

      try {
        const name = getCol(row, 'name', 'product name', 'product_name', 'productname');
        const mrp = getCol(row, 'mrp', 'price', 'amount', 'rate');
        const pcs = getCol(row, 'pcs', 'pack inclusions', 'pack', 'pieces', 'quantity');
        const categoryName = getCol(row, 'category', 'category name', 'category_name', 'categoryname');
        const description = getCol(row, 'description', 'desc');
        const hsnCode = getCol(row, 'hsnCode', 'hsn code', 'hsn', 'hsn_code');
        const activeVal = getCol(row, 'active', 'status');
        const stockVal = getCol(row, 'stock', 'opening stock', 'qty');

        // Validate required fields
        if (!name) {
          skipped++;
          errors.push({ row: rowNum, reason: 'Missing product name' });
          continue;
        }
        if (mrp === undefined || mrp === null || isNaN(parseFloat(mrp))) {
          skipped++;
          errors.push({ row: rowNum, name: String(name), reason: 'Missing or invalid MRP/price' });
          continue;
        }

        // Resolve category
        let categoryId = null;
        if (categoryName) {
          categoryId = await resolveCategory(categoryName);
        }

        const normalizedName = String(name).toLowerCase().trim();
        const existingProduct = productMap.get(normalizedName);

        if (existingProduct) {
          // --- Update existing product ---
          const updateFields = { mrp: parseFloat(mrp) };
          if (pcs !== undefined) updateFields.pcs = String(pcs);
          if (categoryId) updateFields.category = categoryId;
          if (description !== undefined) updateFields.description = String(description);
          if (hsnCode !== undefined) updateFields.hsnCode = String(hsnCode);
          const parsedActive = parseActive(activeVal);
          if (parsedActive !== undefined) updateFields.active = parsedActive;

          await Product.findByIdAndUpdate(existingProduct._id, { $set: updateFields });
          updated++;
        } else {
          // --- Create new product ---
          // Category is required: use resolved, or fallback to default
          const finalCategoryId = categoryId || (defaultCategory ? defaultCategory._id : null);
          if (!finalCategoryId) {
            skipped++;
            errors.push({ row: rowNum, name: String(name), reason: 'No category specified and no default category exists' });
            continue;
          }

          const sku = await generateSKU();
          const barcodeData = await generateBarcodeBase64(sku);
          const stockNum = stockVal !== undefined ? parseInt(stockVal) || 0 : 0;
          const parsedActive = parseActive(activeVal);

          const newProduct = await Product.create({
            name: String(name).trim(),
            mrp: parseFloat(mrp),
            pcs: pcs !== undefined ? String(pcs) : undefined,
            description: description !== undefined ? String(description) : undefined,
            hsnCode: hsnCode !== undefined ? String(hsnCode) : undefined,
            sku,
            barcodeData,
            category: finalCategoryId,
            active: parsedActive !== undefined ? parsedActive : true,
            stock: stockNum,
          });

          // Create opening stock ledger entry if stock > 0
          if (stockNum > 0) {
            await stockService.setOpeningStock(newProduct._id, stockNum, req.user?._id, 'Opening stock from Excel bulk upload');
          }

          // Add to map so duplicates within the same file are detected
          productMap.set(normalizedName, newProduct.toObject ? newProduct.toObject() : newProduct);
          added++;
        }
      } catch (rowError) {
        skipped++;
        errors.push({ row: rowNum, reason: rowError.message || 'Unexpected error' });
      }
    }

    res.json({
      success: true,
      message: `Bulk upload completed. Added: ${added}, Updated: ${updated}${skipped > 0 ? `, Skipped: ${skipped}` : ''}.`,
      summary: { added, updated, skipped, total: data.length },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/reorder
exports.reorderProducts = async (req, res, next) => {
  const session = await Product.startSession();
  session.startTransaction();
  try {
    const { products } = req.body;
    if (!Array.isArray(products)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Invalid payload.' });
    }

    const bulkOps = products.map((p) => ({
      updateOne: {
        filter: { _id: p.id },
        update: { globalOrder: p.globalOrder },
      },
    }));

    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps, { session });
    }

    await session.commitTransaction();
    res.json({ success: true, message: 'Product order updated successfully.' });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};
