import { apiClient } from './client';

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface CreatedApiKey extends ApiKey {
  /** Shown ONCE — store securely, never shown again */
  rawKey: string;
}

export const apiKeysApi = {
  list: async (orgId: string): Promise<ApiKey[]> => {
    const res = await apiClient.get(`/organizations/${orgId}/api-keys`);
    return res.data;
  },

  create: async (
    orgId: string,
    data: { name: string; expiresAt?: string },
  ): Promise<CreatedApiKey> => {
    const res = await apiClient.post(`/organizations/${orgId}/api-keys`, data);
    return res.data;
  },

  revoke: async (orgId: string, keyId: string): Promise<void> => {
    await apiClient.delete(`/organizations/${orgId}/api-keys/${keyId}`);
  },

  rotate: async (orgId: string, keyId: string): Promise<CreatedApiKey> => {
    const res = await apiClient.post(`/organizations/${orgId}/api-keys/${keyId}/rotate`, {});
    return res.data;
  },
};
