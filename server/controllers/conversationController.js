const { v4: uuidv4 } = require('uuid');
const dbDataService = require('../services/dbDataService');
const redisService = require('../config/redis');

// 6. GET /api/conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cacheKey = `conversations:${userId}`;

    const cachedConversations = await redisService.get(cacheKey);
    if (cachedConversations) {
      return res.status(200).json({
        success: true,
        conversations: cachedConversations,
        fromCache: true
      });
    }

    const conversations = await dbDataService.getConversations(userId);

    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const participantDetails = await Promise.all(
          conv.participants.map(pId => dbDataService.findUser({ userId: pId }))
        );

        const lastMessage = await dbDataService.getLastMessage(conv.conversationId);
        const unreadCount = await dbDataService.getUnreadCount(conv.conversationId, userId);

        return {
          ...conv,
          participantDetails: participantDetails.filter(Boolean).map(({ passwordHash, ...u }) => u),
          lastMessage: lastMessage || null,
          unreadCount
        };
      })
    );

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

    const allParticipants = Array.from(new Set([...(participants || []), currentUserId]));

    if (type === 'individual') {
      if (allParticipants.length !== 2) {
        return res.status(400).json({ success: false, message: 'Individual conversations require exactly 2 participants' });
      }

      const existing = await dbDataService.findConversation({
        type: 'individual',
        participants: { $all: allParticipants }
      });

      if (existing) {
        const participantDetails = await Promise.all(
          existing.participants.map(pId => dbDataService.findUser({ userId: pId }))
        );

        const lastMessage = await dbDataService.getLastMessage(existing.conversationId);

        return res.status(200).json({
          success: true,
          conversation: {
            ...existing,
            participantDetails: participantDetails.filter(Boolean).map(({ passwordHash, ...u }) => u),
            lastMessage: lastMessage || null,
            unreadCount: 0
          }
        });
      }
    }

    const conversationId = `conv_${uuidv4().substring(0, 12)}`;

    const newConv = {
      conversationId,
      type,
      participants: allParticipants,
      groupName: type === 'group' ? (groupName || 'New Group') : '',
      groupAdmin: type === 'group' ? currentUserId : null,
      groupAvatar: type === 'group' ? (groupAvatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c') : '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await dbDataService.createConversation(newConv);

    await Promise.all(
      allParticipants.map(pId => redisService.del(`conversations:${pId}`))
    );

    const participantDetails = await Promise.all(
      allParticipants.map(pId => dbDataService.findUser({ userId: pId }))
    );

    return res.status(201).json({
      success: true,
      conversation: {
        ...newConv,
        participantDetails: participantDetails.filter(Boolean).map(({ passwordHash, ...u }) => u),
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
