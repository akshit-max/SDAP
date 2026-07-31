import type { StoredAuth } from './types';

const AUTH_KEY = 'withus_auth';

export const Storage = {
  async getAuth(): Promise<StoredAuth | null> {
    const result = await chrome.storage.local.get(AUTH_KEY);
    return (result[AUTH_KEY] as StoredAuth) ?? null;
  },

  async setAuth(auth: StoredAuth): Promise<void> {
    await chrome.storage.local.set({ [AUTH_KEY]: auth });
  },

  async clearAuth(): Promise<void> {
    await chrome.storage.local.remove(AUTH_KEY);
  },

  async isAuthenticated(): Promise<boolean> {
    const auth = await Storage.getAuth();
    if (!auth) return false;
    // Check token isn't expired (with 60s buffer)
    return Date.now() < auth.expiresAt - 60_000;
  },
};
