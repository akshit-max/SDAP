/**
 * WITHUS Extension — Service Worker (MV3)
 *
 * Responsibilities:
 *  - Auth: login, refresh token, logout
 *  - Session lookup: find active delegated sessions for the current org
 *  - Secret reveal: call WITHUS API and return plaintext
 *  - Token auto-refresh: alarm fires every 50 minutes
 *
 * No business logic here — all decisions are made by the WITHUS backend.
 */

import { Storage } from '../lib/storage';
import { WithusApi } from '../lib/api';
import type { ExtensionMessage, ExtensionResponse } from '../lib/types';

// ─── Token Auto-Refresh ──────────────────────────────────────────────────────

chrome.alarms.create('token-refresh', { periodInMinutes: 50 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'token-refresh') return;
  const auth = await Storage.getAuth();
  if (!auth?.refreshToken) return;

  try {
    const fresh = await WithusApi.refresh(auth.refreshToken);
    await Storage.setAuth(fresh);
  } catch {
    // Refresh failed — user will be asked to log in again via popup
    await Storage.clearAuth();
  }
});

// ─── Message Handler ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (res: ExtensionResponse) => void,
  ) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((err) => sendResponse({ success: false, error: String(err?.message || err) }));

    // Return true to keep the message channel open for async response
    return true;
  },
);

async function handleMessage(msg: ExtensionMessage): Promise<ExtensionResponse> {
  switch (msg.type) {
    // ─── CHECK_AUTH ──────────────────────────────────────────────────────────
    case 'CHECK_AUTH': {
      const auth = await Storage.getAuth();
      if (!auth) return { success: false, error: 'NOT_AUTHENTICATED' };
      const isValid = await Storage.isAuthenticated();
      if (!isValid) return { success: false, error: 'TOKEN_EXPIRED' };
      return { success: true, data: { email: auth.email } };
    }

    // ─── GET_ACTIVE_SESSION ──────────────────────────────────────────────────
    case 'GET_ACTIVE_SESSION': {
      const { domain } = msg.payload as { domain: string };
      const auth = await Storage.getAuth();
      if (!auth) return { success: false, error: 'NOT_AUTHENTICATED' };

      // Get user memberships to find org
      const me = await WithusApi.getMe(auth.accessToken);
      const orgId = me.organizationMemberships?.[0]?.organizationId;
      if (!orgId) return { success: false, error: 'NO_ORGANIZATION' };

      const sessions = await WithusApi.getIncomingSessions(orgId, auth.accessToken);

      // Filter: find sessions whose secret name contains the provider domain
      // (Convention: secrets for godaddy.com should be named with "godaddy" in the name)
      const hostname = domain.replace(/^www\./, '');
      const matching = sessions.filter((s) => {
        const name = s.secretName?.toLowerCase() || '';
        // Match by provider name keywords in secret name
        return hostname.split('.').some((part) => name.includes(part) && part.length > 3);
      });

      return {
        success: true,
        data: { sessions: matching, orgId },
      };
    }

    // ─── REVEAL_SECRET ───────────────────────────────────────────────────────
    case 'REVEAL_SECRET': {
      const { sessionId, orgId } = msg.payload as { sessionId: string; orgId: string };
      const auth = await Storage.getAuth();
      if (!auth) return { success: false, error: 'NOT_AUTHENTICATED' };

      const result = await WithusApi.revealSecret(
        orgId,
        sessionId,
        'Browser extension autofill',
        auth.accessToken,
      );

      // Parse username:password format
      // Convention: secrets for autofill are stored as "username:password"
      const [username, ...rest] = result.plaintext.split('\n');
      const password = rest.join('\n');

      return { success: true, data: { username, password } };
    }

    // ─── LOGOUT ──────────────────────────────────────────────────────────────
    case 'LOGOUT': {
      const auth = await Storage.getAuth();
      if (auth?.refreshToken) {
        await WithusApi.logout(auth.refreshToken).catch(() => {
          // Ignore — still clear local state
        });
      }
      await Storage.clearAuth();
      return { success: true };
    }

    default:
      return { success: false, error: `Unknown message type: ${(msg as any).type}` };
  }
}
