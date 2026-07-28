import { z } from "zod";
import { SecretType, SecretStatus } from "@prisma/client";

// --- Vaults ---

export const CreateVaultSchema = z.object({
  name: z.string().min(1, "Vault name is required").max(100),
  description: z.string().max(500).optional(),
});

export type CreateVaultDto = z.infer<typeof CreateVaultSchema>;

export const UpdateVaultSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export type UpdateVaultDto = z.infer<typeof UpdateVaultSchema>;

// --- Secrets ---

export const CreateSecretSchema = z.object({
  name: z.string().min(1, "Secret name is required").max(200),
  description: z.string().max(500).optional(),
  type: z.nativeEnum(SecretType).optional().default(SecretType.OTHER),
  plaintext: z.string().min(1, "Secret value cannot be empty").max(1024 * 64), // 64KB max payload
});

export type CreateSecretDto = z.infer<typeof CreateSecretSchema>;

export const UpdateSecretSchema = z.object({
  plaintext: z.string().min(1, "Secret value cannot be empty").max(1024 * 64), // A new version means a new plaintext
});

export type UpdateSecretDto = z.infer<typeof UpdateSecretSchema>;

export const UpdateSecretMetadataSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  status: z.nativeEnum(SecretStatus).optional(),
});

export type UpdateSecretMetadataDto = z.infer<typeof UpdateSecretMetadataSchema>;
