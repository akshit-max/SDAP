import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginDto = z.infer<typeof LoginSchema>;

export const RefreshSchema = z.object({
  refreshToken: z.string(),
});

export type RefreshDto = z.infer<typeof RefreshSchema>;

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type AuthTokensDto = z.infer<typeof AuthTokensSchema>;
