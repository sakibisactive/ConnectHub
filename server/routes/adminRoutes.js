const express = require('express');
const router = express.Router();
const { verifyAdmin, getAnalytics, broadcastMessage, exportData, deleteUser } = require('../controllers/adminController');

router.post('/verify', verifyAdmin);
router.get('/analytics', getAnalytics);
router.post('/broadcast', broadcastMessage);
router.get('/export', exportData);
router.delete('/users/:userId', deleteUser);

module.exports = router;
