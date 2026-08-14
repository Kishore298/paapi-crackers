const express = require('express');
const router = express.Router();
const { generateInvoice, getInvoices, getInvoice, downloadInvoicePDF } = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.post('/generate', protect, roleCheck('orderManager', 'posOperator'), generateInvoice);
router.get('/', protect, roleCheck('orderManager'), getInvoices);
router.get('/:id', protect, getInvoice);
router.get('/:id/pdf', protect, downloadInvoicePDF);

module.exports = router;
