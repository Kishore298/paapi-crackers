const express = require('express');
const router = express.Router();
const {
  identifyCustomer, getCustomers, getCustomer, updateCustomer, toggleCustomer, createCustomer
} = require('../controllers/customerController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Customer identification (public)
router.post('/identify', identifyCustomer);

// Admin routes
router.post('/', protect, roleCheck('orderManager'), createCustomer);
router.get('/', protect, roleCheck('orderManager'), getCustomers);
// Admin & Customer routes (Customers need to fetch/update their own data)
router.get('/:id', getCustomer);
router.put('/:id', updateCustomer);
router.put('/:id/toggle', protect, roleCheck('superAdmin', 'admin'), toggleCustomer);

module.exports = router;
