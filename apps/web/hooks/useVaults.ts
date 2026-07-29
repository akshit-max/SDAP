import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vaultsApi } from '../lib/api/vaults';
import { CreateVaultDto } from '@repo/types';

export const vaultKeys = {
  all: (orgId: string) => ['vaults', orgId] as const,
  detail: (orgId: string, vaultId: string) => ['vaults', orgId, vaultId] as const,
};

export function useVaults(orgId: string) {
  return useQuery({
    queryKey: vaultKeys.all(orgId),
    queryFn: () => vaultsApi.getVaults(orgId),
    enabled: !!orgId,
  });
}

export function useVault(orgId: string, vaultId: string) {
  return useQuery({
    queryKey: vaultKeys.detail(orgId, vaultId),
    queryFn: () => vaultsApi.getVault(orgId, vaultId),
    enabled: !!orgId && !!vaultId,
  });
}

export function useCreateVault(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVaultDto) => vaultsApi.createVault(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vaultKeys.all(orgId) });
    },
  });
}

export function useDeleteVault(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vaultId: string) => vaultsApi.deleteVault(orgId, vaultId),
    onSuccess: (_, vaultId) => {
      queryClient.invalidateQueries({ queryKey: vaultKeys.all(orgId) });
      queryClient.removeQueries({ queryKey: vaultKeys.detail(orgId, vaultId) });
    },
  });
}
