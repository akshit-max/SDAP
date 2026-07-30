import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SessionValidationService } from './session-validation.service';
import { Prisma } from '@prisma/client';
import { SecretLifecycleService } from '../vaults/secret-lifecycle.service';
import { DelegatedSessionCreatedEvent } from './events/session-created.event';
import { DelegatedSessionRevokedEvent } from './events/session-revoked.event';
import { CreateSessionDto } from '@repo/types';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly validationService: SessionValidationService,
    private readonly secretLifecycleService: SecretLifecycleService,
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

    const session = await db.delegatedSession.create({
      data: {
        organizationId,
        grantorId,
        granteeId: dto.granteeId,
        scope: dto.scope as any, // Prisma mapping
        resourceId: dto.resourceId,
        permission: dto.permission as any,
        expiresAt: new Date(dto.expiresAt),
        maxReveals: dto.maxReveals,
        status: 'ACTIVE',
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
    const sessions = await this.prisma.delegatedSession.findMany({
      where: { granteeId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        grantor: { select: { email: true, fullName: true } },
      },
    });

    // Enrich with resource names
    return Promise.all(
      sessions.map(async (s) => {
        let resourceName: string | null = null;
        if (s.scope === 'SECRET') {
          const secret = await this.prisma.secret.findUnique({ where: { id: s.resourceId }, select: { name: true } });
          resourceName = secret?.name ?? null;
        } else if (s.scope === 'VAULT') {
          const vault = await this.prisma.vault.findUnique({ where: { id: s.resourceId }, select: { name: true } });
          resourceName = vault?.name ?? null;
        }
        return { ...s, resourceName };
      }),
    );
  }

  async getOutgoingSessions(organizationId: string, userId: string) {
    const sessions = await this.prisma.delegatedSession.findMany({
      where: { organizationId, grantorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        grantee: { select: { email: true, fullName: true } },
      },
    });

    return Promise.all(
      sessions.map(async (s) => {
        let resourceName: string | null = null;
        if (s.scope === 'SECRET') {
          const secret = await this.prisma.secret.findUnique({ where: { id: s.resourceId }, select: { name: true } });
          resourceName = secret?.name ?? null;
        } else if (s.scope === 'VAULT') {
          const vault = await this.prisma.vault.findUnique({ where: { id: s.resourceId }, select: { name: true } });
          resourceName = vault?.name ?? null;
        }
        return { ...s, resourceName };
      }),
    );
  }

  async revokeSession(
    organizationId: string,
    sessionId: string,
    userId: string,
  ) {
    const session = await this.prisma.delegatedSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.organizationId !== organizationId) {
      throw new NotFoundException('Session not found.');
    }

    if (session.grantorId !== userId) {
      throw new BadRequestException(
        'You can only revoke sessions you created.',
      );
    }

    if (session.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Cannot revoke a session that is ${session.status.toLowerCase()}.`,
      );
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
    // 1. Fetch Session
    const session = await this.prisma.delegatedSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.organizationId !== organizationId) {
      throw new NotFoundException('Session not found.');
    }

    // 2. Validate Session
    this.validationService.validateSessionForUse(session, granteeId);

    // Ensure it targets a secret specifically. If it targets a vault, we would need the secretId passed in.
    // To keep it simple, Phase 5 reveals require the session to strictly target a SECRET.
    if (session.scope !== 'SECRET') {
      throw new BadRequestException(
        'Session must be scoped to a SECRET to reveal it directly. Vault scoped sessions require secret ID.',
      );
    }

    // 3. Delegate to SecretLifecycleService using Prisma transaction to atomically increment reveal count
    return this.prisma.$transaction(async (tx) => {
      // Re-fetch with lock
      const lockedSession = await tx.delegatedSession.findUniqueOrThrow({
        where: { id: sessionId },
      });

      this.validationService.validateSessionForUse(lockedSession, granteeId);

      // 4. Increment Reveal Count via Optimistic Concurrency (or direct increment if possible)
      // Prisma's `increment` is atomic in the database, meaning `UPDATE ... SET revealCount = revealCount + 1`
      // However, to strictly prevent TOCTOU against `maxReveals`, we should use a WHERE clause with the current count.
      const updateResult = await tx.delegatedSession.updateMany({
        where: {
          id: sessionId,
          revealCount: lockedSession.revealCount, // Optimistic Concurrency Check
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

      // Call SecretLifecycleService, passing the transaction to guarantee atomicity
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

      // 5. Auto-expire if max reached
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
