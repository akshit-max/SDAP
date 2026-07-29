import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalsApi } from '../lib/api/approvals';
import { ResolveApprovalRequestDto } from '@repo/types';

export function usePendingApprovals(orgId: string | null) {
  return useQuery({
    queryKey: ['approvals', 'pending', orgId],
    queryFn: () => (orgId ? approvalsApi.getPendingApprovals(orgId) : Promise.resolve([])),
    enabled: !!orgId,
  });
}

export function useMyRequests(orgId: string | null) {
  return useQuery({
    queryKey: ['approvals', 'requests', orgId],
    queryFn: () => (orgId ? approvalsApi.getMyRequests(orgId) : Promise.resolve([])),
    enabled: !!orgId,
  });
}

export function useResolveApproval(orgId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ approvalId, data }: { approvalId: string; data: ResolveApprovalRequestDto }) => {
      if (!orgId) throw new Error('Organization ID is required');
      return approvalsApi.resolveApproval(orgId, approvalId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals', 'pending', orgId] });
      queryClient.invalidateQueries({ queryKey: ['approvals', 'requests', orgId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] }); // Because resolving might create a session
    },
  });
}
