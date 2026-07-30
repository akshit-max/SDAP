import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_PRIVATE_KEY: z.string().min(1).optional(), // Optional: TokenService falls back to keys/private.pem
  JWT_PUBLIC_KEY: z.string().min(1).optional(),
  VAULT_ENCRYPTION_KEY: z.string().min(32),
  PORT: z.coerce.number().default(4000),
  REDIS_URL: z.string().url().optional(), // Optional: defaults to redis://localhost:6379 if not set
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export function validate(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    throw new Error(`Environment validation error: ${result.error.message}`);
  }
  return result.data;
}
