import { apiClient } from './client';
import { SecretResponse } from '@repo/types';

export interface CreateSecretPayload {
  name: string;
  plaintext: string;
  description?: string;
  type?: string;
}

export interface UpdateSecretPayload {
  name?: string;
  description?: string;
  plaintext?: string;
}

export const secretsApi = {
  getSecrets: async (orgId: string, vaultId: string): Promise<SecretResponse[]> => {
    const response = await apiClient.get(`/organizations/${orgId}/vaults/${vaultId}/secrets`);
    return response.data;
  },

  getSecret: async (orgId: string, vaultId: string, secretId: string): Promise<SecretResponse> => {
    const response = await apiClient.get(`/organizations/${orgId}/vaults/${vaultId}/secrets/${secretId}`);
    return response.data;
  },

  createSecret: async (orgId: string, vaultId: string, data: CreateSecretPayload): Promise<SecretResponse> => {
    const response = await apiClient.post(`/organizations/${orgId}/vaults/${vaultId}/secrets`, data);
    return response.data;
  },

  updateSecret: async (orgId: string, vaultId: string, secretId: string, data: UpdateSecretPayload): Promise<SecretResponse> => {
    const response = await apiClient.patch(`/organizations/${orgId}/vaults/${vaultId}/secrets/${secretId}`, data);
    return response.data;
  },

  deleteSecret: async (orgId: string, vaultId: string, secretId: string): Promise<void> => {
    await apiClient.delete(`/organizations/${orgId}/vaults/${vaultId}/secrets/${secretId}`);
  },
};
