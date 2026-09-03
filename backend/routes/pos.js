const express = require('express');
const router = express.Router();
const {
  createPOSSale, getPOSSales, getPOSSale, getTodayStats, cancelPOSSale
} = require('../controllers/posController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.post('/sale', protect, roleCheck('posOperator'), createPOSSale);
router.get('/sales', protect, roleCheck('posOperator'), getPOSSales);
router.get('/stats/today', protect, roleCheck('posOperator'), getTodayStats);
router.get('/sales/:id', protect, roleCheck('superAdmin', 'admin', 'operator'), getPOSSale);
router.put('/sales/:id/cancel', protect, roleCheck('superAdmin', 'admin'), cancelPOSSale);

module.exports = router;
