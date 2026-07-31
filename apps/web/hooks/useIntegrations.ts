import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  integrationsApi,
  IntegrationProvider,
} from '../lib/api/integrations';

export function useIntegrations(orgId: string | null) {
  return useQuery({
    queryKey: ['integrations', orgId],
    queryFn: () => (orgId ? integrationsApi.listConnections(orgId) : Promise.resolve([])),
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

export function useConnectIntegration(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, token }: { provider: IntegrationProvider; token: string }) => {
      if (!orgId) throw new Error('Organization required');
      return integrationsApi.connect(orgId, provider, token);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations', orgId] }),
  });
}

export function useDisconnectIntegration(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: IntegrationProvider) => {
      if (!orgId) throw new Error('Organization required');
      return integrationsApi.disconnect(orgId, provider);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations', orgId] }),
  });
}

export function useHealthCheck(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: IntegrationProvider) => {
      if (!orgId) throw new Error('Organization required');
      return integrationsApi.healthCheck(orgId, provider);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations', orgId] }),
  });
}

export function useIntegrationResources(orgId: string | null, provider: IntegrationProvider | null) {
  return useQuery({
    queryKey: ['integrations', 'resources', orgId, provider],
    queryFn: () => integrationsApi.listResources(orgId!, provider!),
    enabled: !!orgId && !!provider,
  });
}

export function useGrantAccess(orgId: string | null, provider: IntegrationProvider) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { resourceId: string; principalEmail: string; role?: string }) => {
      if (!orgId) throw new Error('Organization required');
      return integrationsApi.grantAccess(orgId, provider, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integrations', orgId] });
    },
  });
}

export function useRevokeAccess(orgId: string | null, provider: IntegrationProvider) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { resourceId: string; principalEmail: string; referenceId?: string }) => {
      if (!orgId) throw new Error('Organization required');
      return integrationsApi.revokeAccess(orgId, provider, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations', orgId] }),
  });
}
