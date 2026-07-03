const { v4: uuidv4 } = require('uuid');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const MessageAttachment = require('../models/MessageAttachment');
const redisService = require('../config/redis');

// 8. GET /api/conversations/:conversationId/messages
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = parseInt(req.query.skip, 10) || 0;
    const page = Math.floor(skip / limit) + 1;

    const cacheKey = `messages:${conversationId}:${page}`;

    // Redis cache lookup (60-second TTL as required)
    const cachedMessages = await redisService.get(cacheKey);
    if (cachedMessages && skip === 0) {
      return res.status(200).json({
        success: true,
        messages: cachedMessages.messages,
        total: cachedMessages.total,
        fromCache: true
      });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Reverse so messages are chronological for display
    const sortedMessages = messages.reverse();

    const total = await Message.countDocuments({ conversationId });

    if (skip === 0) {
      await redisService.set(cacheKey, { messages: sortedMessages, total }, 60);
    }

    return res.status(200).json({
      success: true,
      messages: sortedMessages,
      total,
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

    const conversation = await Conversation.findOne({ conversationId });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const messageId = `msg_${uuidv4().substring(0, 12)}`;

    const newMsg = await Message.create({
      messageId,
      conversationId,
      senderId,
      text,
      messageType,
      mediaUrl,
      fileName,
      fileSize,
      status: 'sent',
      createdAt: new Date()
    });

    // Update conversation updatedAt timestamp
    conversation.updatedAt = new Date();
    await conversation.save();

    // Store Attachment metadata if applicable
    if (mediaUrl) {
      await MessageAttachment.create({
        attachmentId: `att_${uuidv4().substring(0, 12)}`,
        messageId,
        fileName: fileName || 'attachment',
        fileSize: fileSize || 1024,
        mimeType: messageType === 'image' ? 'image/png' : 'application/octet-stream',
        cloudinaryUrl: mediaUrl
      });
    }

    // Cache Invalidation
    // Clear conversation caches for all participants
    await Promise.all(
      conversation.participants.map(pId => redisService.del(`conversations:${pId}`))
    );
    // Clear message cache for conversation
    await redisService.delByPattern(`messages:${conversationId}:*`);

    // Real-time Socket.IO emission is managed via Socket handler or IO reference attached to req.app
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('receive_message', {
        ...newMsg.toObject(),
        sender: {
          userId: req.user.userId,
          username: req.user.username,
          profilePicture: req.user.profilePicture
        }
      });
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

    const message = await Message.findOne({ messageId });
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    message.status = 'read';
    message.readAt = new Date();
    await message.save();

    // Invalidate conversation and message caches
    await redisService.del(`conversations:${userId}`);
    await redisService.delByPattern(`messages:${message.conversationId}:*`);

    const io = req.app.get('io');
    if (io) {
      io.to(message.conversationId).emit('message_read', {
        messageId: message.messageId,
        conversationId: message.conversationId,
        readBy: userId,
        readAt: message.readAt
      });
    }

    return res.status(200).json({
      success: true,
      message
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

    const message = await Message.findOne({ messageId });
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const existingIndex = message.reactions.findIndex(r => r.userId === userId && r.emoji === emoji);

    if (existingIndex > -1) {
      message.reactions.splice(existingIndex, 1);
    } else {
      message.reactions.push({ userId, emoji });
    }

    await message.save();
    await redisService.delByPattern(`messages:${message.conversationId}:*`);

    const io = req.app.get('io');
    if (io) {
      io.to(message.conversationId).emit('reaction_updated', {
        messageId: message.messageId,
        conversationId: message.conversationId,
        reactions: message.reactions
      });
    }

    return res.status(200).json({
      success: true,
      reactions: message.reactions
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
