import { apiClient } from './client';

const BASE = '/superadmin';

export const superAdminApi = {
  // ─── Overview ──────────────────────────────────────────────────────────────
  getOverview: (params?: { from?: string; to?: string }) =>
    apiClient.get(`${BASE}/overview`, { params }),

  // ─── Growth / Charts ───────────────────────────────────────────────────────
  getGrowthData: (days: number = 30) =>
    apiClient.get(`${BASE}/growth`, { params: { days } }),

  // ─── Platform Analytics ────────────────────────────────────────────────────
  getPlatformStats: () => apiClient.get(`${BASE}/platforms`),

  // ─── System Health ──────────────────────────────────────────────────────────
  getSystemHealth: () => apiClient.get(`${BASE}/health`),

  // ─── Admin Management ──────────────────────────────────────────────────────
  getSuperAdmins: () => apiClient.get(`${BASE}/admins`),

  // ─── Product Analytics ─────────────────────────────────────────────────────
  getProductAnalytics: (days: number = 30) =>
    apiClient.get(`${BASE}/analytics`, { params: { days } }),

  // ─── Notifications ─────────────────────────────────────────────────────────
  getNotifications: () => apiClient.get(`${BASE}/notifications`),

  // ─── Users ─────────────────────────────────────────────────────────────────
  getUsers: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get(`${BASE}/users`, { params }),

  getUserDetail: (id: string) => apiClient.get(`${BASE}/users/${id}`),

  // ─── Organizations ─────────────────────────────────────────────────────────
  getOrganizations: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get(`${BASE}/organizations`, { params }),

  getOrganizationDetail: (id: string) =>
    apiClient.get(`${BASE}/organizations/${id}`),

  // ─── Sessions ──────────────────────────────────────────────────────────────
  getSessions: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get(`${BASE}/sessions`, { params }),

  // ─── Security / Audit ──────────────────────────────────────────────────────
  getGlobalAudit: (params?: {
    page?: number;
    limit?: number;
    organizationId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }) => apiClient.get(`${BASE}/audit`, { params }),

  getPlatformAudit: (params?: { page?: number; limit?: number }) =>
    apiClient.get(`${BASE}/platform-audit`, { params }),

  // ─── WITHUS Platform Ecosystem ─────────────────────────────────────────────
  // Returns all 11 WITHUS Vault platforms with real DB data where available.
  getPlatformEcosystem: () => apiClient.get(`${BASE}/platform-ecosystem`),

  // ─── Vault Analytics ───────────────────────────────────────────────────────
  // Returns real vault/secret/session analytics from existing DB models.
  getVaultAnalytics: () => apiClient.get(`${BASE}/vault-analytics`),
};
