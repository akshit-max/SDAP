import { useQuery } from '@tanstack/react-query';
import { presenceApi, PresenceRecord } from '../lib/api/presence';

/**
 * Polls the presence endpoint every 30 seconds for admin/owner users.
 * Returns a Map<userId, PresenceRecord> for O(1) lookup in the sessions table.
 *
 * Automatically disabled when:
 *   - orgId is not set (no organization context)
 *   - isAdmin is false (regular members cannot view presence)
 *
 * Errors from the server (403, network) are silently caught by React Query
 * and do not affect any other part of the UI.
 */
export function usePresence(orgId: string | null, isAdmin: boolean) {
  const query = useQuery({
    queryKey: ['presence', orgId],
    queryFn: () => presenceApi.getPresence(orgId!),
    // Poll every 30 seconds — matches the heartbeat alarm frequency
    refetchInterval: 30_000,
    enabled: !!orgId && isAdmin,
    // On error (e.g. network blip), keep last successful data visible
    // rather than reverting all badges to 🔴 Inactive
    staleTime: 90_000,
  });

  // Build a userId → PresenceRecord map for efficient lookup
  const presenceMap = new Map<string, PresenceRecord>();
  if (query.data) {
    for (const record of query.data) {
      presenceMap.set(record.userId, record);
    }
  }

  return { presenceMap, isLoading: query.isLoading };
}
