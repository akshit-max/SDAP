import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '../lib/api/sessions';
import { CreateSessionDto } from '@repo/types';

export function useIncomingSessions(orgId: string | null) {
  return useQuery({
    queryKey: ['sessions', 'incoming'],
    // Always use the global endpoint — grantees may not have an org
    queryFn: () => sessionsApi.getMyIncomingSessions(),
    enabled: true,
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
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
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
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
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

/**
 * Admin hook: fetch all sessions where a specific member is the grantee.
 * Enabled only when orgId and memberId are both present.
 */
export function useSessionsByMember(orgId: string | null, memberId: string | null) {
  return useQuery({
    queryKey: ['sessions', 'member', orgId, memberId],
    queryFn: () => sessionsApi.getSessionsByMember(orgId!, memberId!),
    enabled: !!orgId && !!memberId,
  });
}

/**
 * Admin mutation: revoke all active sessions for a specific member.
 * Invalidates both the general sessions cache and the per-member cache.
 */
export function useRevokeAllForMember(orgId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => {
      if (!orgId) throw new Error('Organization ID is required');
      return sessionsApi.revokeAllForMember(orgId, memberId);
    },
    onSuccess: (_data, memberId) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'member', orgId, memberId] });
    },
  });
}
