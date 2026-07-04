import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { setSocketConnected, setUserOnline, setUserOffline, setUserTyping, setUserStopTyping } from '../store/slices/socketSlice';
import { addMessage, updateMessageStatus, updateReactions } from '../store/slices/conversationSlice';
import { addToast } from '../store/slices/uiSlice';
import { soundManager } from '../utils/sound';

let socketInstance = null;

export const getSocket = () => socketInstance;

export const useSocket = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated } = useSelector((state) => state.auth);
  const { conversations, activeConversationId } = useSelector((state) => state.conversation);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
      dispatch(setSocketConnected(false));
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || '/';

    // Connect Socket.IO
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });

    socketInstance = socket;
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Socket connected:', socket.id);
      dispatch(setSocketConnected(true));

      // Join active conversation rooms
      if (conversations.length > 0) {
        const convIds = conversations.map(c => c.conversationId);
        socket.emit('join', { conversationIds: convIds });
      }
    });

    socket.on('disconnect', () => {
      console.log('⚡ Socket disconnected');
      dispatch(setSocketConnected(false));
    });

    socket.on('receive_message', (msg) => {
      dispatch(addMessage(msg));
      soundManager.playMessageSound();

      if (msg.senderId !== user.userId) {
        dispatch(addToast({
          type: 'info',
          title: `New message from ${msg.sender?.username || 'contact'}`,
          message: msg.text ? (msg.text.length > 40 ? msg.text.substring(0, 40) + '...' : msg.text) : 'Sent a file'
        }));
      }
    });

    socket.on('user_typing', (data) => {
      if (data.userId !== user.userId) {
        dispatch(setUserTyping(data));
      }
    });

    socket.on('user_stop_typing', (data) => {
      if (data.userId !== user.userId) {
        dispatch(setUserStopTyping(data));
      }
    });

    socket.on('message_read', (data) => {
      dispatch(updateMessageStatus({
        messageId: data.messageId,
        conversationId: data.conversationId,
        status: 'read',
        readAt: data.readAt
      }));
    });

    socket.on('reaction_updated', (data) => {
      dispatch(updateReactions(data));
    });

    socket.on('user_online', (data) => {
      dispatch(setUserOnline(data));
    });

    socket.on('user_offline', (data) => {
      dispatch(setUserOffline(data));
    });

    socket.on('system_broadcast', (data) => {
      soundManager.playNotificationSound();
      dispatch(addToast({
        type: 'warning',
        title: `📢 ${data.title}`,
        message: data.message
      }));
    });

    return () => {
      socket.disconnect();
      socketInstance = null;
    };
  }, [isAuthenticated, user?.userId]);

  return socketRef.current;
};
