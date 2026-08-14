const express = require('express');
const router = express.Router();
const {
  getCategories, getCategory, createCategory, updateCategory,
  deleteCategory, reorderCategories, toggleCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

// Public
router.get('/', getCategories);
router.get('/:id', getCategory);

// Admin
router.post('/', protect, roleCheck('inventoryManager'), upload.single('image'), createCategory);
router.put('/reorder', protect, roleCheck('inventoryManager'), reorderCategories);
router.put('/:id', protect, roleCheck('inventoryManager'), upload.single('image'), updateCategory);
router.put('/:id/toggle', protect, roleCheck('inventoryManager'), toggleCategory);
router.delete('/:id', protect, roleCheck('superAdmin', 'admin'), deleteCategory);

module.exports = router;
