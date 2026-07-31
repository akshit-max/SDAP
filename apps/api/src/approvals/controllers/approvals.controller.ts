import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApprovalsService } from '../approvals.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../authorization/guards/permissions.guard';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import {
  Permission,
  ResolveApprovalRequestSchema,
  ApprovalRequestStatus,
} from '@repo/types';
import { ResolveApprovalRequestDto } from '../dto/approvals.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import { OrganizationContext } from '../../authorization/decorators/organization-context.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Approvals')
@ApiBearerAuth()
@Controller('organizations/:orgId/approvals')
@OrganizationContext('orgId')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('pending')
  @ApiOperation({ summary: 'Get all pending approvals for the organization' })
  @RequirePermissions(Permission.APPROVAL_READ)
  async getPendingApprovals(@Param('orgId') orgId: string) {
    return this.approvalsService.getPendingApprovals(orgId);
  }

  @Get('requests')
  @ApiOperation({ summary: 'Get approval requests created by the current user' })
  @RequirePermissions(Permission.APPROVAL_READ)
  async getMyRequests(
    @Param('orgId') orgId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.approvalsService.getMyRequests(orgId, req.user.id);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Approve or reject a pending request' })
  @RequirePermissions(Permission.APPROVAL_APPROVE)
  async resolveApproval(
    @Param('orgId') orgId: string,
    @Param('id') approvalId: string,
    @Request() req: RequestWithUser,
    @Body(new ZodValidationPipe(ResolveApprovalRequestSchema))
    dto: ResolveApprovalRequestDto,
  ) {
    return this.approvalsService.resolveApprovalRequest(
      orgId,
      approvalId,
      req.user.id,
      dto.status as 'APPROVED' | 'REJECTED',
      dto.reason,
    );
  }
}
