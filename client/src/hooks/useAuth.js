import { useDispatch, useSelector } from 'react-redux';
import api from '../utils/api';
import { setAuthSuccess, logout, setAuthLoading, setAuthError, updateUser } from '../store/slices/authSlice';
import { addToast } from '../store/slices/uiSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const loginUser = async (emailOrUsername, password) => {
    try {
      dispatch(setAuthLoading(true));
      const res = await api.post('/auth/login', { emailOrUsername, password });
      if (res.data.success) {
        dispatch(setAuthSuccess({ user: res.data.user, token: res.data.token }));
        dispatch(addToast({ type: 'success', title: 'Welcome back!', message: `Logged in as ${res.data.user.username}` }));
        return true;
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check credentials.';
      dispatch(setAuthError(errMsg));
      dispatch(addToast({ type: 'error', title: 'Authentication Error', message: errMsg }));
      return false;
    }
  };

  const registerUser = async (username, email, password) => {
    try {
      dispatch(setAuthLoading(true));
      const res = await api.post('/auth/register', { username, email, password });
      if (res.data.success) {
        dispatch(setAuthSuccess({ user: res.data.user, token: res.data.token }));
        dispatch(addToast({ type: 'success', title: 'Account Created!', message: `Welcome to ConnectHub, @${res.data.user.username}!` }));
        return true;
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed.';
      dispatch(setAuthError(errMsg));
      dispatch(addToast({ type: 'error', title: 'Registration Error', message: errMsg }));
      return false;
    }
  };

  const logoutUser = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      dispatch(logout());
      dispatch(addToast({ type: 'info', title: 'Logged Out', message: 'You have been safely logged out.' }));
    }
  };

  const updateProfileData = async (data) => {
    try {
      const res = await api.put('/auth/profile', data);
      if (res.data.success) {
        dispatch(updateUser(res.data.user));
        dispatch(addToast({ type: 'success', title: 'Profile Updated', message: 'Your preferences have been saved.' }));
        return true;
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', title: 'Update Error', message: err.response?.data?.message || 'Failed to update profile.' }));
      return false;
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    loginUser,
    registerUser,
    logoutUser,
    updateProfileData
  };
};
