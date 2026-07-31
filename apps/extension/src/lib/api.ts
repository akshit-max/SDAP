import type { ExtensionSession, StoredAuth } from './types';
import { Storage } from './storage';

// Injected at build time via esbuild define, or fallback for dev
const BASE_URL: string =
  (typeof __WITHUS_API_URL__ !== 'undefined' ? __WITHUS_API_URL__ : null) ??
  'http://localhost:3001/api/v1';

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

  // ─── Reveal ───────────────────────────────────────────────────────────────

  async revealSecret(
    orgId: string,
    sessionId: string,
    reason: string,
    token: string,
  ): Promise<{ plaintext: string }> {
    return request('POST', `/organizations/${orgId}/sessions/${sessionId}/reveal`, { reason }, token);
  },
};
