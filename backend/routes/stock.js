const express = require('express');
const router = express.Router();
const { getStock, addStock, adjustStock, getStockLedger, bulkUpdateStock } = require('../controllers/stockController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.get('/', protect, roleCheck('inventoryManager'), getStock);
router.put('/bulk-update', protect, roleCheck('inventoryManager', 'admin'), bulkUpdateStock);
router.put('/:productId/add', protect, roleCheck('inventoryManager'), addStock);
router.put('/:productId/adjust', protect, roleCheck('inventoryManager'), adjustStock);
router.get('/ledger', protect, roleCheck('inventoryManager'), getStockLedger);

module.exports = router;
