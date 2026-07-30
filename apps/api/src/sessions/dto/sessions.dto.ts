import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionScope, SessionPermission } from '@repo/types';

export class CreateSessionDto {
  @ApiProperty({ example: 'user-id', description: 'User ID of the grantee' })
  granteeId!: string;

  @ApiProperty({ example: 'SECRET', description: 'Scope of the session' })
  scope!: SessionScope;

  @ApiProperty({ example: 'resource-id', description: 'ID of the vault or secret' })
  resourceId!: string;

  @ApiProperty({ example: 'REVEAL', description: 'Permission level granted' })
  permission!: SessionPermission;

  @ApiProperty({ example: '2027-01-01T00:00:00Z', description: 'Expiration date of the session' })
  expiresAt!: Date;

  @ApiPropertyOptional({ example: 5, description: 'Maximum number of reveals allowed' })
  maxReveals?: number;

  @ApiProperty({ example: 'Need access for deployment', description: 'Justification for creating the session' })
  justification!: string;
}

export class RevealSessionDto {
  @ApiProperty({ example: 'Deploying service A', description: 'Reason for revealing the secret' })
  reason!: string;
}
