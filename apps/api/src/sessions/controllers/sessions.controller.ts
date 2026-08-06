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
import { GmailAdapter } from '../../integrations/gmail/gmail.adapter';
import { GmailOtpService } from '../../integrations/gmail/gmail-otp.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

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
    private readonly gmailAdapter: GmailAdapter,
    private readonly gmailOtpService: GmailOtpService,
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
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

  /**
   * POST /organizations/:orgId/sessions/:sessionId/otp
   *
   * Fetches the latest OTP from the grantor's Gmail inbox.
   *
   * Security model:
   *  - Session must be ACTIVE and not expired.
   *  - Requesting user must be the designated grantee.
   *  - OTP is extracted on the backend — extension never receives email body.
   *  - Audit event is emitted on every successful OTP fetch.
   *
   * OTP Boundary Rule:
   *  - Returns only { otp: string }.
   *  - Never returns email body, subject, sender, or Gmail metadata.
   */
  @Post(':sessionId/otp')
  @ApiOperation({ summary: 'Fetch OTP from grantor Gmail for an active delegated session' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async fetchOtp(
    @Param('orgId') orgId: string,
    @Param('sessionId') sessionId: string,
    @Request() req: RequestWithUser,
    @Body() body: { platform?: string; loginStartTime?: number },
  ) {
    // ── Validate session ─────────────────────────────────────────────────────
    const session = await this.prisma.delegatedSession.findUnique({
      where: { id: sessionId },
      include: { grantor: { select: { id: true } } },
    });

    if (!session || session.organizationId !== orgId) {
      return { error: 'Session not found.' };
    }
    if (session.granteeId !== req.user.id) {
      return { error: 'You are not the grantee of this session.' };
    }
    if (session.status !== 'ACTIVE') {
      return { error: `Session is ${session.status.toLowerCase()}.` };
    }
    if (new Date(session.expiresAt) < new Date()) {
      return { error: 'Session has expired.' };
    }

    // ── Resolve platform — prefer body (sent by extension from current URL) over DB value ──
    // The extension knows what page it's on (VERCEL, RAZORPAY, etc.) even when the
    // session's integrationProvider column is null (legacy sessions created before this field).
    const platform = body?.platform ?? session.integrationProvider ?? null;
    const loginStartTime = body?.loginStartTime ?? Date.now() - 30_000;

    // ── Get a valid access token for the GRANTOR's Gmail ────────────────────
    const accessToken = await this.gmailAdapter.getValidAccessToken(session.organizationId);

    // ── Extract OTP — extension never sees email content ────────────────────
    const otp = await this.gmailOtpService.fetchLatestOtp(
      accessToken,
      platform,
      loginStartTime,
    );

    // ── Audit log ────────────────────────────────────────────────────────────
    this.eventEmitter.emit('audit.log', {
      organizationId: orgId,
      actorId: req.user.id,
      action: 'otp.fetched',
      resourceType: 'SESSION',
      resourceId: sessionId,
      metadata: {
        platform: platform ?? 'UNKNOWN',
        grantorId: session.grantorId,
      },
    });

    // OTP Boundary Rule: return only the code string, nothing else.
    return { otp };
  }
}
