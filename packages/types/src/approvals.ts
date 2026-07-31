import { z } from 'zod';
import { CreateSessionSchema, CreateSessionDto } from './sessions';

import { ApprovalRequestStatus, ApprovalType } from "@repo/db";
export { ApprovalRequestStatus, ApprovalType };

export const CreateApprovalRequestSchema = z.object({
  type: z.nativeEnum(ApprovalType),
  requestPayload: CreateSessionSchema,
});

export type CreateApprovalRequestDto = z.infer<typeof CreateApprovalRequestSchema>;

export const ResolveApprovalRequestSchema = z.object({
  status: z.enum([ApprovalRequestStatus.APPROVED, ApprovalRequestStatus.REJECTED]),
  reason: z.string().optional(),
});

export type ResolveApprovalRequestDto = z.infer<typeof ResolveApprovalRequestSchema>;

export interface ApprovalRequestDto {
  id: string;
  organizationId: string;
  requesterId: string;
  requester?: {
    email: string;
    fullName: string | null;
  };
  type: ApprovalType;
  requestPayload: CreateSessionDto;
  status: ApprovalRequestStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  resolvedAt: Date | string | null;
  resolvedBy: string | null;
  reason: string | null;
}
