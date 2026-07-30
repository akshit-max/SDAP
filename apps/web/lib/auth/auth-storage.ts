/**
 * auth-storage.ts — Centralized authentication storage constants and helpers.
 *
 * B-3 Phase 1: Centralize token management.
 *
 * All storage key literals live here. No other file should hard-code
 * localStorage key strings. This prevents accidental key drift and makes
 * a future migration to httpOnly cookies (B-9) a single-file change.
 *
 * Key design decisions:
 *   - TOKEN_KEY: access token (JWT) — also mirrored to a cookie for middleware
 *   - REFRESH_KEY: raw refresh token — used by the API client to rotate tokens
 *   - USER_KEY / ORG_KEY: serialized user/org session data
 *   - EXPIRES_KEY: ISO timestamp of when the access token expires — used to
 *     detect and auto-clear stale sessions on startup
 *
 * B-9 migration note:
 *   When moving to httpOnly cookies, token.ts setToken/clearToken will change.
 *   All callers use the exported helpers (setToken, getToken, clearToken, etc.)
 *   — they will NOT need to change. Only this file and token.ts change.
 */

export const STORAGE_KEYS = {
  TOKEN: 'sdap_jwt',
  REFRESH: 'sdap_refresh',
  USER: 'auth_user',
  ORG: 'auth_org',
  EXPIRES_AT: 'auth_expires_at',
} as const;

/** Cookie name read by Next.js middleware for route protection */
export const AUTH_COOKIE_NAME = 'sdap_token';

/**
 * Returns true if the stored access token is past its tracked expiry.
 * Used on app startup to avoid using a stale localStorage session.
 */
export function isStoredTokenExpired(): boolean {
  if (typeof window === 'undefined') return false;
  const expiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
  if (!expiresAt) return false; // No expiry tracked — assume valid (legacy)
  return new Date(expiresAt) < new Date();
}

/**
 * Clears all auth-related keys from localStorage and the middleware cookie.
 * Single point of truth for "sign out" storage operations.
 */
export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
