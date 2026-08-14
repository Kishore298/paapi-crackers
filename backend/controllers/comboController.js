const Combo = require('../models/Combo');
const Product = require('../models/Product');
const storageProvider = require('../utils/storageProvider');

// GET /api/combos
exports.getCombos = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.active !== undefined) filter.active = req.query.active === 'true';

    const combos = await Combo.find(filter)
      .populate('products.product', 'name sku sellingPrice stock image packQuantity')
      .sort({ createdAt: -1 });

    // Calculate availability for each combo from component stock
    const combosWithAvailability = combos.map((combo) => {
      const comboObj = combo.toObject();
      let maxAvailable = Infinity;

      for (const cp of comboObj.products) {
        if (cp.product) {
          const available = Math.floor(cp.product.stock / cp.quantity);
          maxAvailable = Math.min(maxAvailable, available);
        } else {
          maxAvailable = 0;
        }
      }

      comboObj.availableStock = maxAvailable === Infinity ? 0 : maxAvailable;
      return comboObj;
    });

    res.json({ success: true, data: combosWithAvailability });
  } catch (error) {
    next(error);
  }
};

// GET /api/combos/:id
exports.getCombo = async (req, res, next) => {
  try {
    const combo = await Combo.findById(req.params.id)
      .populate('products.product', 'name sku sellingPrice stock image packQuantity');

    if (!combo) {
      return res.status(404).json({ success: false, message: 'Combo not found.' });
    }

    const comboObj = combo.toObject();
    let maxAvailable = Infinity;
    for (const cp of comboObj.products) {
      if (cp.product) {
        const available = Math.floor(cp.product.stock / cp.quantity);
        maxAvailable = Math.min(maxAvailable, available);
      } else {
        maxAvailable = 0;
      }
    }
    comboObj.availableStock = maxAvailable === Infinity ? 0 : maxAvailable;

    res.json({ success: true, data: comboObj });
  } catch (error) {
    next(error);
  }
};

// POST /api/combos
exports.createCombo = async (req, res, next) => {
  try {
    const { name, description, price, savings, products, active } = req.body;

    let image = {};
    if (req.file) {
      image = await storageProvider.upload(req.file.buffer, 'paapi-crackers/combos');
    }

    // Parse products if sent as JSON string
    let parsedProducts = products;
    if (typeof products === 'string') {
      parsedProducts = JSON.parse(products);
    }

    // Validate all products exist
    for (const cp of parsedProducts) {
      const product = await Product.findById(cp.product);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product ${cp.product} not found.` });
      }
    }

    const combo = await Combo.create({
      name,
      description,
      image,
      price: parseFloat(price),
      savings: parseFloat(savings) || 0,
      products: parsedProducts,
      active: active !== 'false',
    });

    await combo.populate('products.product', 'name sku sellingPrice stock image packQuantity');

    res.status(201).json({ success: true, data: combo });
  } catch (error) {
    next(error);
  }
};

// PUT /api/combos/:id
exports.updateCombo = async (req, res, next) => {
  try {
    const combo = await Combo.findById(req.params.id);
    if (!combo) {
      return res.status(404).json({ success: false, message: 'Combo not found.' });
    }

    const { name, description, price, savings, products, active } = req.body;

    if (name !== undefined) combo.name = name;
    if (description !== undefined) combo.description = description;
    if (price !== undefined) combo.price = parseFloat(price);
    if (savings !== undefined) combo.savings = parseFloat(savings);
    if (active !== undefined) combo.active = active === true || active === 'true';

    if (products !== undefined) {
      let parsedProducts = products;
      if (typeof products === 'string') parsedProducts = JSON.parse(products);
      combo.products = parsedProducts;
    }

    if (req.file) {
      if (combo.image?.publicId) {
        await storageProvider.delete(combo.image.publicId);
      }
      combo.image = await storageProvider.upload(req.file.buffer, 'paapi-crackers/combos');
    }

    await combo.save();
    await combo.populate('products.product', 'name sku sellingPrice stock image packQuantity');

    res.json({ success: true, data: combo });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/combos/:id
exports.deleteCombo = async (req, res, next) => {
  try {
    const combo = await Combo.findById(req.params.id);
    if (!combo) {
      return res.status(404).json({ success: false, message: 'Combo not found.' });
    }

    if (combo.image?.publicId) {
      await storageProvider.delete(combo.image.publicId);
    }

    await Combo.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Combo deleted.' });
  } catch (error) {
    next(error);
  }
};
