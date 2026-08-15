import { z } from 'zod';
import { IntegrationProvider } from '@prisma/client';

export const ConnectIntegrationSchema = z.object({
  provider: z.nativeEnum(IntegrationProvider),
  token: z.string().min(1, 'Token is required'),
});
export class ConnectIntegrationDto {
  provider!: IntegrationProvider;
  token!: string;
}

export const OAuthCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
});

export type OAuthCallbackDto = z.infer<typeof OAuthCallbackSchema>;

export const AnalyzePortalSchema = z.object({
  url: z.string().url('Must be a valid URL'),
});

export type AnalyzePortalDto = z.infer<typeof AnalyzePortalSchema>;

export interface AnalyzePortalResponseDto {
  compatible: boolean;
  platform: string | null;
  reason?: 'unrecognized_platform' | 'invalid_url' | 'not_https';
}

export const GrantIntegrationAccessSchema = z.object({
  resourceId: z.string().min(1),
  principalEmail: z.string().email(),
  role: z.string().optional(),
});
export class GrantIntegrationAccessDto {
  resourceId!: string;
  principalEmail!: string;
  role?: string;
}

export const RevokeIntegrationAccessSchema = z.object({
  resourceId: z.string().min(1),
  principalEmail: z.string().email(),
  referenceId: z.string().optional(),
  resourceType: z.string().optional(),
});
export class RevokeIntegrationAccessDto {
  resourceId!: string;
  principalEmail!: string;
  referenceId?: string;
  resourceType?: any;
}
