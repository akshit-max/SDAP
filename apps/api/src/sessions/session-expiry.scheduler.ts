import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * SessionExpiryScheduler
 *
 * Runs every 5 minutes and sweeps the DelegatedSession table for rows
 * that have passed their expiresAt timestamp but are still ACTIVE.
 *
 * Why a scheduler instead of on-demand validation:
 *   SessionValidationService already rejects reveal attempts on expired
 *   sessions. However, without this sweep, sessions remain ACTIVE in
 *   the database indefinitely, causing the Sessions UI to show misleading
 *   state and misrepresenting the audit record.
 *
 * Architectural contract: This scheduler ONLY transitions ACTIVE → EXPIRED.
 * It never touches REVOKED, already-EXPIRED, or PENDING_APPROVAL sessions.
 * The sweep is idempotent — running it twice has no effect.
 *
 * Blast radius: Writes only to the status column of DelegatedSession.
 * Cannot affect secret encryption, audit events, or active reveal operations.
 */
@Injectable()
export class SessionExpiryScheduler {
  private readonly logger = new Logger(SessionExpiryScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Runs every 5 minutes.
   * In development, sessions expire quickly so a 5-minute sweep is fine.
   * In production at scale, consider moving to a DB-level trigger or
   * a queue-backed approach for efficiency.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireStaleActiveSessions() {
    const now = new Date();

    const result = await this.prisma.delegatedSession.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: now },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    if (result.count > 0) {
      this.logger.log(
        `Session expiry sweep: marked ${result.count} session(s) as EXPIRED`,
      );
    }
  }
}
