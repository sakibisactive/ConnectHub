import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  conversations: [],
  activeConversationId: null,
  messages: {}, // { [conversationId]: [messageObjects] }
  loadingConversations: false,
  loadingMessages: false,
  searchInChatQuery: '',
  showSearchInChat: false
};

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload;
      state.loadingConversations = false;
    },
    setActiveConversation: (state, action) => {
      state.activeConversationId = action.payload;
    },
    setMessages: (state, action) => {
      const { conversationId, messages } = action.payload;
      state.messages[conversationId] = messages;
      state.loadingMessages = false;
    },
    addMessage: (state, action) => {
      const msg = action.payload;
      const convId = msg.conversationId;

      if (!state.messages[convId]) {
        state.messages[convId] = [];
      }

      // Avoid duplicate messages
      const exists = state.messages[convId].some(m => m.messageId === msg.messageId);
      if (!exists) {
        state.messages[convId].push(msg);
      }

      // Update & bump conversation in sidebar list to top
      const convIdx = state.conversations.findIndex(c => c.conversationId === convId);
      if (convIdx !== -1) {
        const targetConv = { ...state.conversations[convIdx] };
        targetConv.lastMessage = msg;
        targetConv.updatedAt = msg.createdAt || new Date().toISOString();
        if (state.activeConversationId !== convId && msg.senderId !== targetConv.currentUserId) {
          targetConv.unreadCount = (targetConv.unreadCount || 0) + 1;
        }

        // Remove from current position and move to top (index 0)
        state.conversations.splice(convIdx, 1);
        state.conversations.unshift(targetConv);
      } else {
        // Conversation not found in sidebar state (e.g. brand new conversation started by someone)
        const senderDetail = msg.sender || { userId: msg.senderId, username: 'Contact' };
        const newConv = {
          conversationId: convId,
          type: msg.conversationType || 'individual',
          participants: [msg.senderId],
          participantDetails: [senderDetail],
          lastMessage: msg,
          updatedAt: msg.createdAt || new Date().toISOString(),
          unreadCount: state.activeConversationId !== convId ? 1 : 0
        };
        state.conversations.unshift(newConv);
      }
    },
    removeMessage: (state, action) => {
      const { conversationId, messageId } = action.payload;
      if (state.messages[conversationId]) {
        state.messages[conversationId] = state.messages[conversationId].filter(
          m => m.messageId !== messageId
        );
      }
    },
    updateMessageStatus: (state, action) => {
      const { messageId, conversationId, status, readAt } = action.payload;
      if (state.messages[conversationId]) {
        const msg = state.messages[conversationId].find(m => m.messageId === messageId);
        if (msg) {
          msg.status = status;
          if (readAt) msg.readAt = readAt;
        }
      }
    },
    updateReactions: (state, action) => {
      const { messageId, conversationId, reactions } = action.payload;
      if (state.messages[conversationId]) {
        const msg = state.messages[conversationId].find(m => m.messageId === messageId);
        if (msg) {
          msg.reactions = reactions;
        }
      }
    },
    clearUnreadCount: (state, action) => {
      const convId = action.payload;
      const conv = state.conversations.find(c => c.conversationId === convId);
      if (conv) {
        conv.unreadCount = 0;
      }
    },
    setSearchInChatQuery: (state, action) => {
      state.searchInChatQuery = action.payload;
    },
    toggleSearchInChat: (state, action) => {
      state.showSearchInChat = action.payload !== undefined ? action.payload : !state.showSearchInChat;
      if (!state.showSearchInChat) {
        state.searchInChatQuery = '';
      }
    },
    setLoadingConversations: (state, action) => {
      state.loadingConversations = action.payload;
    },
    setLoadingMessages: (state, action) => {
      state.loadingMessages = action.payload;
    }
  }
});

export const {
  setConversations,
  setActiveConversation,
  setMessages,
  addMessage,
  removeMessage,
  updateMessageStatus,
  updateReactions,
  clearUnreadCount,
  setSearchInChatQuery,
  toggleSearchInChat,
  setLoadingConversations,
  setLoadingMessages
} = conversationSlice.actions;

export default conversationSlice.reducer;
