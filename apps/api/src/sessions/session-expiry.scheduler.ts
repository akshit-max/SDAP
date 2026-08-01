import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IntegrationsService } from '../integrations/integrations.service';

/**
 * SessionExpiryScheduler
 *
 * Runs every 5 minutes and handles three sweep types:
 *
 * Sweep 1 — Expire stale ACTIVE sessions
 *   For integration-bound sessions: call adapter.revokeAccess() first.
 *     Success → EXPIRED
 *     Failure → REVOKE_FAILED (scheduler retries next sweep)
 *   For plain sessions: mark EXPIRED immediately.
 *
 * Sweep 2 — Retry REVOKE_FAILED sessions
 *   Retry revokeAccess() for sessions that previously failed.
 *     Success → EXPIRED + audit
 *     Still failing → stays REVOKE_FAILED for next sweep
 *
 * Sweep 3 — Clean up stale PENDING_GRANT sessions
 *   If a session has been PENDING_GRANT for more than 10 minutes,
 *   it means the process crashed between the DB write and the provider call.
 *   Delete the orphaned row so it never becomes visible.
 *
 * All adapter calls are idempotent. A 404 (already removed) is treated as success.
 */
@Injectable()
export class SessionExpiryScheduler {
  private readonly logger = new Logger(SessionExpiryScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly integrationsService: IntegrationsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runExpirySweep() {
    await Promise.allSettled([
      this.expireStaleActiveSessions(),
      this.retryRevokeFailed(),
      this.cleanupStalePendingGrant(),
    ]);
  }

  // ─── Sweep 1: Expire stale ACTIVE sessions ─────────────────────────────────

  private async expireStaleActiveSessions() {
    const now = new Date();

    const staleSessions = await this.prisma.delegatedSession.findMany({
      where: { status: 'ACTIVE', expiresAt: { lt: now } },
      take: 50, // process in batches — remainder handled next sweep
      select: {
        id: true,
        organizationId: true,
        integrationProvider: true,
        integrationResourceType: true,
        integrationResourceExternalId: true,
        integrationReferenceId: true,
        grantee: { select: { email: true, providerProfiles: true } },
      },
    });

    if (staleSessions.length === 0) return;

    this.logger.log(`[EXPIRY] Sweep 1: ${staleSessions.length} stale ACTIVE session(s)`);

    for (const session of staleSessions) {
      await this.revokeAndExpire(session, 'Session expired — automatic revocation');
    }
  }

  // ─── Sweep 2: Retry REVOKE_FAILED sessions ─────────────────────────────────

  private async retryRevokeFailed() {
    const failedSessions = await this.prisma.delegatedSession.findMany({
      where: { status: 'REVOKE_FAILED' },
      take: 50,
      select: {
        id: true,
        organizationId: true,
        integrationProvider: true,
        integrationResourceType: true,
        integrationResourceExternalId: true,
        integrationReferenceId: true,
        grantee: { select: { email: true, providerProfiles: true } },
      },
    });

    if (failedSessions.length === 0) return;

    this.logger.log(`[EXPIRY] Sweep 2: retrying ${failedSessions.length} REVOKE_FAILED session(s)`);

    for (const session of failedSessions) {
      await this.revokeAndExpire(session, 'Retry: revocation from previous failed attempt');
    }
  }

  // ─── Sweep 3: Clean up stale PENDING_GRANT rows ────────────────────────────

  private async cleanupStalePendingGrant() {
    const staleThreshold = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago

    const stale = await this.prisma.delegatedSession.findMany({
      where: { status: 'PENDING_GRANT', createdAt: { lt: staleThreshold } },
      take: 50,
      select: { id: true, organizationId: true, integrationProvider: true },
    });

    if (stale.length === 0) return;

    this.logger.warn(
      `[EXPIRY] Sweep 3: deleting ${stale.length} stale PENDING_GRANT row(s) (process likely crashed during grant)`,
    );

    for (const session of stale) {
      try {
        await this.prisma.delegatedSession.delete({ where: { id: session.id } });

        this.eventEmitter.emit('audit.log', {
          organizationId: session.organizationId,
          actorId: null,
          action: 'session.grant_abandoned',
          resourceType: 'SESSION',
          resourceId: session.id,
          metadata: {
            provider: session.integrationProvider,
            reason: 'PENDING_GRANT row older than 10 minutes — process likely crashed',
          },
        });
      } catch (err: unknown) {
        this.logger.error(`[EXPIRY] Failed to delete stale PENDING_GRANT row ${session.id}: ${(err as Error).message}`);
      }
    }
  }

  // ─── Shared revoke + expire logic ──────────────────────────────────────────

  private async revokeAndExpire(
    session: {
      id: string;
      organizationId: string;
      integrationProvider: string | null;
      integrationResourceType: string | null;
      integrationResourceExternalId: string | null;
      integrationReferenceId: string | null;
      grantee: { email: string; providerProfiles?: any } | null;
    },
    auditReason: string,
  ) {
    const isIntegrationBound =
      session.integrationProvider &&
      session.integrationResourceExternalId &&
      session.grantee?.email;

    if (isIntegrationBound) {
      let principalId = session.grantee!.email;
      if (session.integrationProvider === 'GITHUB') {
        const githubUsername = (session.grantee!.providerProfiles as any)?.githubUsername;
        if (githubUsername) {
          principalId = githubUsername;
        } else {
          this.logger.warn(`[EXPIRY] Session ${session.id}: Grantee has no GitHub username. Falling back to email.`);
        }
      }

      try {
        await this.integrationsService.revokeAccess(
          session.organizationId,
          session.integrationProvider as any,
          {
            resourceId: session.integrationResourceExternalId!,
            resourceType: session.integrationResourceType ?? undefined,
            principalEmail: principalId,
            referenceId: session.integrationReferenceId ?? undefined,
          },
        );

        // Provider confirmed removal — now safe to mark EXPIRED
        await this.prisma.delegatedSession.update({
          where: { id: session.id },
          data: { status: 'EXPIRED' },
        });

        this.eventEmitter.emit('audit.log', {
          organizationId: session.organizationId,
          actorId: null,
          action: 'integration.access_revoked',
          resourceType: 'SESSION',
          resourceId: session.id,
          metadata: {
            provider: session.integrationProvider,
            resourceType: session.integrationResourceType,
            externalId: session.integrationResourceExternalId,
            username: principalId,
            reason: auditReason,
          },
        });

        this.logger.log(`[EXPIRY] Session ${session.id} revoked on ${session.integrationProvider} → EXPIRED`);

      } catch (revokeErr: unknown) {
        // Provider unreachable — do NOT mark EXPIRED. Set REVOKE_FAILED so next sweep retries.
        this.logger.error(
          `[EXPIRY] revokeAccess failed for session ${session.id} on ${session.integrationProvider}: ${(revokeErr as Error).message} → REVOKE_FAILED`,
        );

        await this.prisma.delegatedSession.update({
          where: { id: session.id },
          data: { status: 'REVOKE_FAILED' },
        });

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
            username: principalId,
            reason: `Auto-revoke failed: ${(revokeErr as Error).message}. Will retry.`,
          },
        });
      }

    } else {
      // Plain vault/secret session — no provider to call, expire directly
      try {
        await this.prisma.delegatedSession.update({
          where: { id: session.id },
          data: { status: 'EXPIRED' },
        });
      } catch (err: unknown) {
        this.logger.error(`[EXPIRY] Failed to expire session ${session.id}: ${(err as Error).message}`);
      }
    }
  }
}
