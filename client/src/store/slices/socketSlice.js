import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isConnected: false,
  onlineUsers: {}, // { [userId]: { status: 'online', lastSeen: Date } }
  typingUsers: {} // { [conversationId]: [userIds] }
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setSocketConnected: (state, action) => {
      state.isConnected = action.payload;
    },
    setUserOnline: (state, action) => {
      const { userId, status, lastSeen } = action.payload;
      state.onlineUsers[userId] = { status: status || 'online', lastSeen: lastSeen || new Date().toISOString() };
    },
    setUserOffline: (state, action) => {
      const { userId, status, lastSeen } = action.payload;
      state.onlineUsers[userId] = { status: status || 'offline', lastSeen: lastSeen || new Date().toISOString() };
    },
    setUserTyping: (state, action) => {
      const { conversationId, userId } = action.payload;
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = [];
      }
      if (!state.typingUsers[conversationId].includes(userId)) {
        state.typingUsers[conversationId].push(userId);
      }
    },
    setUserStopTyping: (state, action) => {
      const { conversationId, userId } = action.payload;
      if (state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(
          id => id !== userId
        );
      }
    }
  }
});

export const {
  setSocketConnected,
  setUserOnline,
  setUserOffline,
  setUserTyping,
  setUserStopTyping
} = socketSlice.actions;

export default socketSlice.reducer;
