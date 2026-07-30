import axios, { AxiosError } from 'axios';
import { getToken, clearToken } from '../auth/token';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    let message = 'An unexpected error occurred';
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as { message?: string; error?: string };
      message = data?.message || data?.error || message;

      if (status === 401) {
        const isAuthPage = typeof window !== 'undefined' &&
          (window.location.pathname.startsWith('/login') || window.location.pathname.startsWith('/register'));

        if (!isAuthPage) {
          clearToken();
          window.location.href = '/login';
        }
        message = 'Invalid credentials. Please check your email and password.';
      } else if (status === 403) {
        message = 'You do not have permission to perform this action.';
      } else if (status === 404) {
        message = 'The requested resource could not be found.';
      } else if (status === 409) {
        message = message || 'A conflict occurred.';
      } else if (status === 429) {
        message = 'Too many attempts. Please wait 60 seconds before trying again.';
      } else if (status >= 500) {
        message = 'A server error occurred. Please try again later.';
      }
    } else if (error.request) {
      message = 'Network error. Please check your connection.';
    }

    // Wrap the error with our centralized message
    return Promise.reject(new Error(message));
  }
);
