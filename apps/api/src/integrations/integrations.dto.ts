import { z } from 'zod';
import { IntegrationProvider } from '@prisma/client';

export const ConnectIntegrationSchema = z.object({
  provider: z.nativeEnum(IntegrationProvider),
  token: z.string().min(1, 'Token is required'),
});
export type ConnectIntegrationDto = z.infer<typeof ConnectIntegrationSchema>;

export const GrantIntegrationAccessSchema = z.object({
  resourceId: z.string().min(1),
  principalEmail: z.string().email(),
  role: z.string().optional(),
});
export type GrantIntegrationAccessDto = z.infer<typeof GrantIntegrationAccessSchema>;

export const RevokeIntegrationAccessSchema = z.object({
  resourceId: z.string().min(1),
  principalEmail: z.string().email(),
  referenceId: z.string().optional(),
});
export type RevokeIntegrationAccessDto = z.infer<typeof RevokeIntegrationAccessSchema>;
