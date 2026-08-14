const express = require('express');
const router = express.Router();
const {
  getSalesReport, getOrderReport, getProductReport, getStockReport,
  getGSTReport, getCategoryReport, getPaymentReport, exportReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.get('/sales', protect, getSalesReport);
router.get('/orders', protect, getOrderReport);
router.get('/products', protect, getProductReport);
router.get('/stock', protect, getStockReport);
router.get('/gst', protect, getGSTReport);
router.get('/category', protect, getCategoryReport);
router.get('/payment', protect, getPaymentReport);
router.get('/export/:type', protect, exportReport);

module.exports = router;
