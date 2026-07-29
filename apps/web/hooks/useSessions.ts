import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '../lib/api/sessions';
import { CreateSessionDto } from '@repo/types';

export function useIncomingSessions(orgId: string | null) {
  return useQuery({
    queryKey: ['sessions', 'incoming', orgId],
    queryFn: () => (orgId ? sessionsApi.getIncomingSessions(orgId) : Promise.resolve([])),
    enabled: !!orgId,
  });
}

export function useOutgoingSessions(orgId: string | null) {
  return useQuery({
    queryKey: ['sessions', 'outgoing', orgId],
    queryFn: () => (orgId ? sessionsApi.getOutgoingSessions(orgId) : Promise.resolve([])),
    enabled: !!orgId,
  });
}

export function useCreateSession(orgId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSessionDto) => {
      if (!orgId) throw new Error('Organization ID is required');
      return sessionsApi.createSession(orgId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', 'outgoing', orgId] });
    },
  });
}

export function useRevokeSession(orgId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sessionId: string) => {
      if (!orgId) throw new Error('Organization ID is required');
      return sessionsApi.revokeSession(orgId, sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', 'outgoing', orgId] });
    },
  });
}

export function useRevealSessionSecret(orgId: string | null) {
  return useMutation({
    mutationFn: ({ sessionId, reason }: { sessionId: string; reason: string }) => {
      if (!orgId) throw new Error('Organization ID is required');
      return sessionsApi.revealSecretViaSession(orgId, sessionId, reason);
    },
  });
}
