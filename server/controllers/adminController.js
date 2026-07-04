const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const dbDataService = require('../services/dbDataService');

const isAdminUser = (user) => {
  return user && (user.role === 'admin' || user.userId === 'usr_admin' || user.email === 'admin@connecthub.com');
};

// Admin Analytics & Full User List
const getAnalytics = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied: Admin privileges required' });
    }

    const allUsers = await dbDataService.getUsers('', 'usr_admin');

    const totalUsers = allUsers.length;
    const activeOnlineUsers = allUsers.filter(u => u.status === 'online').length;
    let totalConversations = 0;
    let totalMessages = 0;

    if (dbDataService.isMongoConnected()) {
      totalConversations = await Conversation.countDocuments();
      totalMessages = await Message.countDocuments();
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return res.status(200).json({
      success: true,
      analytics: {
        totalUsers,
        activeOnlineUsers,
        totalConversations,
        totalMessages
      },
      users: allUsers
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Chronological Chat Log for a Pair of Users (User A & User B)
const getPairMessages = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied: Admin privileges required' });
    }

    const { user1Id, user2Id } = req.query;
    if (!user1Id || !user2Id) {
      return res.status(400).json({ success: false, message: 'Both user1Id and user2Id are required' });
    }

    // Find direct conversation between user1 & user2
    const conv = await dbDataService.findConversation({
      type: 'individual',
      participants: { $all: [user1Id, user2Id] }
    });

    if (!conv) {
      return res.status(200).json({
        success: true,
        conversationId: null,
        messages: []
      });
    }

    const messages = await dbDataService.getMessages(conv.conversationId, 0, 100);

    return res.status(200).json({
      success: true,
      conversationId: conv.conversationId,
      messages
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Broadcast System Announcement
const broadcastMessage = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied: Admin privileges required' });
    }

    const { title, message } = req.body;
    const io = req.app.get('io');

    if (io) {
      io.emit('system_broadcast', {
        title: title || 'System Announcement',
        message: message || 'Important update from ConnectHub Admin.',
        timestamp: new Date()
      });
    }

    return res.status(200).json({ success: true, message: 'System broadcast sent successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Export Chat History as CSV / JSON
const exportData = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied: Admin privileges required' });
    }

    const format = req.query.format || 'json';
    let messages = [];

    if (dbDataService.isMongoConnected()) {
      messages = await Message.find().sort({ createdAt: -1 }).limit(1000).lean();
    }

    if (format === 'csv') {
      let csv = 'MessageId,ConversationId,SenderId,MessageType,Text,Status,CreatedAt\n';
      messages.forEach(m => {
        const cleanText = (m.text || '').replace(/"/g, '""');
        csv += `"${m.messageId}","${m.conversationId}","${m.senderId}","${m.messageType}","${cleanText}","${m.status}","${m.createdAt}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="connecthub_messages_export.csv"');
      return res.status(200).send(csv);
    }

    return res.status(200).json({
      success: true,
      count: messages.length,
      exportTimestamp: new Date(),
      messages
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin User Delete
const deleteUser = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied: Admin privileges required' });
    }

    const { userId } = req.params;
    await dbDataService.deleteUser(userId);
    return res.status(200).json({ success: true, message: `User ${userId} deleted successfully` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAnalytics,
  getPairMessages,
  broadcastMessage,
  exportData,
  deleteUser
};
