const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  updateStock, getBarcode, lookupBySKU, bulkUpload
} = require('../controllers/productController');
const { protect, optionalAuth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

// Public routes
router.get('/', optionalAuth, getProducts);
router.get('/lookup/:sku', lookupBySKU);
router.get('/:id', getProduct);

// Admin routes
router.post('/bulk-upload', protect, roleCheck('inventoryManager'), upload.single('file'), bulkUpload);
router.post('/', protect, roleCheck('inventoryManager'), upload.single('image'), createProduct);
router.put('/:id', protect, roleCheck('inventoryManager'), upload.single('image'), updateProduct);
router.delete('/:id', protect, roleCheck('superAdmin', 'admin'), deleteProduct);
router.put('/:id/stock', protect, roleCheck('inventoryManager'), updateStock);
router.get('/:id/barcode', protect, getBarcode);

module.exports = router;
