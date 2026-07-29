import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api/client';
import { secretKeys } from './useSecrets';
import { RevealResponse } from '@repo/types';

interface RevealPayload {
  orgId: string;
  vaultId: string;
  secretId: string;
  reason: string;
}

export function useRevealSecret() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgId, vaultId, secretId, reason }: RevealPayload): Promise<RevealResponse> => {
      const response = await apiClient.post(
        `/organizations/${orgId}/vaults/${vaultId}/secrets/${secretId}/reveal`,
        { reason }
      );
      return response.data;
    },
    onSuccess: (_, { orgId, vaultId, secretId }) => {
      // Invalidate the detail query to update revealCount and lastRevealedAt
      queryClient.invalidateQueries({ queryKey: secretKeys.detail(orgId, vaultId, secretId) });
    },
  });
}
