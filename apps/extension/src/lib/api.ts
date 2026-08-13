import type { ExtensionSession, StoredAuth } from './types';
import { Storage } from './storage';

// Injected at build time via esbuild define, or fallback for dev
const BASE_URL: string =
  (typeof __WITHUS_API_URL__ !== 'undefined' && __WITHUS_API_URL__ ? __WITHUS_API_URL__ : null) ??
  'http://127.0.0.1:4000/api/v1';

declare const __WITHUS_API_URL__: string | undefined;

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Extension-Client': 'withus-mv3',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as any).message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const WithusApi = {
  // ─── Auth ──────────────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<StoredAuth> {
    const res = await request<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string };
    }>('POST', '/auth/login', { email, password });

    // Access token is 1h; store expiry so we know when to refresh
    return {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      userId: res.user.id,
      email: res.user.email,
      expiresAt: Date.now() + 60 * 60 * 1000,
    };
  },

  async refresh(refreshToken: string): Promise<StoredAuth> {
    const auth = await Storage.getAuth();
    const res = await request<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string };
    }>('POST', '/auth/refresh', { refreshToken });

    return {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      userId: res.user?.id || auth?.userId || '',
      email: res.user?.email || auth?.email || '',
      expiresAt: Date.now() + 60 * 60 * 1000,
    };
  },

  async logout(refreshToken: string): Promise<void> {
    await request('POST', '/auth/logout', { refreshToken });
  },

  // ─── Me / Org ──────────────────────────────────────────────────────────────

  async getMe(token: string): Promise<{ id: string; email: string; organizationMemberships: { organizationId: string; role: string }[] }> {
    return request('GET', '/users/me', undefined, token);
  },

  // ─── Sessions ─────────────────────────────────────────────────────────────

  async getIncomingSessions(orgId: string, token: string): Promise<ExtensionSession[]> {
    return request('GET', `/organizations/${orgId}/sessions/incoming`, undefined, token);
  },

  // ─── Launch Session (Extension) ───────────────────────────────────────────

  async launchSession(
    orgId: string,
    sessionId: string,
    reason: string,
    token: string,
  ): Promise<{ plaintext: string }> {
    return request('POST', `/organizations/${orgId}/sessions/${sessionId}/reveal`, { reason }, token);
  },

  // ─── OTP Fetch ────────────────────────────────────────────────────────────

  /**
   * Requests the latest OTP from the grantor's Gmail inbox.
   * Returns only { otp: string } — no email content ever crosses this boundary.
   *
   * OTP Boundary Rule: this is the only place in the extension that calls /otp.
   * The content script receives only the extracted code string.
   */
  async fetchOtp(
    orgId: string,
    sessionId: string,
    token: string,
    platform?: string,
    loginStartTime?: number,
  ): Promise<{ otp: string }> {
    return request('POST', `/organizations/${orgId}/sessions/${sessionId}/otp`, { platform, loginStartTime }, token);
  },

  // ─── Presence Heartbeat ───────────────────────────────────────────────────

  /**
   * Report that the user is active on a given platform.
   *
   * This is fire-and-forget — the server always returns 204, and any network
   * or auth error is intentionally silenced. Heartbeat failures must never
   * interrupt autofill, session handling, or any other extension flow.
   *
   * The server validates that the user has an active authorized session for
   * the reported platform before recording the heartbeat.
   */
  async heartbeat(orgId: string, platform: string, token: string): Promise<void> {
    try {
      await request('POST', `/organizations/${orgId}/presence/heartbeat`, { platform }, token);
    } catch {
      // Intentionally silenced — presence is non-blocking
    }
  },
};

