import { apiClient } from './client';
import { GetAuditEventsQueryDto, PaginatedAuditEventsDto } from '@repo/types';

export const auditApi = {
  getAuditEvents: async (orgId: string, query: GetAuditEventsQueryDto): Promise<PaginatedAuditEventsDto> => {
    const params = new URLSearchParams();
    if (query.action) params.append('action', query.action);
    if (query.actorId) params.append('actorId', query.actorId);
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);
    if (query.page) params.append('page', query.page);
    if (query.limit) params.append('limit', query.limit);

    const response = await apiClient.get(`/organizations/${orgId}/audit`, { params });
    return response.data;
  },

  /**
   * Download audit log as CSV.
   * Backend enforces BUSINESS-only access — FREE and PRO receive 403.
   */
  exportAuditCsv: async (
    orgId: string,
    query: Pick<GetAuditEventsQueryDto, 'action' | 'actorId' | 'startDate' | 'endDate'>,
  ): Promise<Blob> => {
    const params = new URLSearchParams();
    if (query.action) params.append('action', query.action);
    if (query.actorId) params.append('actorId', query.actorId);
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);

    const response = await apiClient.get(`/organizations/${orgId}/audit/export`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
