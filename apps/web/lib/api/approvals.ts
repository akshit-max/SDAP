import { apiClient } from './client';
import { ApprovalRequestDto, ResolveApprovalRequestDto } from '@repo/types';

export const approvalsApi = {
  getPendingApprovals: async (orgId: string): Promise<ApprovalRequestDto[]> => {
    const response = await apiClient.get(`/organizations/${orgId}/approvals/pending`);
    return response.data;
  },

  getMyRequests: async (orgId: string): Promise<ApprovalRequestDto[]> => {
    const response = await apiClient.get(`/organizations/${orgId}/approvals/requests`);
    return response.data;
  },

  resolveApproval: async (
    orgId: string, 
    approvalId: string, 
    data: ResolveApprovalRequestDto
  ): Promise<ApprovalRequestDto> => {
    const response = await apiClient.post(`/organizations/${orgId}/approvals/${approvalId}/resolve`, data);
    return response.data;
  },
};
