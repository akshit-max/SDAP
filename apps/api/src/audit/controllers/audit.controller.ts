import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditService } from '../audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../authorization/guards/permissions.guard';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import { Permission } from '@repo/types';
import { OrganizationContext } from '../../authorization/decorators/organization-context.decorator';

@Controller('organizations/:orgId/audit')
@OrganizationContext('orgId')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions(Permission.SECRET_READ) // Usually AUDIT_READ or ADMIN role
  async getAuditEvents(
    @Param('orgId') orgId: string,
    @Query('action') action?: string,
    @Query('actorId') actorId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters = {
      action,
      actorId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.auditService.getAuditEvents(
      orgId,
      filters,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }
}
