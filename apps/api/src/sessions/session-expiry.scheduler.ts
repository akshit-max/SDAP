import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IntegrationsService } from '../integrations/integrations.service';

/**
 * SessionExpiryScheduler
 *
 * Runs every 5 minutes and sweeps the DelegatedSession table for rows
 * that have passed their expiresAt timestamp but are still ACTIVE.
 *
 * For sessions bound to a native integration (Vercel, GitHub, etc.):
 *   1. Calls adapter.revokeAccess() to remove the user from the provider.
 *   2. Emits integration.access_revoked audit event.
 *   3. Marks session as EXPIRED.
 *
 * For plain secret/vault sessions:
 *   1. Marks session as EXPIRED directly.
 *
 * The sweep is idempotent — adapters handle already-removed gracefully.
 */
@Injectable()
export class SessionExpiryScheduler {
  private readonly logger = new Logger(SessionExpiryScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly integrationsService: IntegrationsService,
  ) {}

  /**
   * Runs every 5 minutes.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireStaleActiveSessions() {
    const now = new Date();

    // Fetch all ACTIVE sessions that have expired
    const staleSessions = await this.prisma.delegatedSession.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: now },
      },
      select: {
        id: true,
        organizationId: true,
        granteeId: true,
        integrationProvider: true,
        integrationResourceType: true,
        integrationResourceExternalId: true,
        integrationReferenceId: true,
        grantee: { select: { email: true } },
      },
    });

    if (staleSessions.length === 0) return;

    this.logger.log(`Session expiry sweep: found ${staleSessions.length} stale session(s)`);

    let expiredCount = 0;
    let revokedCount = 0;

    for (const session of staleSessions) {
      try {
        // ── Native Integration: revoke provider access first ──
        if (
          session.integrationProvider &&
          session.integrationResourceExternalId &&
          session.grantee?.email
        ) {
          try {
            await this.integrationsService.revokeAccess(
              session.organizationId,
              session.integrationProvider as any,
              {
                resourceId: session.integrationResourceExternalId,
                resourceType: session.integrationResourceType as any,
                principalEmail: session.grantee.email,
                referenceId: session.integrationReferenceId ?? undefined,
              },
            );

            // Emit a rich integration audit event
            this.eventEmitter.emit('audit.log', {
              organizationId: session.organizationId,
              actorId: null, // system action
              action: 'integration.access_revoked',
              resourceType: 'SESSION',
              resourceId: session.id,
              metadata: {
                provider: session.integrationProvider,
                resourceType: session.integrationResourceType,
                externalId: session.integrationResourceExternalId,
                username: session.grantee.email,
                reason: 'Session expired — automatic revocation',
              },
            });

            revokedCount++;
          } catch (revokeErr: unknown) {
            // Log failure but still mark session expired — don't block DB update
            this.logger.error(
              `[EXPIRY] Failed to revoke ${session.integrationProvider} access for session ${session.id}: ${(revokeErr as Error).message}`,
            );

            this.eventEmitter.emit('audit.log', {
              organizationId: session.organizationId,
              actorId: null,
              action: 'integration.access_failed',
              resourceType: 'SESSION',
              resourceId: session.id,
              metadata: {
                provider: session.integrationProvider,
                resourceType: session.integrationResourceType,
                externalId: session.integrationResourceExternalId,
                username: session.grantee.email,
                reason: `Auto-revoke failed: ${(revokeErr as Error).message}`,
              },
            });
          }
        }

        // ── Mark session EXPIRED in DB ──
        await this.prisma.delegatedSession.update({
          where: { id: session.id },
          data: { status: 'EXPIRED' },
        });

        expiredCount++;
      } catch (err: unknown) {
        this.logger.error(
          `[EXPIRY] Error processing session ${session.id}: ${(err as Error).message}`,
        );
      }
    }

    this.logger.log(
      `Session expiry sweep complete: ${expiredCount} expired, ${revokedCount} provider access(es) revoked`,
    );
  }
}
