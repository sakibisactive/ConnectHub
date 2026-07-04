const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const dbDataService = require('../services/dbDataService');
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

    // Update user status
    if (userId !== 'usr_admin') {
      const user = await dbDataService.findUser({ userId });
      if (user) {
        user.status = 'online';
        user.lastSeen = new Date();
      }
    }
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

    // 2. 'send_message' event (BUG-01 Fix: Single room broadcast to prevent duplicate message renders)
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, text, messageType = 'text', mediaUrl = '', fileName = '', fileSize = 0 } = data;

        const conversation = await dbDataService.findConversation({ conversationId });
        if (!conversation) return;

        const messageId = `msg_${uuidv4().substring(0, 12)}`;

        const newMsg = {
          messageId,
          conversationId,
          senderId: userId,
          text,
          messageType,
          mediaUrl,
          fileName,
          fileSize,
          status: 'delivered',
          reactions: [],
          createdAt: new Date()
        };

        await dbDataService.createMessage(newMsg);

        // Invalidate conversation and message caches
        await Promise.all([
          ...conversation.participants.map(p => redisService.del(`conversations:${p}`)),
          redisService.delByPattern(`messages:${conversationId}:*`)
        ]);

        const sender = userId === 'usr_admin'
          ? { userId: 'usr_admin', username: 'Admin', profilePicture: 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin' }
          : await dbDataService.findUser({ userId });

        const payload = {
          ...newMsg,
          sender: sender ? {
            userId: sender.userId,
            username: sender.username,
            profilePicture: sender.profilePicture
          } : { userId, username: 'User' }
        };

        // Emit receive_message cleanly to conversation room (Prevents duplicate render bug)
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
        io.to(conversationId).emit('reaction_updated', {
          messageId,
          conversationId,
          userId,
          emoji
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
        if (userId !== 'usr_admin') {
          const u = await dbDataService.findUser({ userId });
          if (u) {
            u.status = 'offline';
            u.lastSeen = new Date();
          }
        }
        await redisService.del(`user:status:${userId}`);

        io.emit('user_offline', { userId, status: 'offline', lastSeen: new Date() });
        disconnectTimers.delete(userId);
      }, 5000);

      disconnectTimers.set(userId, timer);
    });
  });
}

module.exports = initSocketService;
