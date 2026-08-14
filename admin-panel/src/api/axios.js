import axios from 'axios';
import useAuthStore from '../store/authStore';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

API.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    
    // Auto logout on 401
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export default API;
