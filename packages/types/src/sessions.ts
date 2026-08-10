import { z } from 'zod';
import { SessionStatus, SessionScope, SessionPermission } from "@repo/db";
export { SessionStatus, SessionScope, SessionPermission };

export const CreateSessionSchema = z.object({
  granteeId: z.string().uuid(),
  scope: z.union([z.nativeEnum(SessionScope), z.literal('INTEGRATION')]).optional(),
  resourceId: z.string().optional(),
  integrationProvider: z.string().optional(),
  integrationResourceType: z.string().optional(),
  integrationResourceExternalId: z.string().optional(),
  integrationRole: z.string().optional(),
  permission: z.nativeEnum(SessionPermission).default(SessionPermission.REVEAL),
  expiresAt: z.coerce.date(),
  maxReveals: z.number().int().min(1).optional(),
  capabilities: z.array(z.string()).optional().nullable(),
});

export type CreateSessionDto = z.infer<typeof CreateSessionSchema>;

export interface DelegatedSessionDto {
  id: string;
  organizationId: string;
  grantorId: string;
  granteeId: string;
  scope: SessionScope | string;
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
  grantee?: { email: string; fullName: string } | null;
  grantor?: { email: string; fullName: string } | null;
  resourceName?: string | null;
}
