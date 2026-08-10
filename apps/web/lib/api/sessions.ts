import { apiClient } from './client';
import { DelegatedSessionDto, CreateSessionDto } from '@repo/types';

export const sessionsApi = {
  getIncomingSessions: async (orgId: string): Promise<DelegatedSessionDto[]> => {
    const response = await apiClient.get(`/organizations/${orgId}/sessions/incoming`);
    return response.data;
  },

  // For grantees who may not have an org — uses global endpoint
  getMyIncomingSessions: async (): Promise<DelegatedSessionDto[]> => {
    const response = await apiClient.get('/sessions/incoming');
    return response.data;
  },

  getOutgoingSessions: async (orgId: string): Promise<DelegatedSessionDto[]> => {
    const response = await apiClient.get(`/organizations/${orgId}/sessions/outgoing`);
    return response.data;
  },

  createSession: async (orgId: string, data: CreateSessionDto): Promise<DelegatedSessionDto> => {
    const response = await apiClient.post(`/organizations/${orgId}/sessions`, data);
    return response.data;
  },

  revokeSession: async (orgId: string, sessionId: string): Promise<DelegatedSessionDto> => {
    const response = await apiClient.post(`/organizations/${orgId}/sessions/${sessionId}/revoke`);
    return response.data;
  },

  revealSecretViaSession: async (orgId: string, sessionId: string, reason: string): Promise<string> => {
    const response = await apiClient.post(`/organizations/${orgId}/sessions/${sessionId}/reveal`, { reason });
    return response.data.plaintext;
  },

  /** Admin: get all sessions granted to a specific org member */
  getSessionsByMember: async (orgId: string, memberId: string): Promise<DelegatedSessionDto[]> => {
    const response = await apiClient.get(`/organizations/${orgId}/members/${memberId}/sessions`);
    return response.data;
  },

  /** Admin: revoke all active sessions for a specific org member */
  revokeAllForMember: async (orgId: string, memberId: string): Promise<{ revokedCount: number; skippedCount: number }> => {
    const response = await apiClient.post(`/organizations/${orgId}/members/${memberId}/revoke-all`);
    return response.data;
  },
};
