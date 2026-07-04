const express = require('express');
const router = express.Router();
const { getAnalytics, getPairMessages, broadcastMessage, exportData, deleteUser } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

router.get('/analytics', protect, getAnalytics);
router.get('/conversations/pair', protect, getPairMessages);
router.post('/broadcast', protect, broadcastMessage);
router.get('/export', protect, exportData);
router.delete('/users/:userId', protect, deleteUser);

module.exports = router;
