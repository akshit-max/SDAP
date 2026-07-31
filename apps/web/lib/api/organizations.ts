import { apiClient } from './client';

export interface OrganizationMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

export const organizationsApi = {
  getOrganization: async (orgId: string) => {
    const response = await apiClient.get(`/organizations/${orgId}`);
    return response.data?.data;
  },

  updateOrganization: async (orgId: string, data: { name?: string }) => {
    const response = await apiClient.patch(`/organizations/${orgId}`, data);
    return response.data?.data;
  },

  getMembers: async (orgId: string): Promise<OrganizationMember[]> => {
    const response = await apiClient.get(`/organizations/${orgId}/members`);
    return response.data?.data || [];
  },

  inviteMember: async (orgId: string, email: string) => {
    const response = await apiClient.post(`/organizations/${orgId}/invites`, { email });
    return response.data;
  },

  getInvitations: async (orgId: string) => {
    const response = await apiClient.get(`/organizations/${orgId}/invites`);
    return response.data?.data || [];
  },

  cancelInvitation: async (orgId: string, inviteId: string) => {
    const response = await apiClient.delete(`/organizations/${orgId}/invites/${inviteId}`);
    return response.data;
  },

  changeMemberRole: async (orgId: string, memberId: string, role: 'ADMIN' | 'MEMBER') => {
    const response = await apiClient.patch(`/organizations/${orgId}/members/${memberId}/role`, { role });
    return response.data;
  },

  removeMember: async (orgId: string, memberId: string) => {
    const response = await apiClient.delete(`/organizations/${orgId}/members/${memberId}`);
    return response.data;
  },

  acceptInvite: async (token: string) => {
    const response = await apiClient.post(`/organizations/invites/${token}/accept`);
    return response.data;
  },

  getInvitationDetails: async (token: string) => {
    const response = await apiClient.get(`/auth/invites/${token}`);
    return response.data?.data;
  },
};
