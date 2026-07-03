import { createSlice } from '@reduxjs/toolkit';

const storedUser = localStorage.getItem('connecthub_user');
const storedToken = localStorage.getItem('connecthub_token');

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  isAuthenticated: !!(storedUser && storedToken),
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;

      localStorage.setItem('connecthub_user', JSON.stringify(action.payload.user));
      if (action.payload.token) {
        localStorage.setItem('connecthub_token', action.payload.token);
      }
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('connecthub_user', JSON.stringify(state.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;

      localStorage.removeItem('connecthub_user');
      localStorage.removeItem('connecthub_token');
    },
    setAuthLoading: (state, action) => {
      state.loading = action.payload;
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

export const { setAuthSuccess, updateUser, logout, setAuthLoading, setAuthError } = authSlice.actions;
export default authSlice.reducer;
