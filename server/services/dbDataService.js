const mongoose = require('mongoose');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const memoryStore = require('../config/inMemoryDb');

const isMongoConnected = () => mongoose.connection.readyState === 1;

const dbDataService = {
  isMongoConnected,

  // USER OPERATIONS
  async findUser(query) {
    if (isMongoConnected()) {
      return await User.findOne(query);
    }
    const key = Object.keys(query)[0];
    const val = query[key];
    if (query.$or) {
      return memoryStore.users.find(u =>
        query.$or.some(cond => {
          const k = Object.keys(cond)[0];
          return u[k]?.toLowerCase() === cond[k]?.toLowerCase();
        })
      ) || null;
    }
    return memoryStore.users.find(u => u[key]?.toLowerCase() === val?.toLowerCase()) || null;
  },

  async createUser(userData) {
    if (isMongoConnected()) {
      return await User.create(userData);
    }
    memoryStore.users.push(userData);
    return userData;
  },

  async getUsers(searchQuery, currentUserId) {
    if (isMongoConnected()) {
      let q = {};
      if (currentUserId) q.userId = { $ne: currentUserId };
      if (searchQuery) q.username = { $regex: searchQuery, $options: 'i' };
      return await User.find(q).select('-passwordHash').lean();
    }
    return memoryStore.users
      .filter(u => u.userId !== currentUserId)
      .filter(u => !searchQuery || u.username.toLowerCase().includes(searchQuery.toLowerCase()))
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
      return await Conversation.findOne(query);
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

  // MESSAGE OPERATIONS
  async getMessages(conversationId, skip = 0, limit = 50) {
    if (isMongoConnected()) {
      const msgs = await Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      return msgs.reverse();
    }
    const msgs = memoryStore.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return msgs.slice(skip, skip + limit);
  },

  async createMessage(msgData) {
    if (isMongoConnected()) {
      return await Message.create(msgData);
    }
    memoryStore.messages.push(msgData);
    // update conv updatedAt
    const conv = memoryStore.conversations.find(c => c.conversationId === msgData.conversationId);
    if (conv) conv.updatedAt = new Date();
    return msgData;
  },

  async getLastMessage(conversationId) {
    if (isMongoConnected()) {
      return await Message.findOne({ conversationId }).sort({ createdAt: -1 }).lean();
    }
    const msgs = memoryStore.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return msgs[0] || null;
  },

  async getUnreadCount(conversationId, userId) {
    if (isMongoConnected()) {
      return await Message.countDocuments({
        conversationId,
        senderId: { $ne: userId },
        status: { $ne: 'read' }
      });
    }
    return memoryStore.messages.filter(
      m => m.conversationId === conversationId && m.senderId !== userId && m.status !== 'read'
    ).length;
  }
};

module.exports = dbDataService;
