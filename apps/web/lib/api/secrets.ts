import { apiClient } from './client';
import { SecretResponse } from '@repo/types';

export const secretsApi = {
  getSecrets: async (orgId: string, vaultId: string): Promise<SecretResponse[]> => {
    const response = await apiClient.get(`/organizations/${orgId}/vaults/${vaultId}/secrets`);
    return response.data;
  },

  getSecret: async (orgId: string, vaultId: string, secretId: string): Promise<SecretResponse> => {
    const response = await apiClient.get(`/organizations/${orgId}/vaults/${vaultId}/secrets/${secretId}`);
    return response.data;
  },
};
