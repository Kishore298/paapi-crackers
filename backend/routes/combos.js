const express = require('express');
const router = express.Router();
const { getCombos, getCombo, createCombo, updateCombo, deleteCombo } = require('../controllers/comboController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

// Public
router.get('/', getCombos);
router.get('/:id', getCombo);

// Admin
router.post('/', protect, roleCheck('inventoryManager'), upload.single('image'), createCombo);
router.put('/:id', protect, roleCheck('inventoryManager'), upload.single('image'), updateCombo);
router.delete('/:id', protect, roleCheck('superAdmin', 'admin'), deleteCombo);

module.exports = router;
