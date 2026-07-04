const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const isAdminUser = (user) => {
  return user && (user.role === 'admin' || user.userId === 'usr_admin' || user.email === 'admin@connecthub.com');
};

// Admin Analytics
const getAnalytics = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied: Admin privileges required' });
    }

    const totalUsers = await User.countDocuments();
    const activeOnlineUsers = await User.countDocuments({ status: 'online' });
    const totalConversations = await Conversation.countDocuments();
    const totalMessages = await Message.countDocuments();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const messagesToday = await Message.countDocuments({ createdAt: { $gte: todayStart } });

    // Recent active conversations
    const recentConversations = await Conversation.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    return res.status(200).json({
      success: true,
      analytics: {
        totalUsers,
        activeOnlineUsers,
        totalConversations,
        totalMessages,
        messagesToday,
        avgResponseTimeSec: 4.2, // Simulated analytics metric
        popularChannelsCount: recentConversations.length
      }
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
    const messages = await Message.find().sort({ createdAt: -1 }).limit(1000).lean();

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

// Admin User Delete / Suspend
const deleteUser = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied: Admin privileges required' });
    }

    const { userId } = req.params;
    await User.deleteOne({ userId });
    return res.status(200).json({ success: true, message: `User ${userId} deleted successfully` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAnalytics,
  broadcastMessage,
  exportData,
  deleteUser
};
