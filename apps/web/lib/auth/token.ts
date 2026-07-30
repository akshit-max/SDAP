/**
 * token.ts — Access token read/write helpers.
 *
 * B-3 Phase 1: Now uses STORAGE_KEYS from auth-storage.ts so all key
 * strings are in one place.
 *
 * B-9 migration note: setToken/clearToken are the ONLY functions that need
 * to change when we move to httpOnly cookies. The cookie write here is a
 * non-httpOnly mirror for Next.js middleware route protection — it will be
 * superseded by the server-set httpOnly cookie in B-9.
 */
import { STORAGE_KEYS, AUTH_COOKIE_NAME } from './auth-storage';

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
};

export const setToken = (token: string, expiresAt?: Date): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);

  // Track expiry so startup checks can detect stale sessions
  if (expiresAt) {
    localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toISOString());
  } else {
    // Default: access tokens are 15 minutes, add 1-minute buffer
    const defaultExpiry = new Date(Date.now() + 14 * 60 * 1000);
    localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, defaultExpiry.toISOString());
  }

  // Mirror to non-httpOnly cookie so Next.js middleware can read it
  // B-9 note: this line moves to the server (Set-Cookie header) in the
  // cookie migration. Clients will no longer set this cookie themselves.
  document.cookie = `${AUTH_COOKIE_NAME}=${token}; path=/; max-age=86400; SameSite=Lax`;
};

export const clearToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};
