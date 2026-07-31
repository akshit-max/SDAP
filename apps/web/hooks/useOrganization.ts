import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '../lib/api/organizations';

export const orgKeys = {
  detail: (orgId: string) => ['organization', orgId] as const,
  members: (orgId: string) => ['organization', orgId, 'members'] as const,
};

export function useOrganization(orgId: string) {
  return useQuery({
    queryKey: orgKeys.detail(orgId),
    queryFn: () => organizationsApi.getOrganization(orgId),
    enabled: !!orgId,
  });
}

export function useOrgMembers(orgId: string) {
  return useQuery({
    queryKey: orgKeys.members(orgId),
    queryFn: () => organizationsApi.getMembers(orgId),
    enabled: !!orgId,
  });
}

export function useUpdateOrganization(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string }) => organizationsApi.updateOrganization(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.detail(orgId) });
    },
  });
}

export function useInviteMember(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => organizationsApi.inviteMember(orgId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.members(orgId) });
    },
  });
}

export function useAcceptInvite() {
  return useMutation({
    mutationFn: (token: string) => organizationsApi.acceptInvite(token),
  });
}

export function useInvitationDetails(token: string) {
  return useQuery({
    queryKey: ['invitation', token],
    queryFn: () => organizationsApi.getInvitationDetails(token),
    enabled: !!token,
  });
}

export function useOrgInvitations(orgId: string) {
  return useQuery({
    queryKey: ['organization', orgId, 'invitations'],
    queryFn: () => organizationsApi.getInvitations(orgId),
    enabled: !!orgId,
  });
}

export function useCancelInvitation(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => organizationsApi.cancelInvitation(orgId, inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', orgId, 'invitations'] });
    },
  });
}

export function useChangeMemberRole(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: 'ADMIN' | 'MEMBER' }) =>
      organizationsApi.changeMemberRole(orgId, memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.members(orgId) });
    },
  });
}

export function useRemoveMember(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => organizationsApi.removeMember(orgId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.members(orgId) });
    },
  });
}
