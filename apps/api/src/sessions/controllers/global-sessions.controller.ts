import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { SessionsService } from '../sessions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

/**
 * Global sessions controller - not scoped to an org.
 * Used for grantees who may not belong to the grantor's organization.
 */
@ApiTags('Sessions')
@ApiBearerAuth()
@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class GlobalSessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  /**
   * GET /sessions/incoming
   * Returns all delegated sessions where the current user is the grantee.
   * No org membership required — any authenticated user can see what's been granted to them.
   */
  @Get('incoming')
  @ApiOperation({ summary: 'Get all sessions granted to me (cross-organization)' })
  async getIncomingSessions(@Request() req: RequestWithUser) {
    return this.sessionsService.getIncomingSessions('', req.user.id);
  }
}

