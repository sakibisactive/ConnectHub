import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import conversationReducer from './slices/conversationSlice';
import socketReducer from './slices/socketSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    conversation: conversationReducer,
    socket: socketReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export default store;
