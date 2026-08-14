const express = require('express');
const router = express.Router();
const { getBanners, createBanner, updateBanner, deleteBanner, reorderBanners } = require('../controllers/bannerController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

// Public
router.get('/', getBanners);

// Admin
router.post('/', protect, roleCheck('superAdmin', 'admin'), upload.single('image'), createBanner);
router.put('/reorder', protect, roleCheck('superAdmin', 'admin'), reorderBanners);
router.put('/:id', protect, roleCheck('superAdmin', 'admin'), upload.single('image'), updateBanner);
router.delete('/:id', protect, roleCheck('superAdmin', 'admin'), deleteBanner);

module.exports = router;
