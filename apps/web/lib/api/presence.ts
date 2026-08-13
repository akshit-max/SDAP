import { apiClient } from './client';

export interface PresenceRecord {
  userId: string;
  user?: {
    fullName: string | null;
    email: string;
  };
  platform: string;
  lastSeenAt: string; // ISO timestamp
  /**
   * true = the WithUs extension reported activity within the last 90 seconds.
   *
   * NOTE: This is NOT a cryptographic guarantee that the user is actively
   * interacting with the third-party website. It means the authenticated
   * WithUs extension has recently reported platform activity for this user.
   */
  isActive: boolean;
}

export const presenceApi = {
  /**
   * Fetch presence status for all org members.
   * Admin/Owner only — server returns 403 for regular members.
   */
  getPresence: async (orgId: string): Promise<PresenceRecord[]> => {
    const response = await apiClient.get(`/organizations/${orgId}/presence`);
    return response.data;
  },
};
