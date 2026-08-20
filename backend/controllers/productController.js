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
    else sortObj = { category: 1, name: 1 };

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
    const { name, description, category, mrp, youtubeVideoId, hsnCode, stock, active } = req.body;

    // Fetch settings for global discount
    const settings = await Settings.getSettings();
    const globalDiscount = settings?.pricing?.globalDiscount || 0;
    const calculatedDiscountPrice = globalDiscount > 0 ? parseFloat(mrp) - (parseFloat(mrp) * globalDiscount / 100) : undefined;

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
      discountPrice: calculatedDiscountPrice,
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

    const { name, description, category, mrp, youtubeVideoId, hsnCode, active } = req.body;

    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (category) product.category = category;
    if (mrp !== undefined) {
      product.mrp = parseFloat(mrp);
      const settings = await Settings.getSettings();
      const globalDiscount = settings?.pricing?.globalDiscount || 0;
      product.discountPrice = globalDiscount > 0 ? product.mrp - (product.mrp * globalDiscount / 100) : undefined;
    }
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
