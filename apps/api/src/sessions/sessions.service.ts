import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Optional,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SessionValidationService } from './session-validation.service';
import { Prisma, SessionScope, SessionPermission } from '@prisma/client';
import { SecretLifecycleService } from '../vaults/secret-lifecycle.service';
import { DelegatedSessionCreatedEvent } from './events/session-created.event';
import { DelegatedSessionRevokedEvent } from './events/session-revoked.event';
import { CreateSessionDto } from '@repo/types';

export const INTEGRATIONS_SERVICE_TOKEN = 'INTEGRATIONS_SERVICE';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly validationService: SessionValidationService,
    private readonly secretLifecycleService: SecretLifecycleService,
    // Injected optionally to avoid circular dependency at startup.
    // The IntegrationsModule exports IntegrationsService; SessionsModule imports it via forwardRef.
    @Optional() @Inject(INTEGRATIONS_SERVICE_TOKEN) private readonly integrationsService: any,
  ) {}

  async createSession(
    organizationId: string,
    grantorId: string,
    dto: CreateSessionDto,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;
    if (dto.expiresAt <= new Date()) {
      throw new BadRequestException('Expiration date must be in the future.');
    }

    if (dto.maxReveals !== undefined && dto.maxReveals <= 0) {
      throw new BadRequestException('maxReveals must be strictly positive.');
    }

    // Verify resource ownership
    if (dto.scope === 'SECRET') {
      const secret = await db.secret.findUnique({
        where: { id: dto.resourceId },
        include: { vault: true },
      });
      if (!secret || secret.vault.organizationId !== organizationId) {
        throw new NotFoundException('Secret not found in your organization.');
      }
    } else if (dto.scope === 'VAULT') {
      const vault = await db.vault.findUnique({
        where: { id: dto.resourceId },
      });
      if (!vault || vault.organizationId !== organizationId) {
        throw new NotFoundException('Vault not found in your organization.');
      }
    }

    // ── Integration binding from DTO ────────────────────────────────────────
    // The session DTO may carry integration context when the request was
    // submitted via the integrations flow (e.g. "grant Vercel team access").
    const integrationProvider: string | undefined = (dto as any).integrationProvider;
    const integrationResourceType: string | undefined = (dto as any).integrationResourceType;
    const integrationResourceExternalId: string | undefined = (dto as any).integrationResourceExternalId;

    // ── Grant provider access if integration is bound ───────────────────────
    let integrationReferenceId: string | undefined;

    if (integrationProvider && integrationResourceExternalId && this.integrationsService) {
      try {
        // Look up the grantee's email to pass to the provider
        const grantee = await db.user.findUnique({
          where: { id: dto.granteeId },
          select: { email: true },
        });

        if (grantee?.email) {
          const result = await this.integrationsService.grantAccess(
            organizationId,
            integrationProvider,
            {
              resourceId: integrationResourceExternalId,
              resourceType: integrationResourceType,
              principalEmail: grantee.email,
              role: (dto as any).integrationRole,
            },
          );

          integrationReferenceId = result.referenceId;

          this.eventEmitter.emit('audit.log', {
            organizationId,
            actorId: grantorId,
            action: 'integration.access_granted',
            resourceType: 'SESSION',
            metadata: {
              provider: integrationProvider,
              resourceType: integrationResourceType,
              externalId: integrationResourceExternalId,
              username: grantee.email,
              referenceId: integrationReferenceId,
              status: result.status,
            },
          });

          this.logger.log(
            `[SESSION] ${integrationProvider} access granted: ${grantee.email} → ${integrationResourceExternalId} (ref: ${integrationReferenceId})`,
          );
        }
      } catch (err: unknown) {
        // Emit a failure audit event but don't block session creation
        this.logger.error(
          `[SESSION] Failed to grant ${integrationProvider} access: ${(err as Error).message}`,
        );

        this.eventEmitter.emit('audit.log', {
          organizationId,
          actorId: grantorId,
          action: 'integration.access_failed',
          resourceType: 'SESSION',
          metadata: {
            provider: integrationProvider,
            externalId: integrationResourceExternalId,
            reason: (err as Error).message,
          },
        });
      }
    }

    const session = await db.delegatedSession.create({
      data: {
        organizationId,
        grantorId,
        granteeId: dto.granteeId,
        scope: dto.scope as unknown as SessionScope,
        resourceId: dto.resourceId,
        permission: dto.permission as unknown as SessionPermission,
        expiresAt: new Date(dto.expiresAt),
        maxReveals: dto.maxReveals,
        status: 'ACTIVE',
        // Integration binding — stored for deterministic revocation
        integrationProvider: integrationProvider ?? null,
        integrationResourceType: integrationResourceType ?? null,
        integrationResourceExternalId: integrationResourceExternalId ?? null,
        integrationReferenceId: integrationReferenceId ?? null,
      },
    });

    this.eventEmitter.emit(
      'session.created',
      new DelegatedSessionCreatedEvent(
        session.id,
        organizationId,
        grantorId,
        dto.granteeId,
        dto.scope,
        dto.resourceId,
      ),
    );

    return session;
  }

  async getIncomingSessions(organizationId: string, userId: string) {
    const where: any = { granteeId: userId };
    if (organizationId) {
      where.organizationId = organizationId;
    }
    const sessions = await this.prisma.delegatedSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        grantor: { select: { email: true, fullName: true } },
      },
    });
    return this.enrichSessionsWithResourceNames(sessions);
  }

  async getOutgoingSessions(organizationId: string, userId: string) {
    const sessions = await this.prisma.delegatedSession.findMany({
      where: { organizationId, grantorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        grantee: { select: { email: true, fullName: true } },
      },
    });
    return this.enrichSessionsWithResourceNames(sessions);
  }

  /**
   * Batch-enriches a list of sessions with their resource names.
   */
  private async enrichSessionsWithResourceNames<T extends { scope: string; resourceId: string }>(sessions: T[]) {
    const secretIds = sessions.filter(s => s.scope === 'SECRET').map(s => s.resourceId);
    const vaultIds = sessions.filter(s => s.scope === 'VAULT').map(s => s.resourceId);

    const [secrets, vaults] = await Promise.all([
      secretIds.length > 0
        ? this.prisma.secret.findMany({ where: { id: { in: secretIds } }, select: { id: true, name: true } })
        : [],
      vaultIds.length > 0
        ? this.prisma.vault.findMany({ where: { id: { in: vaultIds } }, select: { id: true, name: true } })
        : [],
    ]);

    const secretMap = new Map(secrets.map(s => [s.id, s.name]));
    const vaultMap = new Map(vaults.map(v => [v.id, v.name]));

    return sessions.map(s => ({
      ...s,
      resourceName:
        s.scope === 'SECRET'
          ? (secretMap.get(s.resourceId) ?? null)
          : s.scope === 'VAULT'
            ? (vaultMap.get(s.resourceId) ?? null)
            : null,
    }));
  }

  async revokeSession(
    organizationId: string,
    sessionId: string,
    userId: string,
  ) {
    const session = await this.prisma.delegatedSession.findUnique({
      where: { id: sessionId },
      include: { grantee: { select: { email: true } } },
    });

    if (!session || session.organizationId !== organizationId) {
      throw new NotFoundException('Session not found.');
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } }
    });
    const isAuthorizedAdmin = membership && (membership.role === 'ADMIN' || membership.role === 'OWNER');

    if (session.grantorId !== userId && !isAuthorizedAdmin) {
      if (session.granteeId === userId) {
        throw new ForbiddenException('You cannot revoke a session granted to you.');
      }
      throw new ForbiddenException('You do not have permission to revoke this session.');
    }

    if (session.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Cannot revoke a session that is ${session.status.toLowerCase()}.`,
      );
    }

    // ── Revoke provider access if integration-bound ───────────────────────
    if (
      session.integrationProvider &&
      session.integrationResourceExternalId &&
      session.grantee?.email &&
      this.integrationsService
    ) {
      try {
        await this.integrationsService.revokeAccess(
          organizationId,
          session.integrationProvider,
          {
            resourceId: session.integrationResourceExternalId,
            resourceType: session.integrationResourceType,
            principalEmail: session.grantee.email,
            referenceId: session.integrationReferenceId ?? undefined,
          },
        );

        this.eventEmitter.emit('audit.log', {
          organizationId,
          actorId: userId,
          action: 'integration.access_revoked',
          resourceType: 'SESSION',
          resourceId: sessionId,
          metadata: {
            provider: session.integrationProvider,
            resourceType: session.integrationResourceType,
            externalId: session.integrationResourceExternalId,
            username: session.grantee.email,
            reason: 'Manual revocation by grantor/admin',
          },
        });
      } catch (err: unknown) {
        this.logger.error(
          `[REVOKE] Failed to remove ${session.integrationProvider} access for session ${sessionId}: ${(err as Error).message}`,
        );
        // Don't block the revocation — mark the session revoked anyway
        this.eventEmitter.emit('audit.log', {
          organizationId,
          actorId: userId,
          action: 'integration.access_failed',
          resourceType: 'SESSION',
          resourceId: sessionId,
          metadata: {
            provider: session.integrationProvider,
            reason: `Manual revoke failed: ${(err as Error).message}`,
          },
        });
      }
    }

    const updated = await this.prisma.delegatedSession.update({
      where: { id: sessionId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedBy: userId,
      },
    });

    this.eventEmitter.emit(
      'session.revoked',
      new DelegatedSessionRevokedEvent(session.id, organizationId, userId),
    );

    return updated;
  }

  async revealSecretViaSession(
    organizationId: string,
    sessionId: string,
    granteeId: string,
    reason: string,
  ) {
    const session = await this.prisma.delegatedSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.organizationId !== organizationId) {
      throw new NotFoundException('Session not found.');
    }

    this.validationService.validateSessionForUse(session, granteeId);

    if (session.scope !== 'SECRET') {
      throw new BadRequestException(
        'Session must be scoped to a SECRET to reveal it directly. Vault scoped sessions require secret ID.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const lockedSession = await tx.delegatedSession.findUniqueOrThrow({
        where: { id: sessionId },
      });

      this.validationService.validateSessionForUse(lockedSession, granteeId);

      const updateResult = await tx.delegatedSession.updateMany({
        where: {
          id: sessionId,
          revealCount: lockedSession.revealCount,
        },
        data: {
          revealCount: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        throw new BadRequestException(
          'Concurrent reveal detected or session modified. Please try again.',
        );
      }

      const plaintext = await this.secretLifecycleService.revealSecret(
        {
          organizationId,
          secretId: lockedSession.resourceId,
          userId: granteeId,
          reason: `Session Reveal: ${reason}`,
        },
        undefined,
        tx,
      );

      if (
        lockedSession.maxReveals !== null &&
        lockedSession.revealCount + 1 >= lockedSession.maxReveals
      ) {
        await tx.delegatedSession.update({
          where: { id: sessionId },
          data: { status: 'EXPIRED' },
        });
      }

      return plaintext;
    });
  }
}
