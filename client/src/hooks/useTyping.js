import { useRef, useCallback } from 'react';
import { getSocket } from './useSocket';

export const useTyping = (conversationId) => {
  const isTypingRef = useRef(false);
  const timerRef = useRef(null);

  const sendTyping = useCallback(() => {
    if (!conversationId) return;
    const socket = getSocket();
    if (!socket || !socket.connected) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', { conversationId });
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('stop_typing', { conversationId });
    }, 2000); // 2-second debounce
  }, [conversationId]);

  const stopTyping = useCallback(() => {
    if (!conversationId) return;
    const socket = getSocket();
    if (socket && socket.connected && isTypingRef.current) {
      isTypingRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      socket.emit('stop_typing', { conversationId });
    }
  }, [conversationId]);

  return { sendTyping, stopTyping };
};
