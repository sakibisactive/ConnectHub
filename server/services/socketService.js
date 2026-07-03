const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const redisService = require('../config/redis');

const disconnectTimers = new Map();

function initSocketService(io) {
  // Authentication Middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie?.match(/jwt=([^;]+)/)?.[1];
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`🔌 Socket connected: ${socket.id} (User: ${userId})`);

    // Store socket mapping in Redis
    await redisService.setSocketUser(userId, socket.id);

    // Cancel any pending disconnect offline broadcast (5-second debounce recovery)
    if (disconnectTimers.has(userId)) {
      clearTimeout(disconnectTimers.get(userId));
      disconnectTimers.delete(userId);
    }

    // Update user status in DB
    await User.findOneAndUpdate({ userId }, { status: 'online', lastSeen: new Date() });
    await redisService.del(`user:status:${userId}`);

    // Broadcast online event
    socket.broadcast.emit('user_online', { userId, status: 'online' });

    // Join personal user room
    socket.join(userId);

    // 1. 'join' event
    socket.on('join', async ({ conversationIds }) => {
      if (Array.isArray(conversationIds)) {
        conversationIds.forEach(convId => {
          socket.join(convId);
        });
      }
    });

    // 2. 'send_message' event
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, text, messageType = 'text', mediaUrl = '', fileName = '', fileSize = 0 } = data;

        const conversation = await Conversation.findOne({ conversationId });
        if (!conversation) return;

        const messageId = `msg_${uuidv4().substring(0, 12)}`;

        const newMsg = await Message.create({
          messageId,
          conversationId,
          senderId: userId,
          text,
          messageType,
          mediaUrl,
          fileName,
          fileSize,
          status: 'delivered', // marked delivered on socket push
          createdAt: new Date()
        });

        conversation.updatedAt = new Date();
        await conversation.save();

        // Invalidate conversation and message caches
        await Promise.all([
          ...conversation.participants.map(p => redisService.del(`conversations:${p}`)),
          redisService.delByPattern(`messages:${conversationId}:*`)
        ]);

        const sender = await User.findOne({ userId }).select('userId username profilePicture').lean();

        const payload = {
          ...newMsg.toObject(),
          sender
        };

        // Emit receive_message to all participants in room
        io.to(conversationId).emit('receive_message', payload);
      } catch (err) {
        console.error('Socket send_message error:', err);
      }
    });

    // 3. 'typing' event
    socket.on('typing', ({ conversationId }) => {
      socket.to(conversationId).emit('user_typing', {
        userId,
        conversationId
      });
    });

    // 4. 'stop_typing' event
    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(conversationId).emit('user_stop_typing', {
        userId,
        conversationId
      });
    });

    // 5. 'mark_read' event
    socket.on('mark_read', async ({ messageId, conversationId }) => {
      try {
        await Message.findOneAndUpdate(
          { messageId },
          { status: 'read', readAt: new Date() }
        );

        await redisService.delByPattern(`messages:${conversationId}:*`);

        io.to(conversationId).emit('message_read', {
          messageId,
          conversationId,
          readBy: userId,
          readAt: new Date()
        });
      } catch (err) {
        console.error('Socket mark_read error:', err);
      }
    });

    // 6. 'message_reaction' event
    socket.on('message_reaction', async ({ messageId, conversationId, emoji }) => {
      try {
        const msg = await Message.findOne({ messageId });
        if (!msg) return;

        const idx = msg.reactions.findIndex(r => r.userId === userId && r.emoji === emoji);
        if (idx > -1) {
          msg.reactions.splice(idx, 1);
        } else {
          msg.reactions.push({ userId, emoji });
        }
        await msg.save();

        io.to(conversationId).emit('reaction_updated', {
          messageId,
          conversationId,
          reactions: msg.reactions
        });
      } catch (err) {
        console.error('Socket message_reaction error:', err);
      }
    });

    // 7. 'disconnect' event with 5-second debounce
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: ${socket.id} (User: ${userId})`);

      await redisService.removeSocketUser(userId, socket.id);

      // Debounce offline broadcast by 5 seconds to handle network fluctuations
      const timer = setTimeout(async () => {
        await User.findOneAndUpdate({ userId }, { status: 'offline', lastSeen: new Date() });
        await redisService.del(`user:status:${userId}`);

        io.emit('user_offline', { userId, status: 'offline', lastSeen: new Date() });
        disconnectTimers.delete(userId);
      }, 5000);

      disconnectTimers.set(userId, timer);
    });
  });
}

module.exports = initSocketService;
