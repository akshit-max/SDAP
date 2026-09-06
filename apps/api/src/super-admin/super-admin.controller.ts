import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SuperAdminGuard } from './super-admin.guard';
import { SuperAdminService } from './super-admin.service';
import { Request } from 'express';

/**
 * SuperAdminController
 *
 * All routes are prefixed /superadmin and protected by SuperAdminGuard.
 * These routes are completely separate from organization-scoped routes.
 * No existing organization permissions are referenced here.
 */
@Controller('superadmin')
@UseGuards(SuperAdminGuard)
@Throttle({ default: { limit: 100, ttl: 60000 } })
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  // ─── Overview / KPIs ───────────────────────────────────────────────────────

  @Get('overview')
  async getOverview(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Req() req?: Request,
  ) {
    await this.superAdminService.logPlatformAction(
      (req!.user as any).id,
      'superadmin.viewed_overview',
    );
    return this.superAdminService.getOverview(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  // ─── Growth Data (for charts) ───────────────────────────────────────────────

  @Get('growth')
  async getGrowthData(@Query('days') days?: string) {
    return this.superAdminService.getGrowthData(days ? parseInt(days, 10) : 30);
  }

  // ─── Platform Analytics ────────────────────────────────────────────────────

  @Get('platforms')
  async getPlatformStats(@Req() req?: Request) {
    await this.superAdminService.logPlatformAction(
      (req!.user as any).id,
      'superadmin.viewed_platforms',
    );
    return this.superAdminService.getPlatformStats();
  }

  // ─── System Health ──────────────────────────────────────────────────────────

  @Get('health')
  async getSystemHealth() {
    return this.superAdminService.getSystemHealth();
  }

  // ─── Admin Management ──────────────────────────────────────────────────────

  @Get('admins')
  async getSuperAdmins(@Req() req?: Request) {
    await this.superAdminService.logPlatformAction(
      (req!.user as any).id,
      'superadmin.viewed_admins',
    );
    return this.superAdminService.getSuperAdmins();
  }

  // ─── Product Analytics ─────────────────────────────────────────────────────

  @Get('analytics')
  async getProductAnalytics(
    @Query('days') days?: string,
    @Req() req?: Request,
  ) {
    await this.superAdminService.logPlatformAction(
      (req!.user as any).id,
      'superadmin.viewed_analytics',
    );
    return this.superAdminService.getProductAnalytics(
      days ? parseInt(days, 10) : 30,
    );
  }

  // ─── Notifications ─────────────────────────────────────────────────────────

  @Get('notifications')
  async getNotifications(@Req() req?: Request) {
    await this.superAdminService.logPlatformAction(
      (req!.user as any).id,
      'superadmin.viewed_notifications',
    );
    return this.superAdminService.getNotifications();
  }

  // ─── Users ─────────────────────────────────────────────────────────────────

  @Get('users')
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Req() req?: Request,
  ) {
    await this.superAdminService.logPlatformAction(
      (req!.user as any).id,
      'superadmin.viewed_users',
    );
    return this.superAdminService.getAllUsers(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
      search,
    );
  }

  @Get('users/:id')
  async getUserDetail(@Param('id') id: string, @Req() req: Request) {
    const user = await this.superAdminService.getUserDetail(id);
    if (!user) throw new NotFoundException('User not found');
    await this.superAdminService.logPlatformAction(
      (req.user as any).id,
      'superadmin.viewed_user_detail',
      'USER',
      id,
    );
    return user;
  }

  // ─── Organizations ─────────────────────────────────────────────────────────

  @Get('organizations')
  async getAllOrganizations(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Req() req?: Request,
  ) {
    await this.superAdminService.logPlatformAction(
      (req!.user as any).id,
      'superadmin.viewed_organizations',
    );
    return this.superAdminService.getAllOrganizations(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
      search,
    );
  }

  @Get('organizations/:id')
  async getOrganizationDetail(@Param('id') id: string, @Req() req: Request) {
    const org = await this.superAdminService.getOrganizationDetail(id);
    if (!org) throw new NotFoundException('Organization not found');
    await this.superAdminService.logPlatformAction(
      (req.user as any).id,
      'superadmin.viewed_org_detail',
      'ORGANIZATION',
      id,
      { orgName: org.name },
    );
    return org;
  }

  // ─── Sessions ──────────────────────────────────────────────────────────────

  @Get('sessions')
  async getAllSessions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Req() req?: Request,
  ) {
    await this.superAdminService.logPlatformAction(
      (req!.user as any).id,
      'superadmin.viewed_sessions',
    );
    return this.superAdminService.getAllSessions(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
      status,
    );
  }

  // ─── Audit ─────────────────────────────────────────────────────────────────

  @Get('audit')
  async getGlobalAudit(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('organizationId') organizationId?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Req() req?: Request,
  ) {
    await this.superAdminService.logPlatformAction(
      (req!.user as any).id,
      'superadmin.viewed_audit',
    );
    return this.superAdminService.getGlobalAuditEvents(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
      {
        organizationId,
        action,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    );
  }

  // ─── Platform Admin Audit Log ──────────────────────────────────────────────

  @Get('platform-audit')
  async getPlatformAudit(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.superAdminService.getPlatformAuditLog(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  // ─── WITHUS Platform Ecosystem ─────────────────────────────────────────────
  // Returns all 11 official WITHUS Vault platforms with real DB data.
  // Google Ads is intentionally excluded.

  @Get('platform-ecosystem')
  async getPlatformEcosystem(@Req() req: Request) {
    const actorId = (req as any).user?.userId;
    if (actorId) {
      await this.superAdminService.logPlatformAction(
        actorId,
        'superadmin.viewed_platform_ecosystem',
        undefined,
        undefined,
        (req as any).ip,
        req.headers['user-agent'],
      );
    }
    return this.superAdminService.getPlatformEcosystem();
  }

  // ─── Vault Analytics ───────────────────────────────────────────────────────
  // Returns real vault/secret/session analytics from existing Prisma models.
  // No schema changes required.

  @Get('vault-analytics')
  async getVaultAnalytics(@Req() req: Request) {
    const actorId = (req as any).user?.userId;
    if (actorId) {
      await this.superAdminService.logPlatformAction(
        actorId,
        'superadmin.viewed_vault_analytics',
        undefined,
        undefined,
        (req as any).ip,
        req.headers['user-agent'],
      );
    }
    return this.superAdminService.getVaultAnalytics();
  }
}
