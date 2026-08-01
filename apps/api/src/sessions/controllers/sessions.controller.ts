import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SessionsService } from '../sessions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../authorization/guards/permissions.guard';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import {
  Permission,
  CreateSessionSchema,
  ApprovalType,
} from '@repo/types';
import { CreateSessionDto, RevealSessionDto } from '../dto/sessions.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import { z } from 'zod';
import { ApprovalPolicyService } from '../../approvals/approval-policy.service';
import { ApprovalsService } from '../../approvals/approvals.service';
import { Throttle } from '@nestjs/throttler';
import { OrganizationContext } from '../../authorization/decorators/organization-context.decorator';

const RevealSessionSchema = z.object({
  reason: z.string().min(1, 'Reason is required for auditing purposes'),
});

@ApiTags('Sessions')
@ApiBearerAuth()
@Controller('organizations/:orgId/sessions')
@OrganizationContext('orgId')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly approvalPolicyService: ApprovalPolicyService,
    private readonly approvalsService: ApprovalsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a delegated session' })
  @RequirePermissions(Permission.SECRET_READ)
  async createSession(
    @Param('orgId') orgId: string,
    @Request() req: RequestWithUser,
    @Body(new ZodValidationPipe(CreateSessionSchema)) dto: CreateSessionDto,
  ) {
    const requiresApproval = await this.approvalPolicyService.requiresApproval(
      orgId,
      req.user.id,
      ApprovalType.DELEGATED_SESSION,
      dto,
    );

    if (requiresApproval) {
      const request = await this.approvalsService.createApprovalRequest(
        orgId,
        req.user.id,
        ApprovalType.DELEGATED_SESSION,
        dto,
      );
      return {
        status: 'PENDING_APPROVAL',
        approvalRequest: request,
      };
    }

    const session = await this.sessionsService.createSession(
      orgId,
      req.user.id,
      dto,
    );
    return {
      status: 'ACTIVE',
      session,
    };
  }

  @Get('incoming')
  @ApiOperation({ summary: 'Get sessions granted to me' })
  @RequirePermissions(Permission.SECRET_READ)
  async getIncomingSessions(
    @Param('orgId') orgId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionsService.getIncomingSessions(orgId, req.user.id);
  }

  @Get('outgoing')
  @ApiOperation({ summary: 'Get sessions I have granted to others' })
  @RequirePermissions(Permission.SECRET_READ)
  async getOutgoingSessions(
    @Param('orgId') orgId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionsService.getOutgoingSessions(orgId, req.user.id);
  }

  @Post(':sessionId/revoke')
  @ApiOperation({ summary: 'Revoke a delegated session' })
  @RequirePermissions(Permission.SECRET_READ)
  async revokeSession(
    @Param('orgId') orgId: string,
    @Param('sessionId') sessionId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionsService.revokeSession(orgId, sessionId, req.user.id);
  }

  @Post(':sessionId/reveal')
  @ApiOperation({ summary: 'Reveal a secret using a delegated session' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async revealSession(
    @Param('orgId') orgId: string,
    @Param('sessionId') sessionId: string,
    @Request() req: RequestWithUser,
    @Body(new ZodValidationPipe(RevealSessionSchema)) dto: RevealSessionDto,
  ) {
    const plaintext = await this.sessionsService.revealSecretViaSession(
      orgId,
      sessionId,
      req.user.id,
      dto.reason,
    );
    return { plaintext };
  }
}
