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
  CreateSessionDto,
  ApprovalType,
} from '@repo/types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import { z } from 'zod';
import { ApprovalPolicyService } from '../../approvals/approval-policy.service';
import { ApprovalsService } from '../../approvals/approvals.service';
import { Throttle } from '@nestjs/throttler';
import { OrganizationContext } from '../../authorization/decorators/organization-context.decorator';

const RevealSessionSchema = z.object({
  reason: z.string().min(1, 'Reason is required for auditing purposes'),
});

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
  // No specific org permission needed to view what is granted TO you, but you need to be in the org
  // We'll require basic read access.
  @RequirePermissions(Permission.SECRET_READ)
  async getIncomingSessions(
    @Param('orgId') orgId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionsService.getIncomingSessions(orgId, req.user.id);
  }

  @Get('outgoing')
  @RequirePermissions(Permission.SECRET_READ)
  async getOutgoingSessions(
    @Param('orgId') orgId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionsService.getOutgoingSessions(orgId, req.user.id);
  }

  @Post(':id/revoke')
  // Revocation requires the same permission as creation
  @RequirePermissions(Permission.SECRET_READ)
  async revokeSession(
    @Param('orgId') orgId: string,
    @Param('id') sessionId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionsService.revokeSession(orgId, sessionId, req.user.id);
  }

  @Post(':id/reveal')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Sensitive endpoint, tighter limits
  // Reveal using session: The grantee might NOT have SECRET_READ.
  // We should NOT use @RequirePermissions(Permission.SECRET_READ) here!
  // Instead, the session itself acts as the capability. The JwtAuthGuard ensures they are authenticated.
  // We'll drop PermissionsGuard for this specific route, or we create an empty array of required permissions.
  // Because PermissionsGuard requires all permissions passed to @RequirePermissions, if we don't pass it, it defaults to checking if they are just in the org.
  async revealSecretViaSession(
    @Param('orgId') orgId: string,
    @Param('id') sessionId: string,
    @Request() req: RequestWithUser,
    @Body(new ZodValidationPipe(RevealSessionSchema)) dto: { reason: string },
  ) {
    return this.sessionsService.revealSecretViaSession(
      orgId,
      sessionId,
      req.user.id,
      dto.reason,
    );
  }
}
