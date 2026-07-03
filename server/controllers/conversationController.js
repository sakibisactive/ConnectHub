const { v4: uuidv4 } = require('uuid');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const redisService = require('../config/redis');

// 6. GET /api/conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cacheKey = `conversations:${userId}`;

    // Redis cache lookup (10-second TTL as required)
    const cachedConversations = await redisService.get(cacheKey);
    if (cachedConversations) {
      return res.status(200).json({
        success: true,
        conversations: cachedConversations,
        fromCache: true
      });
    }

    const conversations = await Conversation.find({
      participants: userId
    }).sort({ updatedAt: -1 }).lean();

    // Enrich conversations with details
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Fetch participant details
        const participantDetails = await User.find({
          userId: { $in: conv.participants }
        }).select('userId username email profilePicture status lastSeen').lean();

        // Latest message
        const lastMessage = await Message.findOne({ conversationId: conv.conversationId })
          .sort({ createdAt: -1 })
          .lean();

        // Unread messages count
        const unreadCount = await Message.countDocuments({
          conversationId: conv.conversationId,
          senderId: { $ne: userId },
          status: { $ne: 'read' }
        });

        return {
          ...conv,
          participantDetails,
          lastMessage: lastMessage || null,
          unreadCount
        };
      })
    );

    // Save to Redis (10s TTL)
    await redisService.set(cacheKey, enrichedConversations, 10);

    return res.status(200).json({
      success: true,
      conversations: enrichedConversations
    });
  } catch (error) {
    console.error('getConversations error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. POST /api/conversations
const createConversation = async (req, res) => {
  try {
    const { participants, type = 'individual', groupName = '', groupAvatar = '' } = req.body;
    const currentUserId = req.user.userId;

    // Ensure current user is in participants
    const allParticipants = Array.from(new Set([...(participants || []), currentUserId]));

    if (type === 'individual') {
      if (allParticipants.length !== 2) {
        return res.status(400).json({ success: false, message: 'Individual conversations require exactly 2 participants' });
      }

      // Check if conversation already exists between these 2 users
      const existing = await Conversation.findOne({
        type: 'individual',
        participants: { $all: allParticipants, $size: 2 }
      });

      if (existing) {
        const participantDetails = await User.find({
          userId: { $in: existing.participants }
        }).select('userId username email profilePicture status lastSeen').lean();

        const lastMessage = await Message.findOne({ conversationId: existing.conversationId })
          .sort({ createdAt: -1 })
          .lean();

        return res.status(200).json({
          success: true,
          conversation: {
            ...existing.toObject(),
            participantDetails,
            lastMessage: lastMessage || null,
            unreadCount: 0
          }
        });
      }
    }

    const conversationId = `conv_${uuidv4().substring(0, 12)}`;

    const newConv = await Conversation.create({
      conversationId,
      type,
      participants: allParticipants,
      groupName: type === 'group' ? (groupName || 'New Group') : '',
      groupAdmin: type === 'group' ? currentUserId : null,
      groupAvatar: type === 'group' ? (groupAvatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=256') : ''
    });

    // Invalidate conversation cache for all participants
    await Promise.all(
      allParticipants.map(pId => redisService.del(`conversations:${pId}`))
    );

    const participantDetails = await User.find({
      userId: { $in: allParticipants }
    }).select('userId username email profilePicture status lastSeen').lean();

    return res.status(201).json({
      success: true,
      conversation: {
        ...newConv.toObject(),
        participantDetails,
        lastMessage: null,
        unreadCount: 0
      }
    });
  } catch (error) {
    console.error('createConversation error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getConversations,
  createConversation
};
