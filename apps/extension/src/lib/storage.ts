import type { StoredAuth } from './types';

const AUTH_KEY = 'withus_auth';
const PRESENCE_KEY = 'withus_presence'; // { platform: string; orgId: string } | null

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

  // ─── Presence ─────────────────────────────────────────────────────────────
  // Persisted across service-worker terminations (Chrome MV3 ephemeral workers).

  async setPresence(data: { platform: string; orgId: string } | null): Promise<void> {
    if (data === null) {
      await chrome.storage.local.remove(PRESENCE_KEY);
    } else {
      await chrome.storage.local.set({ [PRESENCE_KEY]: data });
    }
  },

  async getPresence(): Promise<{ platform: string; orgId: string } | null> {
    const result = await chrome.storage.local.get(PRESENCE_KEY);
    return (result[PRESENCE_KEY] as { platform: string; orgId: string }) ?? null;
  },
};
