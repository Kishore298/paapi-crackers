const express = require('express');
const router = express.Router();
const { login, register, getMe, changePassword, updateFcmToken } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.post('/login', login);
router.post('/register', protect, roleCheck('superAdmin'), register);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);
router.put('/fcm-token', protect, updateFcmToken);

module.exports = router;
