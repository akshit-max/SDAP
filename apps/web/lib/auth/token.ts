const TOKEN_KEY = 'sdap_jwt';

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  // Also set a non-http-only cookie so middleware can read it for route protection
  document.cookie = `sdap_token=${token}; path=/; max-age=86400; SameSite=Lax`;
};

export const clearToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = 'sdap_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
};
