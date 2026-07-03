import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../utils/api';
import {
  setConversations,
  setActiveConversation,
  setMessages,
  addMessage,
  clearUnreadCount,
  setLoadingConversations,
  setLoadingMessages
} from '../store/slices/conversationSlice';
import { getSocket } from './useSocket';

export const useConversation = () => {
  const dispatch = useDispatch();
  const { conversations, activeConversationId, messages, loadingConversations, loadingMessages } = useSelector(
    (state) => state.conversation
  );
  const { user } = useSelector((state) => state.auth);

  const fetchConversations = useCallback(async () => {
    try {
      dispatch(setLoadingConversations(true));
      const res = await api.get('/conversations');
      if (res.data.success) {
        dispatch(setConversations(res.data.conversations));
      }
    } catch (err) {
      console.error('Fetch conversations error:', err);
    } finally {
      dispatch(setLoadingConversations(false));
    }
  }, [dispatch]);

  const fetchMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    try {
      dispatch(setLoadingMessages(true));
      const res = await api.get(`/conversations/${conversationId}/messages`);
      if (res.data.success) {
        dispatch(setMessages({ conversationId, messages: res.data.messages }));
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
    } finally {
      dispatch(setLoadingMessages(false));
    }
  }, [dispatch]);

  const selectConversation = useCallback((conversationId) => {
    dispatch(setActiveConversation(conversationId));
    dispatch(clearUnreadCount(conversationId));
    fetchMessages(conversationId);
  }, [dispatch, fetchMessages]);

  const sendMessage = useCallback(async (conversationId, text, messageType = 'text', mediaUrl = '', fileName = '', fileSize = 0) => {
    if (!text && !mediaUrl) return;

    const socket = getSocket();
    if (socket && socket.connected) {
      // Send via Socket.IO
      socket.emit('send_message', {
        conversationId,
        text,
        messageType,
        mediaUrl,
        fileName,
        fileSize
      });
    } else {
      // Fallback via HTTP API endpoint
      try {
        const res = await api.post(`/conversations/${conversationId}/messages`, {
          text,
          messageType,
          mediaUrl,
          fileName,
          fileSize
        });
        if (res.data.success) {
          dispatch(addMessage(res.data.message));
        }
      } catch (err) {
        console.error('Send message fallback error:', err);
      }
    }
  }, [dispatch]);

  const markMessageAsRead = useCallback(async (messageId, conversationId) => {
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('mark_read', { messageId, conversationId });
    } else {
      try {
        await api.put(`/messages/${messageId}/read`);
      } catch (e) {}
    }
  }, []);

  return {
    conversations,
    activeConversationId,
    messages,
    loadingConversations,
    loadingMessages,
    fetchConversations,
    fetchMessages,
    selectConversation,
    sendMessage,
    markMessageAsRead
  };
};
