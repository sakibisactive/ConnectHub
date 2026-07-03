const express = require('express');
const router = express.Router();
const { getConversations, createConversation } = require('../controllers/conversationController');
const { getMessages, createMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getConversations);
router.post('/', protect, createConversation);
router.get('/:conversationId/messages', protect, getMessages);
router.post('/:conversationId/messages', protect, createMessage);

module.exports = router;
