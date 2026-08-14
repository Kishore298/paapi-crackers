const Banner = require('../models/Banner');
const storageProvider = require('../utils/storageProvider');

// GET /api/banners
exports.getBanners = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.active !== undefined) filter.active = req.query.active === 'true';

    const banners = await Banner.find(filter).sort({ displayOrder: 1 });
    res.json({ success: true, data: banners });
  } catch (error) {
    next(error);
  }
};

// POST /api/banners
exports.createBanner = async (req, res, next) => {
  try {
    const { title, link, displayOrder, active } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Banner image is required.' });
    }

    const image = await storageProvider.upload(req.file.buffer, 'paapi-crackers/banners');

    const banner = await Banner.create({
      title,
      image,
      link,
      displayOrder: parseInt(displayOrder) || 0,
      active: active !== 'false',
    });

    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    next(error);
  }
};

// PUT /api/banners/:id
exports.updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found.' });
    }

    const { title, link, displayOrder, active } = req.body;
    if (title !== undefined) banner.title = title;
    if (link !== undefined) banner.link = link;
    if (displayOrder !== undefined) banner.displayOrder = parseInt(displayOrder);
    if (active !== undefined) banner.active = active === true || active === 'true';

    if (req.file) {
      if (banner.image?.publicId) {
        await storageProvider.delete(banner.image.publicId);
      }
      banner.image = await storageProvider.upload(req.file.buffer, 'paapi-crackers/banners');
    }

    await banner.save();
    res.json({ success: true, data: banner });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/banners/:id
exports.deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found.' });
    }

    if (banner.image?.publicId) {
      await storageProvider.delete(banner.image.publicId);
    }

    await Banner.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Banner deleted.' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/banners/reorder
exports.reorderBanners = async (req, res, next) => {
  try {
    const { order } = req.body;
    const bulkOps = order.map((item) => ({
      updateOne: { filter: { _id: item.id }, update: { displayOrder: item.displayOrder } },
    }));
    await Banner.bulkWrite(bulkOps);

    const banners = await Banner.find().sort({ displayOrder: 1 });
    res.json({ success: true, data: banners });
  } catch (error) {
    next(error);
  }
};
