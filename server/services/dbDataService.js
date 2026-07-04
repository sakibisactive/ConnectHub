const mongoose = require('mongoose');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const memoryStore = require('../config/inMemoryDb');

const isMongoConnected = () => mongoose.connection.readyState === 1;
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

const dbDataService = {
  isMongoConnected,

  // USER OPERATIONS
  async findUser(query) {
    if (isMongoConnected()) {
      return await User.findOne(query).lean();
    }
    if (query.userId) {
      return memoryStore.users.find(u => u.userId === query.userId) || null;
    }
    if (query.email) {
      return memoryStore.users.find(u => u.email?.toLowerCase() === query.email?.toLowerCase()) || null;
    }
    if (query.username) {
      return memoryStore.users.find(u => u.username?.toLowerCase() === query.username?.toLowerCase()) || null;
    }
    if (query.$or) {
      return memoryStore.users.find(u =>
        query.$or.some(cond => {
          const k = Object.keys(cond)[0];
          return u[k]?.toLowerCase() === cond[k]?.toLowerCase();
        })
      ) || null;
    }
    return null;
  },

  async createUser(userData) {
    if (isMongoConnected()) {
      return await User.create(userData);
    }
    memoryStore.users.push(userData);
    return userData;
  },

  async deleteUser(userId) {
    if (isMongoConnected()) {
      await User.deleteOne({ userId });
      await Conversation.deleteMany({ participants: userId });
      await Message.deleteMany({ senderId: userId });
      return true;
    }
    memoryStore.users = memoryStore.users.filter(u => u.userId !== userId);
    memoryStore.conversations = memoryStore.conversations.filter(c => !c.participants.includes(userId));
    memoryStore.messages = memoryStore.messages.filter(m => m.senderId !== userId);
    return true;
  },

  // Search by username OR email address
  async getUsers(searchQuery, currentUserId) {
    if (isMongoConnected()) {
      let q = {};
      if (currentUserId) q.userId = { $ne: currentUserId };
      if (searchQuery) {
        q.$or = [
          { username: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } }
        ];
      }
      return await User.find(q).select('-passwordHash').lean();
    }
    const q = searchQuery ? searchQuery.toLowerCase() : '';
    return memoryStore.users
      .filter(u => u.userId !== currentUserId)
      .filter(u => !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .map(({ passwordHash, ...rest }) => rest);
  },

  // CONVERSATION OPERATIONS
  async getConversations(userId) {
    if (isMongoConnected()) {
      return await Conversation.find({ participants: userId }).sort({ updatedAt: -1 }).lean();
    }
    return memoryStore.conversations
      .filter(c => c.participants.includes(userId))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  async createConversation(convData) {
    if (isMongoConnected()) {
      return await Conversation.create(convData);
    }
    memoryStore.conversations.push(convData);
    return convData;
  },

  async findConversation(query) {
    if (isMongoConnected()) {
      return await Conversation.findOne(query).lean();
    }
    if (query.conversationId) {
      return memoryStore.conversations.find(c => c.conversationId === query.conversationId) || null;
    }
    if (query.type === 'individual' && query.participants?.$all) {
      const parts = query.participants.$all;
      return memoryStore.conversations.find(c =>
        c.type === 'individual' &&
        c.participants.length === 2 &&
        parts.every(p => c.participants.includes(p))
      ) || null;
    }
    return null;
  },

  // MESSAGE OPERATIONS (Enforces 12-Hour Message Deletion Window for Regular Users)
  async getMessages(conversationId, skip = 0, limit = 50) {
    const twelveHoursAgo = new Date(Date.now() - TWELVE_HOURS_MS);

    if (isMongoConnected()) {
      const msgs = await Message.find({
        conversationId,
        createdAt: { $gte: twelveHoursAgo }
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      return msgs.reverse();
    }
    const msgs = memoryStore.messages
      .filter(m => m.conversationId === conversationId && new Date(m.createdAt) >= twelveHoursAgo)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return msgs.slice(skip, skip + limit);
  },

  // Dedicated Admin Audit Query - Fix BUG-04 (No 12-Hour Truncation for Admin Inspections)
  async getAllMessagesForAdmin(conversationId) {
    if (isMongoConnected()) {
      return await Message.find({ conversationId }).sort({ createdAt: 1 }).lean();
    }
    return memoryStore.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  async createMessage(msgData) {
    if (isMongoConnected()) {
      return await Message.create(msgData);
    }
    memoryStore.messages.push(msgData);
    const conv = memoryStore.conversations.find(c => c.conversationId === msgData.conversationId);
    if (conv) conv.updatedAt = new Date();
    return msgData;
  },

  async getLastMessage(conversationId) {
    const twelveHoursAgo = new Date(Date.now() - TWELVE_HOURS_MS);

    if (isMongoConnected()) {
      return await Message.findOne({
        conversationId,
        createdAt: { $gte: twelveHoursAgo }
      }).sort({ createdAt: -1 }).lean();
    }
    const msgs = memoryStore.messages
      .filter(m => m.conversationId === conversationId && new Date(m.createdAt) >= twelveHoursAgo)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return msgs[0] || null;
  },

  async getUnreadCount(conversationId, userId) {
    const twelveHoursAgo = new Date(Date.now() - TWELVE_HOURS_MS);

    if (isMongoConnected()) {
      return await Message.countDocuments({
        conversationId,
        senderId: { $ne: userId },
        status: { $ne: 'read' },
        createdAt: { $gte: twelveHoursAgo }
      });
    }
    return memoryStore.messages.filter(
      m => m.conversationId === conversationId &&
           m.senderId !== userId &&
           m.status !== 'read' &&
           new Date(m.createdAt) >= twelveHoursAgo
    ).length;
  }
};

module.exports = dbDataService;
