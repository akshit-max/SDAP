import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

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
    };
  }

  private async enrichMetadata(events: any[]) {
    // Collect all IDs
    const userIds = new Set<string>();
    const vaultIds = new Set<string>();
    const secretIds = new Set<string>();

    for (const event of events) {
      if (event.resourceType === 'VAULT' && event.resourceId) vaultIds.add(event.resourceId);
      if (event.resourceType === 'SECRET' && event.resourceId) secretIds.add(event.resourceId);
      
      if (!event.metadata) continue;
      const meta = event.metadata as Record<string, any>;
      
      if (meta.vaultId) vaultIds.add(meta.vaultId);
      if (meta.secretId) secretIds.add(meta.secretId);
      if (meta.granteeId) userIds.add(meta.granteeId);
      if (meta.requesterId) userIds.add(meta.requesterId);
      if (meta.resourceId) {
        if (meta.scope === 'SECRET' || event.action.includes('secret')) secretIds.add(meta.resourceId);
        if (meta.scope === 'VAULT' || event.action.includes('vault')) vaultIds.add(meta.resourceId);
      }
    }

    // Fetch names
    const [users, vaults, secrets] = await Promise.all([
      userIds.size > 0 ? this.prisma.user.findMany({ where: { id: { in: Array.from(userIds) } }, select: { id: true, fullName: true, email: true } }) : [],
      vaultIds.size > 0 ? this.prisma.vault.findMany({ where: { id: { in: Array.from(vaultIds) } }, select: { id: true, name: true } }) : [],
      secretIds.size > 0 ? this.prisma.secret.findMany({ where: { id: { in: Array.from(secretIds) } }, select: { id: true, name: true } }) : [],
    ]);

    const userMap = new Map(users.map(u => [u.id, u.fullName || u.email || u.id]));
    const vaultMap = new Map(vaults.map(v => [v.id, v.name]));
    const secretMap = new Map(secrets.map(s => [s.id, s.name]));

    // Replace in metadata
    return events.map(event => {
      const enrichedEvent = { ...event };
      
      // Also enrich resourceName at the top level
      if (enrichedEvent.resourceType === 'VAULT') enrichedEvent.resourceName = vaultMap.get(enrichedEvent.resourceId) || enrichedEvent.resourceId;
      if (enrichedEvent.resourceType === 'SECRET') enrichedEvent.resourceName = secretMap.get(enrichedEvent.resourceId) || enrichedEvent.resourceId;
      
      if (enrichedEvent.metadata) {
        const meta = { ...(enrichedEvent.metadata as object) } as Record<string, any>;
        if (meta.vaultId && vaultMap.has(meta.vaultId)) { meta.vaultName = vaultMap.get(meta.vaultId); delete meta.vaultId; }
        if (meta.secretId && secretMap.has(meta.secretId)) { meta.secretName = secretMap.get(meta.secretId); delete meta.secretId; }
        if (meta.granteeId && userMap.has(meta.granteeId)) { meta.grantee = userMap.get(meta.granteeId); delete meta.granteeId; }
        if (meta.requesterId && userMap.has(meta.requesterId)) { meta.requester = userMap.get(meta.requesterId); delete meta.requesterId; }
        if (meta.resourceId) {
          if (secretMap.has(meta.resourceId)) { meta.resourceName = secretMap.get(meta.resourceId); delete meta.resourceId; }
          else if (vaultMap.has(meta.resourceId)) { meta.resourceName = vaultMap.get(meta.resourceId); delete meta.resourceId; }
        }
        enrichedEvent.metadata = meta;
      }
      return enrichedEvent;
    });
  }
}
