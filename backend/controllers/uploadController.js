const storageProvider = require('../utils/storageProvider');

// POST /api/upload
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const folder = req.body.folder || 'paapi-crackers/general';
    const result = await storageProvider.upload(req.file.buffer, folder);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/upload
exports.deleteImage = async (req, res, next) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({ success: false, message: 'Public ID is required.' });
    }

    await storageProvider.delete(publicId);
    res.json({ success: true, message: 'Image deleted.' });
  } catch (error) {
    next(error);
  }
};
