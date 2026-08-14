const express = require('express');
const router = express.Router();
const {
  createOrder, getOrders, getOrder, getCustomerOrders,
  updateOrderStatus, updatePaymentStatus,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const onlineSalesCheck = require('../middleware/onlineSalesCheck');

// Customer routes
router.post('/', onlineSalesCheck, createOrder);
router.get('/customer/:customerId', getCustomerOrders);

// Admin routes
router.get('/', protect, roleCheck('orderManager'), getOrders);
router.get('/:id', getOrder);
router.put('/:id/status', protect, roleCheck('orderManager'), updateOrderStatus);
router.put('/:id/payment', protect, roleCheck('orderManager'), updatePaymentStatus);

module.exports = router;
