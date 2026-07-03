import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: localStorage.getItem('connecthub_theme') || 'dark',
  activeModal: null, // 'userSearch' | 'groupModal' | 'profileSettings' | 'groupInfo' | 'adminDashboard'
  soundEnabled: true,
  toasts: []
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('connecthub_theme', action.payload);
    },
    setActiveModal: (state, action) => {
      state.activeModal = action.payload;
    },
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
    },
    addToast: (state, action) => {
      state.toasts.push({
        id: Date.now() + Math.random(),
        ...action.payload
      });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    }
  }
});

export const { setTheme, setActiveModal, toggleSound, addToast, removeToast } = uiSlice.actions;
export default uiSlice.reducer;
