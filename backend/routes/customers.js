const express = require('express');
const router = express.Router();
const {
  identifyCustomer, getCustomers, getCustomer, updateCustomer, toggleCustomer,
} = require('../controllers/customerController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Customer identification (public)
router.post('/identify', identifyCustomer);

// Admin routes
router.get('/', protect, roleCheck('orderManager'), getCustomers);
router.get('/:id', protect, roleCheck('orderManager'), getCustomer);
router.put('/:id', protect, roleCheck('orderManager'), updateCustomer);
router.put('/:id/toggle', protect, roleCheck('superAdmin', 'admin'), toggleCustomer);

module.exports = router;
