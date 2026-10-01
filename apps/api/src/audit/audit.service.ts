import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementService } from '../billing/subscription/entitlement.service';

// ─── Plan constants (server-side, not trusted from client) ────────────────────
const FREE_HISTORY_DAYS = 7;

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementService,
  ) {}

  async getAuditEvents(
    organizationId: string,
    filters: {
      action?: string;
      actorId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    page: number = 1,
    limit: number = 50,
  ) {
    // ── Plan-based history restriction ────────────────────────────────────────
    // FREE plan: hard-clamp startDate to max(requested, now - 7 days).
    // This is enforced server-side and cannot be bypassed by the client.
    const plan = await this.entitlements.getEffectivePlan(organizationId);

    if (plan === 'FREE') {
      const cutoff = new Date(
        Date.now() - FREE_HISTORY_DAYS * 24 * 60 * 60 * 1000,
      );
      // If no startDate supplied, inject the 7-day cutoff.
      // If client supplied a startDate newer than cutoff, honour it (stricter is fine).
      // If client supplied a startDate OLDER than cutoff, clamp to cutoff.
      if (!filters.startDate || filters.startDate < cutoff) {
        filters = { ...filters, startDate: cutoff };
      }
    }
    // PRO / BUSINESS: no restriction — full history available.

    const where: any = { organizationId };

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.actorId) {
      where.actorId = filters.actorId;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }, // Newest first
        include: {
          actor: { select: { email: true, fullName: true } },
        },
      }),
      this.prisma.auditEvent.count({ where }),
    ]);

    const enrichedData = await this.enrichMetadata(data);

    return {
      data: enrichedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      // Expose the effective plan so the frontend can render the lock UI
      // without needing a second API call.
      plan,
      historyLimitDays: plan === 'FREE' ? FREE_HISTORY_DAYS : null,
    };
  }

  /**
   * Export audit events as CSV.
   * Restricted to BUSINESS plan only. FREE and PRO receive 403.
   * Reuses the same audit query — no second audit mechanism.
   */
  async exportAuditCsv(
    organizationId: string,
    filters: {
      action?: string;
      actorId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<string> {
    const plan = await this.entitlements.getEffectivePlan(organizationId);

    if (plan !== 'BUSINESS') {
      throw new ForbiddenException(
        'Audit log export is available on the Business plan only.',
      );
    }

    const where: any = { organizationId };
    if (filters.action) where.action = filters.action;
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    // Fetch all matching events (no pagination for export — full dataset)
    const events = await this.prisma.auditEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { email: true, fullName: true } },
      },
    });

    // Build CSV in-memory (no external dependencies needed)
    const header = [
      'id',
      'action',
      'actor',
      'resourceType',
      'resourceId',
      'createdAt',
    ].join(',');
    const rows = events.map((e) => {
      const actor = (e.actor as any)?.fullName || (e.actor as any)?.email || '';
      return [
        e.id,
        e.action,
        `"${actor.replace(/"/g, '""')}"`,
        e.resourceType ?? '',
        e.resourceId ?? '',
        e.createdAt.toISOString(),
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }

  private async enrichMetadata(events: any[]) {
    // Collect all IDs
    const userIds = new Set<string>();
    const vaultIds = new Set<string>();
    const secretIds = new Set<string>();

    for (const event of events) {
      if (event.resourceType === 'VAULT' && event.resourceId)
        vaultIds.add(event.resourceId);
      if (event.resourceType === 'SECRET' && event.resourceId)
        secretIds.add(event.resourceId);

      if (!event.metadata) continue;
      const meta = event.metadata as Record<string, any>;

      if (meta.vaultId) vaultIds.add(meta.vaultId);
      if (meta.secretId) secretIds.add(meta.secretId);
      if (meta.granteeId) userIds.add(meta.granteeId);
      if (meta.requesterId) userIds.add(meta.requesterId);
      if (meta.resourceId) {
        if (meta.scope === 'SECRET' || event.action.includes('secret'))
          secretIds.add(meta.resourceId);
        if (meta.scope === 'VAULT' || event.action.includes('vault'))
          vaultIds.add(meta.resourceId);
      }
    }

    // Fetch names
    const [users, vaults, secrets] = await Promise.all([
      userIds.size > 0
        ? this.prisma.user.findMany({
            where: { id: { in: Array.from(userIds) } },
            select: { id: true, fullName: true, email: true },
          })
        : [],
      vaultIds.size > 0
        ? this.prisma.vault.findMany({
            where: { id: { in: Array.from(vaultIds) } },
            select: { id: true, name: true },
          })
        : [],
      secretIds.size > 0
        ? this.prisma.secret.findMany({
            where: { id: { in: Array.from(secretIds) } },
            select: { id: true, name: true },
          })
        : [],
    ]);

    const userMap = new Map<string, string>(
      users.map(
        (u) => [u.id, u.fullName || u.email || u.id] as [string, string],
      ),
    );
    const vaultMap = new Map<string, string>(
      vaults.map((v) => [v.id, v.name] as [string, string]),
    );
    const secretMap = new Map<string, string>(
      secrets.map((s) => [s.id, s.name] as [string, string]),
    );

    // Replace in metadata
    return events.map((event) => {
      const enrichedEvent = { ...event };

      // Also enrich resourceName at the top level
      if (enrichedEvent.resourceType === 'VAULT')
        enrichedEvent.resourceName =
          vaultMap.get(enrichedEvent.resourceId) || enrichedEvent.resourceId;
      if (enrichedEvent.resourceType === 'SECRET')
        enrichedEvent.resourceName =
          secretMap.get(enrichedEvent.resourceId) || enrichedEvent.resourceId;

      if (enrichedEvent.metadata) {
        const meta = { ...(enrichedEvent.metadata as object) } as Record<
          string,
          any
        >;
        if (meta.vaultId && vaultMap.has(meta.vaultId)) {
          meta.vaultName = vaultMap.get(meta.vaultId);
          delete meta.vaultId;
        }
        if (meta.secretId && secretMap.has(meta.secretId)) {
          meta.secretName = secretMap.get(meta.secretId);
          delete meta.secretId;
        }
        if (meta.granteeId && userMap.has(meta.granteeId)) {
          meta.grantee = userMap.get(meta.granteeId);
          delete meta.granteeId;
        }
        if (meta.requesterId && userMap.has(meta.requesterId)) {
          meta.requester = userMap.get(meta.requesterId);
          delete meta.requesterId;
        }
        if (meta.resourceId) {
          if (secretMap.has(meta.resourceId)) {
            meta.resourceName = secretMap.get(meta.resourceId);
            delete meta.resourceId;
          } else if (vaultMap.has(meta.resourceId)) {
            meta.resourceName = vaultMap.get(meta.resourceId);
            delete meta.resourceId;
          }
        }
        enrichedEvent.metadata = meta;
      }
      return enrichedEvent;
    });
  }
}
