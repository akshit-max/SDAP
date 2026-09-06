import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuperAdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── KPI Overview ──────────────────────────────────────────────────────────

  async getOverview(dateFrom?: Date, dateTo?: Date) {
    const now = dateTo || new Date();
    const fromDate =
      dateFrom || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      newUsers,
      totalOrgs,
      activeOrgs,
      newOrgs,
      totalVaults,
      totalSecrets,
      activeSessions,
      pendingSessions,
      revokedSessions,
      expiredSessions,
      recentAuditEvents,
      totalConnections,
      failedConnections,
    ] = await Promise.all([
      // Users
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.user.count({
        where: { deletedAt: null, createdAt: { gte: fromDate, lte: now } },
      }),
      // Organizations
      this.prisma.organization.count({ where: { deletedAt: null } }),
      this.prisma.organization.count({
        where: { deletedAt: null, isActive: true },
      }),
      this.prisma.organization.count({
        where: { deletedAt: null, createdAt: { gte: fromDate, lte: now } },
      }),
      // Vaults & Secrets
      this.prisma.vault.count({ where: { deletedAt: null } }),
      this.prisma.secret.count({ where: { deletedAt: null } }),
      // Sessions by status
      this.prisma.delegatedSession.count({ where: { status: 'ACTIVE' } }),
      this.prisma.delegatedSession.count({
        where: { status: 'PENDING_GRANT' },
      }),
      this.prisma.delegatedSession.count({ where: { status: 'REVOKED' } }),
      this.prisma.delegatedSession.count({ where: { status: 'EXPIRED' } }),
      // Recent audit activity (last 7 days)
      this.prisma.auditEvent.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      // Integration connections
      this.prisma.integrationConnection.count({ where: { deletedAt: null } }),
      this.prisma.integrationConnection.count({
        where: { deletedAt: null, status: 'ERROR' },
      }),
    ]);

    // Top platforms by active session count
    const platformStats = await this.prisma.delegatedSession.groupBy({
      by: ['integrationProvider'],
      where: { status: 'ACTIVE', integrationProvider: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newInPeriod: newUsers,
        inactive: totalUsers - activeUsers,
      },
      organizations: {
        total: totalOrgs,
        active: activeOrgs,
        newInPeriod: newOrgs,
        inactive: totalOrgs - activeOrgs,
      },
      vaults: { total: totalVaults },
      secrets: { total: totalSecrets },
      sessions: {
        active: activeSessions,
        pending: pendingSessions,
        revoked: revokedSessions,
        expired: expiredSessions,
        total:
          activeSessions + pendingSessions + revokedSessions + expiredSessions,
      },
      connections: {
        total: totalConnections,
        failed: failedConnections,
        healthy: totalConnections - failedConnections,
      },
      audit: { eventsLast7Days: recentAuditEvents },
      topPlatforms: platformStats.map((p) => ({
        provider: p.integrationProvider,
        activeSessions: p._count.id,
      })),
      // ─── Billing-dependent KPIs — NOT AVAILABLE until billing integration ───
      billing: null,
    };
  }

  // ─── Growth Data (for charts) ───────────────────────────────────────────────

  async getGrowthData(days: number = 30) {
    const now = new Date();
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Build date buckets
    const buckets: { date: string }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      buckets.push({ date: d.toISOString().split('T')[0]! });
    }

    // Get all orgs created in range
    const orgs = await this.prisma.organization.findMany({
      where: { deletedAt: null, createdAt: { gte: from } },
      select: { createdAt: true, isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    // Get all users created in range
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null, createdAt: { gte: from } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Get sessions created in range
    const sessions = await this.prisma.delegatedSession.findMany({
      where: { createdAt: { gte: from } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    // Get audit events in range
    const auditEvents = await this.prisma.auditEvent.findMany({
      where: { createdAt: { gte: from } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Map to date buckets
    const orgMap = new Map<string, number>();
    const userMap = new Map<string, number>();
    const sessionMap = new Map<string, number>();
    const auditMap = new Map<string, number>();

    for (const o of orgs) {
      const key = o.createdAt.toISOString().split('T')[0]!;
      orgMap.set(key, (orgMap.get(key) ?? 0) + 1);
    }
    for (const u of users) {
      const key = u.createdAt.toISOString().split('T')[0]!;
      userMap.set(key, (userMap.get(key) ?? 0) + 1);
    }
    for (const s of sessions) {
      const key = s.createdAt.toISOString().split('T')[0]!;
      sessionMap.set(key, (sessionMap.get(key) ?? 0) + 1);
    }
    for (const a of auditEvents) {
      const key = a.createdAt.toISOString().split('T')[0]!;
      auditMap.set(key, (auditMap.get(key) ?? 0) + 1);
    }

    return {
      labels: buckets.map((b) => b.date),
      orgs: buckets.map((b) => orgMap.get(b.date) || 0),
      users: buckets.map((b) => userMap.get(b.date) || 0),
      sessions: buckets.map((b) => sessionMap.get(b.date) || 0),
      auditEvents: buckets.map((b) => auditMap.get(b.date) || 0),
    };
  }

  // ─── Platform / Integration Analytics ──────────────────────────────────────

  async getPlatformStats() {
    // Grouped connection stats by provider
    const connectionsByProvider =
      await this.prisma.integrationConnection.groupBy({
        by: ['provider', 'status'],
        where: { deletedAt: null },
        _count: { id: true },
      });

    // Distinct org counts per provider
    const orgsByProvider = await this.prisma.integrationConnection.groupBy({
      by: ['provider'],
      where: { deletedAt: null },
      _count: { organizationId: true },
    });

    // Sessions per provider (all-time)
    const sessionsByProvider = await this.prisma.delegatedSession.groupBy({
      by: ['integrationProvider'],
      where: { integrationProvider: { not: null } },
      _count: { id: true },
    });

    // Build provider map
    const providers = ['VERCEL', 'GITHUB', 'GODADDY', 'GMAIL'];
    const stats = providers.map((provider) => {
      const connections = connectionsByProvider.filter(
        (c) => c.provider === provider,
      );
      const total = connections.reduce((sum, c) => sum + c._count.id, 0);
      const active =
        connections.find((c) => c.status === 'ACTIVE')?._count.id || 0;
      const failed =
        connections.find((c) => c.status === 'ERROR')?._count.id || 0;
      const disconnected =
        connections.find((c) => c.status === 'DISCONNECTED')?._count.id || 0;
      const orgs =
        orgsByProvider.find((o) => o.provider === provider)?._count
          .organizationId || 0;
      const sessions =
        sessionsByProvider.find((s) => s.integrationProvider === provider)
          ?._count.id || 0;

      return { provider, total, active, failed, disconnected, orgs, sessions };
    });

    // 15-day platform activity (connect / disconnect events)
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const recentActivity = await this.prisma.auditEvent.findMany({
      where: {
        createdAt: { gte: fifteenDaysAgo },
        action: { in: ['integration.connected', 'integration.disconnected'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        action: true,
        createdAt: true,
        metadata: true,
        organization: { select: { id: true, name: true } },
        actor: { select: { email: true, fullName: true } },
      },
    });

    return { stats, recentActivity };
  }

  // ─── System Health ──────────────────────────────────────────────────────────

  async getSystemHealth() {
    // DB connectivity check
    let dbStatus: 'operational' | 'degraded' | 'down' = 'operational';
    let dbLatencyMs = 0;
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;
    } catch {
      dbStatus = 'down';
    }

    // Integration connection health summary
    const integrationHealth = await this.prisma.integrationConnection.groupBy({
      by: ['provider', 'status'],
      where: { deletedAt: null },
      _count: { id: true },
    });

    // Recent failed audit events (proxy for error rate)
    const recentErrors = await this.prisma.auditEvent.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // last 1 hour
        action: { in: ['auth.failed', 'session.revoke_failed'] },
      },
    });

    return {
      api: { status: 'operational' },
      database: { status: dbStatus, latencyMs: dbLatencyMs },
      integrations: integrationHealth.map((h) => ({
        provider: h.provider,
        status: h.status,
        count: h._count.id,
      })),
      errorEventsLastHour: recentErrors,
    };
  }

  // ─── Admin Management ──────────────────────────────────────────────────────

  async getSuperAdmins() {
    const [admins, recentActivity] = await Promise.all([
      this.prisma.user.findMany({
        where: { isSuperAdmin: true, deletedAt: null },
        select: {
          id: true,
          email: true,
          fullName: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.platformAuditEvent.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { email: true, fullName: true } } },
      }),
    ]);

    return { admins, recentActivity };
  }

  // ─── Product Analytics ─────────────────────────────────────────────────────

  async getProductAnalytics(days: number = 30) {
    const now = new Date();
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const day7ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const day30ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalOrgs,
      orgsWithSession,
      orgsWithVault,
      totalAuditEvents,
      activeUsersLast7d,
      activeUsersLast30d,
      credentialEvents,
      newOrgsInPeriod,
      newUsersInPeriod,
    ] = await Promise.all([
      this.prisma.organization.count({ where: { deletedAt: null } }),
      // Orgs that have ever had a session (activation proxy)
      this.prisma.delegatedSession
        .groupBy({
          by: ['organizationId'],
          _count: { id: true },
        })
        .then((r) => r.length),
      // Orgs that have at least one vault (activation proxy)
      this.prisma.vault
        .groupBy({
          by: ['organizationId'],
          where: { deletedAt: null },
          _count: { id: true },
        })
        .then((r) => r.length),
      // Total audit events in period (engagement proxy)
      this.prisma.auditEvent.count({ where: { createdAt: { gte: from } } }),
      // Distinct active users last 7 days (DAU proxy via audit)
      this.prisma.auditEvent
        .groupBy({
          by: ['actorId'],
          where: { createdAt: { gte: day7ago }, actorId: { not: null } },
        })
        .then((r) => r.length),
      // Distinct active users last 30 days
      this.prisma.auditEvent
        .groupBy({
          by: ['actorId'],
          where: { createdAt: { gte: day30ago }, actorId: { not: null } },
        })
        .then((r) => r.length),
      // Credential events (secret created/updated/deleted)
      this.prisma.auditEvent.count({
        where: {
          createdAt: { gte: from },
          action: {
            in: [
              'secret.created',
              'secret.updated',
              'secret.deleted',
              'secret.revealed',
            ],
          },
        },
      }),
      this.prisma.organization.count({
        where: { deletedAt: null, createdAt: { gte: from } },
      }),
      this.prisma.user.count({
        where: { deletedAt: null, createdAt: { gte: from } },
      }),
    ]);

    return {
      acquisition: {
        newOrgs: newOrgsInPeriod,
        newUsers: newUsersInPeriod,
      },
      activation: {
        orgsWithSession,
        orgsWithVault,
        activationRate:
          totalOrgs > 0 ? Math.round((orgsWithSession / totalOrgs) * 100) : 0,
        note: 'Activation = org has created at least one delegated session',
      },
      engagement: {
        activeUsersLast7d,
        activeUsersLast30d,
        auditEventsInPeriod: totalAuditEvents,
        credentialEvents,
        note: 'Active users approximated from audit event activity',
      },
      // ─── Billing-dependent metrics — deferred to Phase 2 ──────────────────
      retention: null,
      conversion: null,
      churn: null,
    };
  }

  // ─── Notifications ─────────────────────────────────────────────────────────

  async getNotifications() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      newOrgsToday,
      newUsersToday,
      failedConnections,
      recentSuperAdminActions,
    ] = await Promise.all([
      this.prisma.organization.count({
        where: { deletedAt: null, createdAt: { gte: last24h } },
      }),
      this.prisma.user.count({
        where: { deletedAt: null, createdAt: { gte: last24h } },
      }),
      this.prisma.integrationConnection.findMany({
        where: { deletedAt: null, status: 'ERROR' },
        select: {
          provider: true,
          lastError: true,
          lastCheckedAt: true,
          organization: { select: { name: true } },
        },
        take: 10,
      }),
      this.prisma.platformAuditEvent.findMany({
        where: { createdAt: { gte: last7d } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { actor: { select: { email: true } } },
      }),
    ]);

    const alerts: any[] = [];

    // Critical: failed integration connections
    for (const fc of failedConnections) {
      alerts.push({
        level: 'critical',
        title: `Integration Failure — ${fc.provider}`,
        message: `${fc.organization.name}: ${fc.lastError || 'Connection error'}`,
        time: fc.lastCheckedAt,
      });
    }

    // Info: new organisations
    if (newOrgsToday > 0) {
      alerts.push({
        level: 'info',
        title: `${newOrgsToday} New Organisation${newOrgsToday > 1 ? 's' : ''} Today`,
        message: 'New organisations registered in the last 24 hours.',
        time: now,
      });
    }

    // Info: new users
    if (newUsersToday > 0) {
      alerts.push({
        level: 'info',
        title: `${newUsersToday} New User${newUsersToday > 1 ? 's' : ''} Today`,
        message: 'New users registered in the last 24 hours.',
        time: now,
      });
    }

    return {
      alerts,
      recentAdminActions: recentSuperAdminActions,
    };
  }

  // ─── Users ─────────────────────────────────────────────────────────────────

  async getAllUsers(page: number = 1, limit: number = 50, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          isActive: true,
          isSuperAdmin: true,
          lastLoginAt: true,
          createdAt: true,
          emailVerifiedAt: true,
          organizationMemberships: {
            where: { removedAt: null },
            select: {
              role: true,
              organization: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserDetail(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        isSuperAdmin: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        emailVerifiedAt: true,
        organizationMemberships: {
          where: { removedAt: null },
          select: {
            role: true,
            joinedAt: true,
            lastActiveAt: true,
            organization: {
              select: { id: true, name: true, slug: true, isActive: true },
            },
          },
        },
        // Intentionally: no passwordHash, no refreshTokens, no providerProfiles
      },
    });
  }

  // ─── Organizations ─────────────────────────────────────────────────────────

  async getAllOrganizations(
    page: number = 1,
    limit: number = 50,
    search?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [orgs, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              members: true,
              vaults: true,
              delegatedSessions: true,
              integrationConnections: true,
            },
          },
          members: {
            where: { role: 'OWNER', removedAt: null },
            take: 1,
            select: {
              user: { select: { id: true, email: true, fullName: true } },
            },
          },
        },
      }),
      this.prisma.organization.count({ where }),
    ]);

    // Approximate lastActive from latest AuditEvent per org
    const orgIds = orgs.map((o) => o.id);
    const latestAuditPerOrg = await this.prisma.auditEvent.findMany({
      where: { organizationId: { in: orgIds } },
      orderBy: { createdAt: 'desc' },
      distinct: ['organizationId'],
      select: { organizationId: true, createdAt: true },
    });
    const lastActiveMap = new Map(
      latestAuditPerOrg.map((a) => [a.organizationId, a.createdAt]),
    );

    return {
      data: orgs.map((org) => ({
        ...org,
        owner: org.members[0]?.user ?? null,
        members: undefined,
        lastActiveAt: lastActiveMap.get(org.id) ?? null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrganizationDetail(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        members: {
          where: { removedAt: null },
          select: {
            role: true,
            joinedAt: true,
            lastActiveAt: true,
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                isActive: true,
                lastLoginAt: true,
              },
            },
          },
        },
        vaults: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            createdAt: true,
            _count: { select: { secrets: true } },
          },
        },
        integrationConnections: {
          where: { deletedAt: null },
          select: {
            provider: true,
            status: true,
            createdAt: true,
            lastCheckedAt: true,
            lastError: true,
          },
        },
        _count: {
          select: {
            members: true,
            vaults: true,
            delegatedSessions: true,
            approvalRequests: true,
          },
        },
      },
    });

    if (!org) return null;

    const [
      activeSessionCount,
      pendingApprovalCount,
      secretCount,
      recentAudit,
      lastAudit,
    ] = await Promise.all([
      this.prisma.delegatedSession.count({
        where: { organizationId: orgId, status: 'ACTIVE' },
      }),
      this.prisma.approvalRequest.count({
        where: { organizationId: orgId, status: 'PENDING' },
      }),
      this.prisma.secret.count({
        where: { vault: { organizationId: orgId }, deletedAt: null },
      }),
      this.prisma.auditEvent.findMany({
        where: { organizationId: orgId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          resourceType: true,
          createdAt: true,
          actor: { select: { email: true, fullName: true } },
        },
      }),
      this.prisma.auditEvent.findFirst({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    return {
      ...org,
      activeSessionCount,
      pendingApprovalCount,
      secretCount,
      recentAudit,
      lastActiveAt: lastAudit?.createdAt ?? null,
    };
  }

  // ─── Sessions ──────────────────────────────────────────────────────────────

  async getAllSessions(page: number = 1, limit: number = 50, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [sessions, total] = await Promise.all([
      this.prisma.delegatedSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          scope: true,
          permission: true,
          integrationProvider: true,
          expiresAt: true,
          createdAt: true,
          revokedAt: true,
          organization: { select: { id: true, name: true } },
          grantor: { select: { id: true, email: true, fullName: true } },
          grantee: { select: { id: true, email: true, fullName: true } },
          // Intentionally: no resourceId details (could expose credential IDs)
        },
      }),
      this.prisma.delegatedSession.count({ where }),
    ]);

    return {
      data: sessions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Global Audit Events ───────────────────────────────────────────────────

  async getGlobalAuditEvents(
    page: number = 1,
    limit: number = 50,
    filters: {
      organizationId?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.action)
      where.action = { contains: filters.action, mode: 'insensitive' };
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [events, total] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          resourceType: true,
          resourceId: true,
          createdAt: true,
          organization: { select: { id: true, name: true } },
          actor: { select: { id: true, email: true, fullName: true } },
        },
      }),
      this.prisma.auditEvent.count({ where }),
    ]);

    return {
      data: events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Platform Audit Log (Super Admin actions) ──────────────────────────────

  async logPlatformAction(
    actorId: string,
    action: string,
    targetType?: string,
    targetId?: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
  ) {
    await this.prisma.platformAuditEvent.create({
      data: { actorId, action, targetType, targetId, metadata, ipAddress },
    });
  }

  async getPlatformAuditLog(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      this.prisma.platformAuditEvent.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { email: true, fullName: true } } },
      }),
      this.prisma.platformAuditEvent.count(),
    ]);

    return {
      data: events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── WITHUS Platform Ecosystem ─────────────────────────────────────────────
  // Returns the 11 official WITHUS Vault platforms enriched with real DB data.
  // Google Ads is intentionally excluded — not a WITHUS Vault platform.
  // Extension-only platforms show null (not 0) for session/org counts since
  // those metrics cannot be derived without a platform field on Secret.
  async getPlatformEcosystem() {
    // The 11 official WITHUS Vault platforms (source of truth: platform-registry.ts)
    const VAULT_PLATFORMS = [
      {
        id: 'GITHUB',
        name: 'GitHub',
        category: 'Development',
        autofillSupport: 'full' as const,
        nativeApiIntegration: true,
        otpSupport: false,
        limitations: null,
      },
      {
        id: 'VERCEL',
        name: 'Vercel',
        category: 'Development',
        autofillSupport: 'full' as const,
        nativeApiIntegration: true,
        otpSupport: true,
        otpType: 'Email OTP',
        limitations: null,
      },
      {
        id: 'GODADDY',
        name: 'GoDaddy',
        category: 'Domain & Hosting',
        autofillSupport: 'full' as const,
        nativeApiIntegration: true,
        otpSupport: false,
        limitations: null,
      },
      {
        id: 'GMAIL',
        name: 'Gmail',
        category: 'Email',
        autofillSupport: 'full' as const,
        nativeApiIntegration: true,
        otpSupport: false,
        limitations:
          'Google 2-Step Verification must be completed manually on first login from a new device.',
      },
      {
        id: 'SHOPIFY',
        name: 'Shopify',
        category: 'E-commerce',
        autofillSupport: 'full' as const,
        nativeApiIntegration: false,
        otpSupport: false,
        limitations: null,
      },
      {
        id: 'STRIPE',
        name: 'Stripe',
        category: 'Payments',
        autofillSupport: 'full' as const,
        nativeApiIntegration: false,
        otpSupport: true,
        otpType: 'Email OTP',
        limitations: null,
      },
      {
        id: 'RAZORPAY',
        name: 'Razorpay',
        category: 'Payments',
        autofillSupport: 'full' as const,
        nativeApiIntegration: false,
        otpSupport: true,
        otpType: 'Email OTP',
        limitations: null,
      },
      {
        id: 'LINKEDIN',
        name: 'LinkedIn',
        category: 'Social & Business',
        autofillSupport: 'partial' as const,
        nativeApiIntegration: false,
        otpSupport: false,
        limitations:
          'Email field exhibits platform-specific React controlled-input behaviour causing value to clear on blur. Deferred — not blocking primary objectives.',
      },
      {
        id: 'MCA',
        name: 'MCA Portal',
        category: 'Government (India)',
        autofillSupport: 'manual_step' as const,
        nativeApiIntegration: false,
        otpSupport: false,
        limitations:
          'CAPTCHA-protected. Credentials are filled, user completes CAPTCHA manually.',
      },
      {
        id: 'GST',
        name: 'GST Portal',
        category: 'Government (India)',
        autofillSupport: 'manual_step' as const,
        nativeApiIntegration: false,
        otpSupport: false,
        limitations:
          'CAPTCHA + mandatory mobile OTP since April 2023. Credentials are filled, user completes CAPTCHA and OTP manually.',
      },
      {
        id: 'UDYAM',
        name: 'Udyam Portal',
        category: 'Government (India)',
        autofillSupport: 'manual_step' as const,
        nativeApiIntegration: false,
        otpSupport: false,
        limitations:
          'OTP-based login — no password field. Udyam Registration Number is filled; mobile number and OTP are completed manually by the user.',
      },
    ];

    // ── Native API Integration data (VERCEL/GITHUB/GODADDY/GMAIL only) ───────
    const nativeProviders = ['VERCEL', 'GITHUB', 'GODADDY', 'GMAIL'];
    const [connectionsByProvider, sessionsByProvider, presenceByPlatform] =
      await Promise.all([
        this.prisma.integrationConnection.groupBy({
          by: ['provider', 'status'],
          where: { deletedAt: null },
          _count: { id: true },
        }),
        this.prisma.delegatedSession.groupBy({
          by: ['integrationProvider'],
          where: { integrationProvider: { not: null } },
          _count: { id: true },
        }),
        // UserPresence.platform stores the platform ID (e.g. 'GITHUB', 'MCA', etc.)
        this.prisma.userPresence.groupBy({
          by: ['platform'],
          _count: { userId: true },
        }),
      ]);

    const presenceMap = new Map<string, number>();
    for (const p of presenceByPlatform) {
      presenceMap.set(p.platform.toUpperCase(), p._count.userId);
    }

    const sessionNativeMap = new Map<string, number>();
    for (const s of sessionsByProvider) {
      if (s.integrationProvider) {
        sessionNativeMap.set(s.integrationProvider, s._count.id);
      }
    }

    const platforms = VAULT_PLATFORMS.map((platform) => {
      const isNative = nativeProviders.includes(platform.id);

      // Native platforms: derive connection and session data from DB
      let connections: {
        total: number;
        active: number;
        failed: number;
        disconnected: number;
      } | null = null;
      let nativeSessions: number | null = null;

      if (isNative) {
        const providerRows = connectionsByProvider.filter(
          (c: any) => c.provider === platform.id,
        );
        const total = providerRows.reduce(
          (sum: number, c: any) => sum + c._count.id,
          0,
        );
        const active =
          providerRows.find((c: any) => c.status === 'ACTIVE')?._count.id || 0;
        const failed =
          providerRows.find((c: any) => c.status === 'ERROR')?._count.id || 0;
        const disconnected =
          providerRows.find((c: any) => c.status === 'DISCONNECTED')?._count
            .id || 0;
        connections = { total, active, failed, disconnected };
        nativeSessions = sessionNativeMap.get(platform.id) ?? 0;
      }

      // Extension-only platforms: session analytics unavailable without platform field on Secret.
      // We use null (not 0) to indicate "cannot measure" vs "measured zero".
      const activePresence = presenceMap.get(platform.id) ?? null;

      return {
        ...platform,
        // Session/connection analytics for this platform
        integrationConnections: connections, // null for extension-only platforms
        nativeSessionCount: nativeSessions, // null for extension-only platforms
        // Real-time active extension users on this platform (from UserPresence heartbeats)
        activePresenceCount: activePresence,
        // Data availability note for extension-only platforms
        analyticsNote: !isNative
          ? 'Session and organisation analytics unavailable — platform field not currently stored on Secret. Extension autofill and vault credential support are fully functional.'
          : null,
      };
    });

    return { platforms };
  }

  // ─── Vault Analytics ───────────────────────────────────────────────────────
  // Queries existing Vault/Secret/DelegatedSession/AuditEvent models.
  // No schema changes. Extension-only session analytics noted as unavailable where applicable.
  async getVaultAnalytics() {
    const [
      totalVaults,
      totalSecrets,
      secretsByType,
      secretsByStatus,
      topVaultsBySecretCount,
      topRevealedSecrets,
      sessionsByScope,
      recentVaultActivity,
    ] = await Promise.all([
      // Counts
      this.prisma.vault.count({ where: { deletedAt: null } }),
      this.prisma.secret.count({ where: { deletedAt: null } }),
      // Secret type breakdown
      this.prisma.secret.groupBy({
        by: ['type'],
        where: { deletedAt: null },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      // Secret status breakdown
      this.prisma.secret.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      // Top 10 vaults by secret count
      this.prisma.vault.findMany({
        where: { deletedAt: null },
        take: 10,
        include: {
          organization: { select: { name: true, id: true } },
          _count: { select: { secrets: true } },
        },
        orderBy: { secrets: { _count: 'desc' } },
      }),
      // Top 10 most accessed secrets (by reveal count)
      this.prisma.secret.findMany({
        where: { deletedAt: null, revealCount: { gt: 0 } },
        take: 10,
        select: {
          id: true,
          name: true,
          type: true,
          revealCount: true,
          lastRevealedAt: true,
          vault: {
            select: {
              name: true,
              organization: { select: { name: true } },
            },
          },
        },
        orderBy: { revealCount: 'desc' },
      }),
      // Session distribution by scope
      this.prisma.delegatedSession.groupBy({
        by: ['scope'],
        _count: { id: true },
      }),
      // Recent vault-related audit events (last 50)
      this.prisma.auditEvent.findMany({
        where: {
          action: {
            in: [
              'secret.revealed',
              'secret.created',
              'secret.updated',
              'secret.deleted',
              'vault.created',
              'vault.updated',
              'vault.deleted',
              'session.created',
              'session.revoked',
              'session.expired',
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          action: true,
          resourceType: true,
          resourceId: true,
          createdAt: true,
          actor: { select: { email: true, fullName: true } },
          organization: { select: { name: true } },
        },
      }),
    ]);

    // Active sessions total
    const activeSessions = await this.prisma.delegatedSession.count({
      where: { status: 'ACTIVE' },
    });

    // Total reveals across all secrets
    const totalReveals = await this.prisma.secret.aggregate({
      _sum: { revealCount: true },
      where: { deletedAt: null },
    });

    return {
      summary: {
        totalVaults,
        totalSecrets,
        activeSessions,
        totalReveals: totalReveals._sum.revealCount ?? 0,
      },
      secretsByType: secretsByType.map((s) => ({
        type: s.type,
        count: s._count.id,
      })),
      secretsByStatus: secretsByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      topVaults: topVaultsBySecretCount.map((v) => ({
        id: v.id,
        name: v.name,
        orgName: v.organization.name,
        orgId: v.organization.id,
        secretCount: v._count.secrets,
      })),
      topRevealedSecrets: topRevealedSecrets.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        revealCount: s.revealCount,
        lastRevealedAt: s.lastRevealedAt,
        vaultName: s.vault.name,
        orgName: s.vault.organization.name,
      })),
      sessionsByScope: sessionsByScope.map((s) => ({
        scope: s.scope,
        count: s._count.id,
      })),
      recentActivity: recentVaultActivity,
    };
  }
}
