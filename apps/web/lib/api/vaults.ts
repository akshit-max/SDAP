import { apiClient } from './client';
import { VaultResponse, CreateVaultDto } from '@repo/types';

export const vaultsApi = {
  getVaults: async (orgId: string): Promise<VaultResponse[]> => {
    const response = await apiClient.get(`/organizations/${orgId}/vaults`);
    return response.data;
  },

  getVault: async (orgId: string, vaultId: string): Promise<VaultResponse> => {
    const response = await apiClient.get(`/organizations/${orgId}/vaults/${vaultId}`);
    return response.data;
  },

  createVault: async (orgId: string, data: CreateVaultDto): Promise<VaultResponse> => {
    const response = await apiClient.post(`/organizations/${orgId}/vaults`, data);
    return response.data;
  },

  updateVault: async (orgId: string, vaultId: string, data: Partial<CreateVaultDto>): Promise<VaultResponse> => {
    const response = await apiClient.patch(`/organizations/${orgId}/vaults/${vaultId}`, data);
    return response.data;
  },

  deleteVault: async (orgId: string, vaultId: string): Promise<void> => {
    await apiClient.delete(`/organizations/${orgId}/vaults/${vaultId}`);
  },
};
