import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { PresenceService } from './presence.service';

class HeartbeatDto {
  platform!: string;
}

/**
 * Presence Controller
 *
 * Routes:
 *   POST /organizations/:orgId/presence/heartbeat  — Extension sends heartbeat
 *   GET  /organizations/:orgId/presence            — Admin dashboard polls presence
 *
 * Security:
 *   - Both routes require JWT authentication.
 *   - GET restricted to ADMIN/OWNER roles (checked via DB query).
 *   - POST always returns 204 — extension never learns if auth gate rejected it.
 */
@Controller('organizations/:orgId/presence')
@UseGuards(JwtAuthGuard)
export class PresenceController {
  constructor(
    private readonly presenceService: PresenceService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * POST /organizations/:orgId/presence/heartbeat
   *
   * Fire-and-forget from the extension service worker (every 30s).
   * Always 204 — presence failures must never surface to the extension.
   */
  @Post('heartbeat')
  @HttpCode(HttpStatus.NO_CONTENT)
  async heartbeat(
    @Param('orgId') orgId: string,
    @Body() dto: HeartbeatDto,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    this.presenceService
      .recordHeartbeat(orgId, req.user.id, dto.platform)
      .catch(() => {/* non-blocking */});
  }

  /**
   * GET /organizations/:orgId/presence
   *
   * Returns presence status for all org members (ADMIN/OWNER only).
   * isActive = lastSeenAt within the last 90 seconds.
   */
  @Get()
  async getPresence(
    @Param('orgId') orgId: string,
    @Request() req: RequestWithUser,
  ) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId: orgId, userId: req.user.id },
      },
      select: { role: true },
    });

    if (!membership || !['ADMIN', 'OWNER'].includes(membership.role)) {
      throw new ForbiddenException('Only administrators can view member presence.');
    }

    return this.presenceService.getOrgPresence(orgId);
  }
}
