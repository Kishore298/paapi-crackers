const Category = require('../models/Category');
const storageProvider = require('../utils/storageProvider');

// GET /api/categories
exports.getCategories = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.active !== undefined) filter.active = req.query.active === 'true';

    const categories = await Category.find(filter).sort({ displayOrder: 1, name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/:id
exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// POST /api/categories
exports.createCategory = async (req, res, next) => {
  try {
    const { name, displayOrder, active } = req.body;

    let image = {};
    if (req.file) {
      image = await storageProvider.upload(req.file.buffer, 'paapi-crackers/categories');
    }

    const category = await Category.create({
      name,
      image,
      displayOrder: parseInt(displayOrder) || 0,
      active: active !== 'false',
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// PUT /api/categories/:id
exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const { name, displayOrder, active } = req.body;

    if (name !== undefined) category.name = name;
    if (displayOrder !== undefined) category.displayOrder = parseInt(displayOrder);
    if (active !== undefined) category.active = active === true || active === 'true';

    if (req.file) {
      if (category.image?.publicId) {
        await storageProvider.delete(category.image.publicId);
      }
      category.image = await storageProvider.upload(req.file.buffer, 'paapi-crackers/categories');
    }

    await category.save();
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/categories/:id
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    if (category.image?.publicId) {
      await storageProvider.delete(category.image.publicId);
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted.' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/categories/reorder
exports.reorderCategories = async (req, res, next) => {
  try {
    const { order } = req.body; // [{id, displayOrder}]

    if (!Array.isArray(order)) {
      return res.status(400).json({ success: false, message: 'Order must be an array.' });
    }

    const bulkOps = order.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { displayOrder: item.displayOrder },
      },
    }));

    await Category.bulkWrite(bulkOps);

    const categories = await Category.find().sort({ displayOrder: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

// PUT /api/categories/:id/toggle
exports.toggleCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    category.active = !category.active;
    await category.save();

    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};
