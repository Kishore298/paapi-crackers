const express = require('express');
const router = express.Router();
const { createPOSSale, getPOSSales, getPOSSale, getTodayStats } = require('../controllers/posController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.post('/sale', protect, roleCheck('posOperator'), createPOSSale);
router.get('/sales', protect, roleCheck('posOperator'), getPOSSales);
router.get('/stats/today', protect, roleCheck('posOperator'), getTodayStats);
router.get('/sales/:id', protect, roleCheck('posOperator'), getPOSSale);

module.exports = router;
