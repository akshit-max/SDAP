/**
 * session.ts — Typed session read/write helpers.
 *
 * B-3 Phase 1: All localStorage keys now sourced from STORAGE_KEYS constants.
 * clearAuthStorage() replaces manual key removal in clear().
 * isStoredTokenExpired() is called by AuthContext on startup to detect
 * stale localStorage sessions.
 */
import { setToken, clearToken, getToken } from './token';
import { STORAGE_KEYS, clearAuthStorage, isStoredTokenExpired } from './auth-storage';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
}

export interface OrganizationSession {
  id: string;
  name: string;
  slug?: string;
}

export class AuthSession {
  static getAccessToken(): string | null {
    return getToken();
  }

  static getCurrentUser(): UserSession | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  }

  static getCurrentOrganization(): OrganizationSession | null {
    if (typeof window === 'undefined') return null;
    const orgStr = localStorage.getItem(STORAGE_KEYS.ORG);
    return orgStr ? JSON.parse(orgStr) : null;
  }

  /**
   * Returns true if the stored token has passed its tracked expiry.
   * Call on app startup to avoid hydrating a stale session.
   */
  static isExpired(): boolean {
    return isStoredTokenExpired();
  }

  static setSession(
    accessToken: string,
    user: UserSession,
    organization: OrganizationSession | null,
    expiresAt?: Date,
  ) {
    setToken(accessToken, expiresAt);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      if (organization) {
        localStorage.setItem(STORAGE_KEYS.ORG, JSON.stringify(organization));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ORG);
      }
    }
  }

  static clear() {
    clearToken();
    clearAuthStorage();
  }
}
