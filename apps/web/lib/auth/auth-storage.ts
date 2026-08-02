/**
 * auth-storage.ts — Centralized authentication storage constants and helpers.
 *
 * B-9: Auth tokens (access + refresh) are now managed exclusively as httpOnly
 * cookies set and cleared by the API server. This module is responsible only
 * for the non-sensitive hydration data stored in localStorage:
 *   - USER_KEY / ORG_KEY: serialized user/org session data for fast context hydration
 *
 * To fully sign out a user, the client must call POST /api/v1/auth/logout so the
 * server clears the httpOnly cookies via Set-Cookie headers. Client-side code
 * cannot clear httpOnly cookies directly.
 */

export const STORAGE_KEYS = {
  USER: 'auth_user',
  ORG: 'auth_org',
} as const;

/** Cookie name expected in the sdap_token httpOnly cookie (set by the API server). */
export const AUTH_COOKIE_NAME = 'sdap_token';



/**
 * Clears non-sensitive session hydration data (user/org) from localStorage.
 *
 * NOTE: This does NOT clear the sdap_token or sdap_refresh_token httpOnly cookies —
 * those are server-managed and can only be cleared by the API via Set-Cookie headers.
 * Always call POST /api/v1/auth/logout before invoking this function so the server
 * clears its cookies first.
 */
export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  document.cookie = 'sdap_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

