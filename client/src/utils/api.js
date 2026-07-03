import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach token from localStorage if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('connecthub_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or unauthenticated
      console.warn('Authentication error or token expired');
    }
    return Promise.reject(error);
  }
);

export default api;
