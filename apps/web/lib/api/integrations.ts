import { apiClient } from './client';

export type IntegrationProvider = 'VERCEL' | 'GITHUB' | 'GODADDY' | 'GMAIL';
export type IntegrationStatus = 'ACTIVE' | 'DISCONNECTED' | 'ERROR';

export interface IntegrationConnection {
  id: string | null;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  providerMeta: Record<string, unknown> | null;
  lastCheckedAt: string | null;
  lastError: string | null;
  createdAt: string | null;
}

export interface IntegrationResource {
  id: string;
  name: string;
  url?: string;
  type: 'TEAM' | 'ORGANIZATION' | 'REPOSITORY' | 'PROJECT' | 'ACCOUNT';
}

export interface HealthCheckResult {
  healthy: boolean;
  identity?: string;
  error?: string;
  checkedAt: string;
}

export interface AnalyzePortalResponse {
  compatible: boolean;
  platform: string | null;
  reason?: 'unrecognized_platform' | 'invalid_url' | 'not_https';
}

export const integrationsApi = {
  analyzePortal: async (orgId: string, url: string): Promise<AnalyzePortalResponse> => {
    const res = await apiClient.post(`/organizations/${orgId}/integrations/analyze-portal`, { url });
    return res.data;
  },

  listConnections: async (orgId: string): Promise<IntegrationConnection[]> => {
    const res = await apiClient.get(`/organizations/${orgId}/integrations`);
    return res.data;
  },

  connect: async (orgId: string, provider: IntegrationProvider, token: string) => {
    const res = await apiClient.post(`/organizations/${orgId}/integrations/connect`, {
      provider,
      token,
    });
    return res.data;
  },

  getOAuthUrl: async (orgId: string, provider: IntegrationProvider): Promise<{ url: string }> => {
    const res = await apiClient.get(`/organizations/${orgId}/integrations/${provider}/oauth/url`);
    return res.data;
  },

  handleOAuthCallback: async (orgId: string, provider: IntegrationProvider, code: string) => {
    const res = await apiClient.post(`/organizations/${orgId}/integrations/${provider}/oauth/callback`, { code });
    return res.data;
  },

  disconnect: async (orgId: string, provider: IntegrationProvider) => {
    const res = await apiClient.delete(`/organizations/${orgId}/integrations/${provider}`);
    return res.data;
  },

  healthCheck: async (orgId: string, provider: IntegrationProvider): Promise<HealthCheckResult> => {
    const res = await apiClient.get(`/organizations/${orgId}/integrations/${provider}/health`);
    return res.data;
  },

  listResources: async (orgId: string, provider: IntegrationProvider): Promise<IntegrationResource[]> => {
    const res = await apiClient.get(`/organizations/${orgId}/integrations/${provider}/resources`);
    return res.data;
  },

  grantAccess: async (
    orgId: string,
    provider: IntegrationProvider,
    data: { resourceId: string; principalEmail: string; role?: string },
  ) => {
    const res = await apiClient.post(`/organizations/${orgId}/integrations/${provider}/grant`, data);
    return res.data;
  },

  revokeAccess: async (
    orgId: string,
    provider: IntegrationProvider,
    data: { resourceId: string; principalEmail: string; referenceId?: string },
  ) => {
    const res = await apiClient.post(`/organizations/${orgId}/integrations/${provider}/revoke`, data);
    return res.data;
  },
};
