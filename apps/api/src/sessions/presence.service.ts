import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Presence is considered ACTIVE if the last heartbeat was within this window.
// 90 seconds = 3 missed alarm cycles (Chrome floor = 30s/cycle).
const ACTIVE_WINDOW_MS = 90_000;

export interface PresenceRecord {
  userId: string;
  platform: string;
  lastSeenAt: Date;
  /** Computed at query time — true if lastSeenAt is within the active window */
  isActive: boolean;
}

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a heartbeat for the authenticated user within an organization.
   *
   * Authorization gate (per user review — Point 1):
   *   Presence is only recorded when the user has at least one ACTIVE delegated
   *   session in this organization whose resource name matches the reported
   *   platform. This server-side check ties monitoring to the WithUs
   *   authorization model — the extension cannot spoof presence for an
   *   unauthorized platform.
   *
   * Returns true if recorded, false if rejected (no authorized session).
   * Errors are caught and logged — this method is always non-blocking.
   */
  async recordHeartbeat(
    organizationId: string,
    userId: string,
    platform: string,
  ): Promise<boolean> {
    try {
      // ── Authorization gate ──────────────────────────────────────────────────
      // Fetch all ACTIVE non-expired sessions granted to this user in this org.
      const activeSessions = await this.prisma.delegatedSession.findMany({
        where: {
          organizationId,
          granteeId: userId,
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
        },
        select: { id: true, resourceId: true },
      });

      if (activeSessions.length === 0) {
        this.logger.debug(
          `Heartbeat rejected: no active sessions for user ${userId} in org ${organizationId}`,
        );
        return false;
      }

      // Resolve the secret names for each session's resourceId
      const secrets = await this.prisma.secret.findMany({
        where: {
          id: { in: activeSessions.map((s) => s.resourceId) },
          deletedAt: null,
        },
        select: { id: true, name: true },
      });

      const platformLower = platform.toLowerCase();

      // Bidirectional substring match — mirrors the extension's session discovery
      // logic so the same sessions that trigger autofill also validate presence.
      const hasAuthorizedSession = secrets.some((s) => {
        const name = s.name.toLowerCase();
        return name.includes(platformLower) || platformLower.includes(name);
      });

      if (!hasAuthorizedSession) {
        this.logger.debug(
          `Heartbeat rejected: platform "${platform}" not authorized for user ${userId} in org ${organizationId}`,
        );
        return false;
      }

      // Record the ID of the first matching session for auditability.
      // This FK is nullable — presence does not depend on any specific session.
      const matchedSessionId = activeSessions[0]?.id ?? null;

      // ── UPSERT presence record ──────────────────────────────────────────────
      // @@unique([organizationId, userId, platform]) guarantees one row per user
      // per org per platform — multiple active platforms produce separate rows.
      // lastSeenAt is set by Prisma's @updatedAt on every update.
      await this.prisma.userPresence.upsert({
        where: {
          organizationId_userId_platform: { organizationId, userId, platform },
        },
        update: {
          sessionId: matchedSessionId,
          // lastSeenAt updated automatically by @updatedAt
        },
        create: {
          organizationId,
          userId,
          platform,
          sessionId: matchedSessionId,
        },
      });

      return true;
    } catch (err) {
      // Non-blocking: log and return false. The controller swallows this so
      // heartbeat failures never interrupt autofill, session, or auth flows.
      this.logger.error('Heartbeat UPSERT failed (non-fatal)', err);
      return false;
    }
  }

  /**
   * Return presence status for all members of an organization.
   * isActive is computed at query time: lastSeenAt within the last 90 seconds.
   * Only ADMIN/OWNER callers should reach this — RBAC enforced in the controller.
   */
  async getOrgPresence(organizationId: string): Promise<PresenceRecord[]> {
    const records = await this.prisma.userPresence.findMany({
      where: { organizationId },
      select: {
        userId: true,
        platform: true,
        lastSeenAt: true,
      },
    });

    const now = Date.now();
    return records.map((r) => ({
      userId: r.userId,
      platform: r.platform,
      lastSeenAt: r.lastSeenAt,
      isActive: now - r.lastSeenAt.getTime() <= ACTIVE_WINDOW_MS,
    }));
  }
}
