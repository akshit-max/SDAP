import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_PRIVATE_KEY: z.string().min(1).optional(), // Optional locally, but should exist in prod. We will enforce via runtime checks.
  JWT_PUBLIC_KEY: z.string().min(1).optional(),
  VAULT_ENCRYPTION_KEY: z.string().min(32, 'Vault encryption key must be at least 32 characters'),
  PORT: z.coerce.number().default(4000),
  REDIS_URL: z.string().url().optional(), 
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // SMTP Config
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

export function validate(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    throw new Error(`Environment validation error: ${result.error.message}`);
  }

  const data = result.data;

  // Production overrides: ensure critical variables are strictly present
  if (data.NODE_ENV === 'production') {
    if (!data.REDIS_URL) throw new Error('REDIS_URL is required in production');
    if (!data.SMTP_HOST) throw new Error('SMTP_HOST is required in production');
    if (!data.SMTP_PORT) throw new Error('SMTP_PORT is required in production');
    if (!data.SMTP_USER) throw new Error('SMTP_USER is required in production');
    if (!data.SMTP_PASS) throw new Error('SMTP_PASS is required in production');
    // For JWT, we need either keys mounted from file or from env
    // TokenService falls back to keys/private.pem, which is fine, but we can't easily validate the file's presence here.
  }

  return data;
}
