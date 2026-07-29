import { z } from 'zod';

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

export enum SessionScope {
  VAULT = 'VAULT',
  SECRET = 'SECRET',
}

export enum SessionPermission {
  REVEAL = 'REVEAL',
}

export const CreateSessionSchema = z.object({
  granteeId: z.string().uuid(),
  scope: z.nativeEnum(SessionScope),
  resourceId: z.string().uuid(),
  permission: z.nativeEnum(SessionPermission).default(SessionPermission.REVEAL),
  expiresAt: z.coerce.date(),
  maxReveals: z.number().int().min(1).optional(),
});

export type CreateSessionDto = z.infer<typeof CreateSessionSchema>;

export interface DelegatedSessionDto {
  id: string;
  organizationId: string;
  grantorId: string;
  granteeId: string;
  scope: SessionScope;
  resourceId: string;
  permission: SessionPermission;
  status: SessionStatus;
  expiresAt: Date | string;
  maxReveals: number | null;
  revealCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  revokedAt: Date | string | null;
  revokedBy: string | null;
}
