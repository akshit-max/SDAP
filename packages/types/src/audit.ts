import { z } from 'zod';

export interface AuditEventDto {
  id: string;
  organizationId: string;
  actorId: string | null;
  
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  
  eventVersion: number;
  metadata: any | null;
  
  createdAt: Date | string;
  
  actor?: {
    email: string;
  } | null;
}

export const GetAuditEventsQuerySchema = z.object({
  action: z.string().optional(),
  actorId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type GetAuditEventsQueryDto = z.infer<typeof GetAuditEventsQuerySchema>;

export interface PaginatedAuditEventsDto {
  data: AuditEventDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
