const express = require('express');
const router = express.Router();
const { getDashboard, getChartData } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getDashboard);
router.get('/charts', protect, getChartData);

module.exports = router;
