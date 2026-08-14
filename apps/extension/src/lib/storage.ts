import type { StoredAuth } from './types';

const AUTH_KEY = 'withus_auth';

/**
 * PRESENCE_TABS_KEY stores a Record<tabId, {platform, orgId}>.
 *
 * Why a map instead of a single value?
 *
 * Problem with single value:
 *   Tab 1 (MCA) writes { platform: 'MCA' }
 *   Tab 2 (GitHub) writes { platform: 'GitHub' }   ← overwrites MCA
 *   Tab 2 closes → no cleanup → heartbeat still fires for GitHub
 *   Even if Tab 1 (MCA) is still open
 *
 * With a tab-keyed map:
 *   { "123": { platform: 'MCA', orgId: '...' },
 *     "456": { platform: 'GitHub', orgId: '...' } }
 *   Tab 456 closes → entry "456" removed → map still has "123" (MCA)
 *   Heartbeat reads remaining entries → continues for MCA ✓
 *   All tabs gone → map empty → no heartbeat → 90s later: ⚫ Inactive ✓
 */
const PRESENCE_TABS_KEY = 'withus_presence_tabs';

export type PresenceEntry = { platform: string; orgId: string };
type PresenceTabs = Record<string, PresenceEntry>; // key = tabId (as string)

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

  // ─── Presence (tab-keyed map) ─────────────────────────────────────────────
  // Persisted across service-worker terminations (Chrome MV3 ephemeral workers).
  // One entry per tab — tab IDs are numbers, stored as string keys.

  async _getPresenceTabs(): Promise<PresenceTabs> {
    const result = await chrome.storage.local.get(PRESENCE_TABS_KEY);
    return (result[PRESENCE_TABS_KEY] as PresenceTabs) ?? {};
  },

  /**
   * Register that a specific tab is active on a platform.
   * Called from service worker PLATFORM_ACTIVE handler (with sender.tab.id).
   */
  async setTabPresence(tabId: number, entry: PresenceEntry): Promise<void> {
    const tabs = await Storage._getPresenceTabs();
    tabs[String(tabId)] = entry;
    await chrome.storage.local.set({ [PRESENCE_TABS_KEY]: tabs });
  },

  /**
   * Remove a tab's presence entry.
   * Called when a tab closes (chrome.tabs.onRemoved) or navigates away (PLATFORM_GONE).
   */
  async clearTabPresence(tabId: number): Promise<void> {
    const tabs = await Storage._getPresenceTabs();
    if (!tabs[String(tabId)]) return; // Nothing to do
    delete tabs[String(tabId)];
    if (Object.keys(tabs).length === 0) {
      // Map is now empty — remove the key entirely so getActiveTabs() returns {}
      await chrome.storage.local.remove(PRESENCE_TABS_KEY);
    } else {
      await chrome.storage.local.set({ [PRESENCE_TABS_KEY]: tabs });
    }
  },

  /**
   * Returns all currently tracked active tabs.
   * Empty object → no active platform tabs → heartbeat should not fire.
   */
  async getActiveTabs(): Promise<PresenceTabs> {
    return Storage._getPresenceTabs();
  },
};
