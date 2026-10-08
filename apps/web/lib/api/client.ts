import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearAuthStorage } from '../auth/auth-storage';

// Extend AxiosRequestConfig to carry our internal retry flag
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: Array<(success: boolean) => void> = [];

function notifySubscribers(success: boolean) {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
}

function waitForRefresh(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    refreshSubscribers.push((success) => {
      if (success) resolve();
      else reject(new Error('Session expired. Please log in again.'));
    });
  });
}

async function attemptSilentRefresh(): Promise<boolean> {
  try {
    let csrfToken = '';
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(new RegExp('(^| )sdap_csrf=([^;]+)'));
      if (match && match[2]) {
        csrfToken = match[2];
      }
    }

    await axios.post(
      `/api/v1/auth/refresh`,
      {},
      { 
        withCredentials: true,
        headers: {
          'X-CSRF-Token': csrfToken
        }
      },
    );
    return true;
  } catch {
    return false;
  }
}

function forceLogout(reason?: 'session_displaced' | 'expired') {
  clearAuthStorage();
  
  if (typeof window !== 'undefined') {
    // Notify the UI before redirecting so it can show a contextual message
    if (reason === 'session_displaced') {
      window.dispatchEvent(new CustomEvent('withus:session_displaced'));
      // Small delay to allow the event listener to show the banner before redirect
      setTimeout(() => { window.location.href = '/login?reason=displaced'; }, 1500);
      return;
    }

    const csrfMatch = document.cookie.match(new RegExp('(^| )sdap_csrf=([^;]+)'));
    const csrfToken = csrfMatch && csrfMatch[2] ? csrfMatch[2] : '';
    
    fetch(`/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({})
    }).finally(() => {
      window.location.href = '/login';
    });
  }
}

export const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // Send cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(new RegExp('(^| )sdap_csrf=([^;]+)'));
    if (match && match[2]) {
      config.headers['X-CSRF-Token'] = match[2];
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalConfig = error.config as RetryableConfig | undefined;

    if (error.response?.status === 401 && originalConfig) {
      const isAuthEndpoint =
        originalConfig.url?.includes('/auth/login') ||
        originalConfig.url?.includes('/auth/register') ||
        originalConfig.url?.includes('/auth/refresh');

      const isAuthPage =
        typeof window !== 'undefined' &&
        (window.location.pathname.startsWith('/login') ||
          window.location.pathname.startsWith('/register'));

      if (!isAuthEndpoint && !isAuthPage) {
        if (originalConfig._retry) {
          // Check if the refresh itself returned SESSION_DISPLACED
          const errMsg = (error.response?.data as any)?.message;
          if (errMsg === 'SESSION_DISPLACED') {
            forceLogout('session_displaced');
            return Promise.reject(new Error('SESSION_DISPLACED'));
          }
          forceLogout();
          return Promise.reject(new Error('Session expired. Please log in again.'));
        }

        originalConfig._retry = true;

        if (isRefreshing) {
          try {
            await waitForRefresh();
            return apiClient(originalConfig);
          } catch (queueError) {
            return Promise.reject(queueError);
          }
        }

        isRefreshing = true;
        const refreshed = await attemptSilentRefresh();
        isRefreshing = false;

        if (refreshed) {
          notifySubscribers(true);
          return apiClient(originalConfig);
        } else {
          notifySubscribers(false);
          forceLogout();
          return Promise.reject(new Error('Session expired. Please log in again.'));
        }
      }
    }

    let message = 'An unexpected error occurred';
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as { message?: string; error?: string };
      message = data?.message || data?.error || message;

      if (status === 401) {
        message = 'Invalid credentials. Please check your email and password.';
      } else if (status === 403) {
        const serverMsg = Array.isArray(data?.message) ? data.message[0] : data?.message;
        message = serverMsg && serverMsg !== 'Forbidden resource' && serverMsg !== 'Forbidden'
          ? serverMsg
          : 'You do not have permission to perform this action.';
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

