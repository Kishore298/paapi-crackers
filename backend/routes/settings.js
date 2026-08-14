const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, toggleOnlineSales, getPublicSettings } = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

// Public
router.get('/public', getPublicSettings);

// Admin
router.get('/', protect, getSettings);
router.put('/', protect, roleCheck('superAdmin', 'admin'), upload.single('logo'), updateSettings);
router.put('/online-sales', protect, roleCheck('superAdmin', 'admin'), toggleOnlineSales);

module.exports = router;
