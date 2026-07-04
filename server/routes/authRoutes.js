const express = require('express');
const router = express.Router();
const { sendOtp, register, login, logout, getMe, updateProfile, deleteProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send-otp', sendOtp);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.delete('/profile', protect, deleteProfile);

module.exports = router;
