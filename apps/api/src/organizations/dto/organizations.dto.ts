import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Corp', description: 'The name of the organization' })
  name!: string;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'Acme Corp 2', description: 'The new name of the organization' })
  name?: string;

  @ApiPropertyOptional({ example: { featureFlags: { beta: true } }, description: 'Organization settings' })
  settings?: any;
}

export class CreateInvitationDto {
  @ApiProperty({ example: 'colleague@acme.com', description: 'Email address of the invitee' })
  email!: string;

  @ApiProperty({ example: 'MEMBER', description: 'Role to assign to the invitee', enum: ['OWNER', 'ADMIN', 'MEMBER'] })
  role!: 'OWNER' | 'ADMIN' | 'MEMBER';
}
