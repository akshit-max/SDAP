import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../lib/api/audit';
import { GetAuditEventsQueryDto } from '@repo/types';

export function useAuditEvents(orgId: string | null, query: GetAuditEventsQueryDto) {
  return useQuery({
    queryKey: ['audit', orgId, query],
    queryFn: () => (orgId ? auditApi.getAuditEvents(orgId, query) : Promise.resolve({ data: [], total: 0, page: 1, limit: 50, totalPages: 1 })),
    enabled: !!orgId,
  });
}
