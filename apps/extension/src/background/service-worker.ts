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

chrome.runtime.onInstalled.addListener(() => {
  // Disable Chrome's built-in password manager to prevent saving delegated credentials
  if (chrome.privacy && chrome.privacy.services && chrome.privacy.services.passwordSavingEnabled) {
    chrome.privacy.services.passwordSavingEnabled.set({ value: false, scope: 'regular' }).catch(() => {
      // Ignore if permission not fully granted or policy blocks it
    });
  }
});

// ─── Event Listeners ─────────────────────────────────────────────────────────

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

      // Get user memberships to find orgs
      const me = await WithusApi.getMe(auth.accessToken);
      const memberships = me.organizationMemberships || [];
      if (memberships.length === 0) return { success: false, error: 'NO_ORGANIZATION' };

      let allSessions: any[] = [];
      const hostname = domain.replace(/^www\./, '');

      // Fetch sessions for all orgs in parallel
      await Promise.all(
        memberships.map(async (m) => {
          try {
            const sessions = await WithusApi.getIncomingSessions(m.organizationId, auth.accessToken);
            // Attach orgId so the extension knows which org to launch the session against
            const matching = sessions.filter((s) => {
              if (s.status !== 'ACTIVE') return false;
              if (s.expiresAt && new Date(s.expiresAt) < new Date()) return false;
              
              const name = s.resourceName?.toLowerCase() || '';
              if (!name) return false;
              // Match sessions to the current domain bidirectionally:
              //   1. A hostname segment is contained in the resourceName  (e.g. "github" ∈ "github")
              //   2. The resourceName is contained in a hostname segment  (e.g. "udyam" ∈ "udyamregistration")
              // Skip generic TLD/infrastructure tokens that would cause false positives.
              // Floor of 3 chars keeps acronyms (mca, gst) while filtering "in", "co" etc.
              const GENERIC = new Set(['gov', 'com', 'net', 'org', 'in', 'co', 'www', 'app', 'api']);
              const parts = hostname.split('.').filter(p => p.length >= 3 && !GENERIC.has(p));
              return parts.some((part) => name.includes(part) || part.includes(name));

            }).map(s => ({ ...s, __orgId: m.organizationId }));
            
            allSessions = allSessions.concat(matching);
          } catch (e) {
            // Ignore errors for individual orgs
          }
        })
      );

      return {
        success: true,
        data: { sessions: allSessions, orgId: memberships[0].organizationId }, // orgId kept for backwards compat
      };
    }

    // ─── LAUNCH_SESSION ───────────────────────────────────────────────────────
    case 'LAUNCH_SESSION': {
      const { sessionId, orgId } = msg.payload as { sessionId: string; orgId: string };
      const auth = await Storage.getAuth();
      if (!auth) return { success: false, error: 'NOT_AUTHENTICATED' };

      const result = await WithusApi.launchSession(
        orgId,
        sessionId,
        'Browser extension autofill',
        auth.accessToken,
      );

      // Parse username and password format. Supports:
      //   1. Newline-separated: "username\npassword"
      //   2. Colon-separated:   "username:password"
      //   3. Space-separated:   "user@email.com password123"
      //      (first token treated as username when it looks like an email/username)
      //   4. Single value:      entire plaintext is the password
      let username = '';
      let password = '';
      if (result.plaintext.includes('\n')) {
        const parts = result.plaintext.split('\n');
        username = parts[0].trim();
        password = parts.slice(1).join('\n').trim();
      } else if (result.plaintext.includes(':')) {
        const parts = result.plaintext.split(':');
        username = parts[0].trim();
        password = parts.slice(1).join(':').trim();
      } else if (result.plaintext.includes(' ')) {
        // Space-separated: split on FIRST space only.
        // Treat first token as username if it looks like email/username (no spaces, has @).
        // E.g. "akshitaksir@gmail.com Akshitbhan@2005" → user="akshitaksir@gmail.com", pass="Akshitbhan@2005"
        const spaceIdx = result.plaintext.indexOf(' ');
        const firstToken = result.plaintext.slice(0, spaceIdx);
        const rest = result.plaintext.slice(spaceIdx + 1);
        if (firstToken.includes('@') || firstToken.length < 50) {
          username = firstToken;
          password = rest;
        } else {
          username = '';
          password = result.plaintext;
        }
      } else {
        username = ''; // Single value — treat as password only
        password = result.plaintext;
      }

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

    // ─── FETCH_OTP ────────────────────────────────────────────────────────────
    // Called by autofill.ts after a login form is submitted and an OTP field appears.
    // The service worker holds the auth token — the content script never sees it.
    // Returns only { otp: string }. OTP Boundary Rule enforced here.
    case 'FETCH_OTP': {
      const { sessionId, orgId, platform, loginStartTime } = msg.payload as { sessionId: string; orgId: string; platform?: string; loginStartTime?: number };
      const auth = await Storage.getAuth();
      if (!auth) return { success: false, error: 'NOT_AUTHENTICATED' };

      const result = await WithusApi.fetchOtp(orgId, sessionId, auth.accessToken, platform, loginStartTime);
      // Pass only the code string — nothing from the email body crosses this boundary.
      return { success: true, data: { otp: result.otp } };
    }

    default:
      return { success: false, error: `Unknown message type: ${(msg as any).type}` };
  }
}
