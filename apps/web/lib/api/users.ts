import { apiClient } from './client';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  providerProfiles?: Record<string, string>;
  createdAt: string;
}

export const usersApi = {
  getProfile: async (): Promise<UserProfile> => {
    const res = await apiClient.get('/users/me');
    return res.data;
  },

  updateProfile: async (data: { fullName?: string; githubUsername?: string }): Promise<UserProfile> => {
    const res = await apiClient.patch('/users/me', data);
    return res.data;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean }> => {
    const res = await apiClient.post('/users/me/change-password', data);
    return res.data;
  },
};
