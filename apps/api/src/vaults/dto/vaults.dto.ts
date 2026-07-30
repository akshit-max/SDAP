import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SecretType } from '@prisma/client';

export class CreateVaultDto {
  @ApiProperty({ example: 'Production Secrets', description: 'The name of the vault' })
  name!: string;

  @ApiPropertyOptional({ example: 'Tokens and keys for production environment', description: 'Optional description' })
  description?: string;
}

export class UpdateVaultDto {
  @ApiPropertyOptional({ example: 'Production Secrets (Updated)' })
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  description?: string;
}

export class CreateSecretDto {
  @ApiProperty({ example: 'STRIPE_API_KEY', description: 'The name of the secret' })
  name!: string;

  @ApiPropertyOptional({ example: 'Stripe production key' })
  description?: string;

  @ApiProperty({ example: 'ENVIRONMENT_VARIABLE', description: 'The type of the secret' })
  type!: SecretType;

  @ApiProperty({ example: 'sk_live_123456789', description: 'The sensitive plaintext value' })
  plaintext!: string;
}

export class UpdateSecretDto {
  @ApiProperty({ example: 'sk_live_987654321', description: 'The new sensitive plaintext value' })
  plaintext!: string;
}

export class UpdateSecretMetadataDto {
  @ApiPropertyOptional({ example: 'STRIPE_API_KEY_V2' })
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  description?: string;
}
