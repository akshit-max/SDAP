import { useQuery } from '@tanstack/react-query';
import { secretsApi } from '../lib/api/secrets';

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
