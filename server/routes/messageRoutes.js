const express = require('express');
const router = express.Router();
const { markAsRead, toggleReaction } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.put('/:messageId/read', protect, markAsRead);
router.post('/:messageId/react', protect, toggleReaction);

module.exports = router;
