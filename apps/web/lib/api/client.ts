import axios, { AxiosError } from 'axios';
import { getToken, clearToken } from '../auth/token';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
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
        clearToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        message = 'Your session has expired. Please log in again.';
      } else if (status === 403) {
        message = 'You do not have permission to perform this action.';
      } else if (status === 404) {
        message = 'The requested resource could not be found.';
      } else if (status === 409) {
        message = message || 'A conflict occurred.';
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
