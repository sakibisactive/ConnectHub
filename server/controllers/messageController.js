const { v4: uuidv4 } = require('uuid');
const dbDataService = require('../services/dbDataService');
const redisService = require('../config/redis');

// 8. GET /api/conversations/:conversationId/messages (Fix BUG-07: Sanitize limit & skip)
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 50));
    const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);
    const page = Math.floor(skip / limit) + 1;

    const cacheKey = `messages:${conversationId}:${page}`;

    const cachedMessages = await redisService.get(cacheKey);
    if (cachedMessages && skip === 0) {
      return res.status(200).json({
        success: true,
        messages: cachedMessages.messages,
        total: cachedMessages.total,
        fromCache: true
      });
    }

    const messages = await dbDataService.getMessages(conversationId, skip, limit);

    if (skip === 0) {
      await redisService.set(cacheKey, { messages, total: messages.length }, 60);
    }

    return res.status(200).json({
      success: true,
      messages,
      total: messages.length,
      limit,
      skip
    });
  } catch (error) {
    console.error('getMessages error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 9. POST /api/conversations/:conversationId/messages
const createMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text, messageType = 'text', mediaUrl = '', fileName = '', fileSize = 0 } = req.body;
    const senderId = req.user.userId;

    const conversation = await dbDataService.findConversation({ conversationId });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const messageId = `msg_${uuidv4().substring(0, 12)}`;

    const newMsg = {
      messageId,
      conversationId,
      senderId,
      text,
      messageType,
      mediaUrl,
      fileName,
      fileSize,
      status: 'sent',
      reactions: [],
      createdAt: new Date()
    };

    await dbDataService.createMessage(newMsg);

    await Promise.all([
      ...conversation.participants.map(pId => redisService.del(`conversations:${pId}`)),
      redisService.delByPattern(`messages:${conversationId}:*`)
    ]);

    const io = req.app.get('io');
    if (io) {
      const payload = {
        ...newMsg,
        sender: {
          userId: req.user.userId,
          username: req.user.username,
          profilePicture: req.user.profilePicture
        }
      };
      io.to(conversationId).emit('receive_message', payload);
      if (conversation && Array.isArray(conversation.participants)) {
        conversation.participants.forEach((pId) => {
          io.to(pId.toString()).emit('receive_message', payload);
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: newMsg
    });
  } catch (error) {
    console.error('createMessage error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 10. PUT /api/messages/:messageId/read
const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const io = req.app.get('io');
    if (io) {
      io.emit('message_read', {
        messageId,
        readBy: userId,
        readAt: new Date()
      });
    }

    return res.status(200).json({
      success: true,
      messageId
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Add/Remove Reaction
const toggleReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.userId;

    const io = req.app.get('io');
    if (io) {
      io.emit('reaction_updated', {
        messageId,
        userId,
        emoji
      });
    }

    return res.status(200).json({
      success: true,
      emoji
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMessages,
  createMessage,
  markAsRead,
  toggleReaction
};
