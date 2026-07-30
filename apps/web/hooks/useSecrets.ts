import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { secretsApi, CreateSecretPayload, UpdateSecretPayload } from '../lib/api/secrets';

export const secretKeys = {
  all: (orgId: string, vaultId: string) => ['secrets', orgId, vaultId] as const,
  detail: (orgId: string, vaultId: string, secretId: string) => ['secrets', orgId, vaultId, secretId] as const,
};

export function useSecrets(orgId: string, vaultId: string) {
  return useQuery({
    queryKey: secretKeys.all(orgId, vaultId),
    queryFn: () => secretsApi.getSecrets(orgId, vaultId),
    enabled: !!orgId && !!vaultId,
  });
}

export function useSecret(orgId: string, vaultId: string, secretId: string) {
  return useQuery({
    queryKey: secretKeys.detail(orgId, vaultId, secretId),
    queryFn: () => secretsApi.getSecret(orgId, vaultId, secretId),
    enabled: !!orgId && !!vaultId && !!secretId,
  });
}

export function useCreateSecret(orgId: string, vaultId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSecretPayload) => secretsApi.createSecret(orgId, vaultId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: secretKeys.all(orgId, vaultId) });
    },
  });
}

export function useUpdateSecret(orgId: string, vaultId: string, secretId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSecretPayload) => secretsApi.updateSecret(orgId, vaultId, secretId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: secretKeys.all(orgId, vaultId) });
      queryClient.invalidateQueries({ queryKey: secretKeys.detail(orgId, vaultId, secretId) });
    },
  });
}

export function useDeleteSecret(orgId: string, vaultId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (secretId: string) => secretsApi.deleteSecret(orgId, vaultId, secretId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: secretKeys.all(orgId, vaultId) });
    },
  });
}
