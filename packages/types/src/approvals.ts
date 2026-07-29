import { z } from 'zod';
import { CreateSessionSchema } from './sessions';

export enum ApprovalRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ApprovalType {
  DELEGATED_SESSION = 'DELEGATED_SESSION',
}

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
  type: ApprovalType;
  requestPayload: any;
  status: ApprovalRequestStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  resolvedAt: Date | string | null;
  resolvedBy: string | null;
  reason: string | null;
}
