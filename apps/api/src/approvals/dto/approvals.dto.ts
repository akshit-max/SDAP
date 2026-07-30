import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResolveApprovalRequestDto {
  @ApiProperty({ example: 'APPROVED', description: 'The resolution status', enum: ['APPROVED', 'REJECTED'] })
  status!: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Looks good to me', description: 'Reason for approval or rejection' })
  reason?: string;
}
