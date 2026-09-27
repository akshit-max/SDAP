import {
  Injectable,
  NotFoundException,
  BadRequestException,
  BadGatewayException,
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
import { CreateSessionDto } from './dto/sessions.dto';
import { EntitlementService } from '../billing/subscription/entitlement.service';

export const INTEGRATIONS_SERVICE_TOKEN = 'INTEGRATIONS_SERVICE';

const MCA_TOP_LEVEL_MODULES = [
  'mca.master_data',
  'mca.llp_efiling',
  'mca.fo_services',
  'mca.dsc_services',
  'mca.company_efiling',
  'mca.complaints',
  'mca.document_related_services',
  'mca.payment_services',
  'mca.id_databank',
];

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
    @Optional()
    @Inject(INTEGRATIONS_SERVICE_TOKEN)
    private readonly integrationsService: any,
    // Injected optionally: BillingModule may not be available in test contexts.
    @Optional()
    private readonly entitlementService: EntitlementService,
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

    // ── Over-limit downgrade check (additive, before resource lookup) ───
    // If this org has expired from PRO/BUSINESS and now has > 2 active
    // members, block session creation until the owner removes excess members.
    // This also protects the approval→session path (ApprovalsService calls here).
    if (this.entitlementService) {
      await this.entitlementService.assertNotOverUserLimit(organizationId);
    }

    if (dto.scope === 'SECRET' && dto.resourceId) {
      const secret = await db.secret.findUnique({
        where: { id: dto.resourceId },
        include: { vault: true },
      });
      if (!secret || secret.vault.organizationId !== organizationId) {
        throw new NotFoundException('Secret not found in your organization.');
      }

      // ── Vault platform entitlement check (additive, before session creation) ──
      // Uses trusted DB value (secret.vault.platformId) — never client-supplied data.
      // PRO/BUSINESS returns immediately. FREE checks selectedPlatforms.
      if (this.entitlementService) {
        await this.entitlementService.assertVaultPlatformAllowed(
          organizationId,
          secret.vault.platformId ?? null,
        );
      }
    } else if (dto.scope === 'VAULT' && dto.resourceId) {
      const vault = await db.vault.findUnique({
        where: { id: dto.resourceId },
      });
      if (!vault || vault.organizationId !== organizationId) {
        throw new NotFoundException('Vault not found in your organization.');
      }

      // ── Vault platform entitlement check for VAULT-scoped sessions ──
      // resourceId IS the vaultId here — load platformId directly from trusted DB.
      if (this.entitlementService) {
        await this.entitlementService.assertVaultPlatformAllowed(
          organizationId,
          vault.platformId ?? null,
        );
      }
    } else if (dto.scope === 'INTEGRATION') {
      // Integration access bypasses vault verification
    }

    // ── Integration binding from DTO ────────────────────────────────────────
    const integrationProvider: string | undefined = (dto as any)
      .integrationProvider;
    const integrationResourceType: string | undefined = (dto as any)
      .integrationResourceType;
    const integrationResourceExternalId: string | undefined = (dto as any)
      .integrationResourceExternalId;
    const isIntegrationBound = !!(
      integrationProvider &&
      integrationResourceExternalId &&
      this.integrationsService
    );

    // ── Fix 1 & 3: Write DB record FIRST, then call provider ────────────────
    //
    // For integration-bound sessions, we always write with PENDING_GRANT status
    // using this.prisma (NOT the tx) so the row is committed to the DB
    // before any external API call. This guarantees:
    //   - If the provider call succeeds and the DB update fails → scheduler
    //     will see PENDING_GRANT and can clean up stale records.
    //   - If the provider call fails → we delete the row and throw, preventing
    //     an ACTIVE session from existing without real provider access.
    //
    // For non-integration sessions: use the tx client as before (atomic with parent).
    const sessionDb: any = isIntegrationBound ? this.prisma : db;

    const session = await sessionDb.delegatedSession.create({
      data: {
        organizationId,
        grantorId,
        granteeId: dto.granteeId,
        scope: (dto.scope || 'SECRET') as unknown as SessionScope,
        resourceId: dto.resourceId || 'integration',
        permission: dto.permission as unknown as SessionPermission,
        expiresAt: new Date(dto.expiresAt),
        maxReveals: dto.maxReveals,
        capabilities: dto.capabilities ?? null,
        // PENDING_GRANT for integration-backed, ACTIVE for plain vault/secret sessions
        status: isIntegrationBound ? 'PENDING_GRANT' : 'ACTIVE',
        integrationProvider: integrationProvider || null,
        integrationResourceType: isIntegrationBound
          ? integrationResourceType
          : null,
        integrationResourceExternalId: isIntegrationBound
          ? integrationResourceExternalId
          : null,
        integrationReferenceId: null,
      },
    });

    // ── Grant provider access (integration-bound only) ──────────────────────
    if (isIntegrationBound) {
      try {
        const grantee = await this.prisma.user.findUnique({
          where: { id: dto.granteeId },
          select: { id: true, email: true, providerProfiles: true },
        });

        if (!grantee?.email) {
          throw new Error('Grantee user not found or has no email address.');
        }

        let principalId = grantee.email;
        if (typeof this.integrationsService.resolvePrincipalId === 'function') {
          principalId = this.integrationsService.resolvePrincipalId(
            integrationProvider,
            grantee,
          );
        }

        let result;
        if (
          integrationProvider === 'GODADDY' ||
          integrationProvider === 'GMAIL'
        ) {
          // GoDaddy and Gmail use extension-based delegation — no programmatic provider grant.
          // The browser extension handles credential autofill on the platform's login page.
          // Session is created ACTIVE immediately; revocation/expiry control access going forward.
          result = {
            referenceId: `ext_${Date.now()}`,
            status: 'ACTIVE' as const,
          };
        } else {
          result = await this.integrationsService.grantAccess(
            organizationId,
            integrationProvider,
            {
              resourceId: integrationResourceExternalId,
              resourceType: integrationResourceType,
              principalEmail: principalId, // Passing the resolved principalId
              role: (dto as any).integrationRole,
            },
          );
        }

        // Provider confirmed — promote to ACTIVE and store reference ID
        const activeSession = await this.prisma.delegatedSession.update({
          where: { id: session.id },
          data: {
            status: 'ACTIVE',
            integrationReferenceId: result.referenceId,
          },
        });

        this.eventEmitter.emit('audit.log', {
          organizationId,
          actorId: grantorId,
          action: 'integration.access_granted',
          resourceType: 'SESSION',
          resourceId: session.id,
          metadata: {
            provider: integrationProvider,
            resourceType: integrationResourceType,
            externalId: integrationResourceExternalId,
            username: grantee.email,
            referenceId: result.referenceId,
            status: result.status,
          },
        });

        this.logger.log(
          `[SESSION] ${integrationProvider} access granted: ${grantee.email} → ${integrationResourceExternalId} (ref: ${result.referenceId})`,
        );

        this.eventEmitter.emit(
          'session.created',
          new DelegatedSessionCreatedEvent(
            session.id,
            organizationId,
            grantorId,
            dto.granteeId,
            dto.scope || 'SECRET',
            dto.resourceId || 'integration',
            integrationProvider,
            (dto as any).justification,
            dto.expiresAt,
          ),
        );

        return activeSession;
      } catch (err: unknown) {
        // Provider call failed — delete the PENDING_GRANT row so no orphan exists
        await this.prisma.delegatedSession
          .delete({ where: { id: session.id } })
          .catch((deleteErr) =>
            this.logger.error(
              `[SESSION] Failed to clean up PENDING_GRANT row ${session.id}: ${(deleteErr as Error).message}`,
            ),
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

        this.logger.error(
          `[SESSION] ${integrationProvider} grantAccess failed for ${integrationResourceExternalId}: ${(err as Error).message}`,
        );

        // Throw so the approval tx (if any) also rolls back
        throw new BadGatewayException(
          `${integrationProvider} access could not be granted: ${(err as Error).message}. Session not created.`,
        );
      }
    }

    // ── Non-integration session: already ACTIVE ─────────────────────────────
    this.eventEmitter.emit(
      'session.created',
      new DelegatedSessionCreatedEvent(
        session.id,
        organizationId,
        grantorId,
        dto.granteeId,
        dto.scope || 'SECRET',
        dto.resourceId || 'integration',
        integrationProvider,
        (dto as any).justification,
        dto.expiresAt,
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

    const enriched = await this.enrichSessionsWithResourceNames(sessions);

    return enriched.map((session) => {
      if (session.integrationProvider === 'MCA') {
        let mcaRestrictedModules: string[] = [];
        if (session.capabilities !== null) {
          const allowed = (session.capabilities as string[]) || [];
          mcaRestrictedModules = MCA_TOP_LEVEL_MODULES.filter(
            (mod) => !allowed.includes(mod),
          );
        }
        return { ...session, mcaRestrictedModules };
      }
      return session;
    });
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
   * Executes exactly 2 queries total regardless of list size.
   */
  private async enrichSessionsWithResourceNames<
    T extends { scope: string; resourceId: string },
  >(sessions: T[]) {
    const secretIds = sessions
      .filter((s) => s.scope === 'SECRET')
      .map((s) => s.resourceId);
    const vaultIds = sessions
      .filter((s) => s.scope === 'VAULT')
      .map((s) => s.resourceId);

    // Secrets: fetch name + parent vault's platformId (for authoritative extension matching)
    // Vaults:  fetch name + platformId directly
    const [secrets, vaults] = await Promise.all([
      secretIds.length > 0
        ? this.prisma.secret.findMany({
            where: { id: { in: secretIds } },
            select: {
              id: true,
              name: true,
              vault: { select: { platformId: true } },
            },
          })
        : [],
      vaultIds.length > 0
        ? this.prisma.vault.findMany({
            where: { id: { in: vaultIds } },
            select: { id: true, name: true, platformId: true },
          })
        : [],
    ]);

    const secretMap = new Map<
      string,
      { name: string; platformId: string | null }
    >(
      secrets.map((s) => [
        s.id,
        { name: s.name, platformId: (s as any).vault?.platformId ?? null },
      ]),
    );
    const vaultMap = new Map<
      string,
      { name: string; platformId: string | null }
    >(
      vaults.map((v) => [
        v.id,
        { name: v.name, platformId: (v as any).platformId ?? null },
      ]),
    );

    return sessions.map((s) => {
      const secretEntry = secretMap.get(s.resourceId);
      const vaultEntry = vaultMap.get(s.resourceId);
      return {
        ...s,
        resourceName:
          s.scope === 'SECRET'
            ? (secretEntry?.name ?? null)
            : s.scope === 'VAULT'
              ? (vaultEntry?.name ?? null)
              : s.scope === 'INTEGRATION'
                ? ((s as any).integrationProvider ?? null)
                : null,
        // Authoritative Vault platform identity — distinct from integrationProvider.
        // Populated for SECRET and VAULT scope sessions only.
        platformId:
          s.scope === 'SECRET'
            ? (secretEntry?.platformId ?? null)
            : s.scope === 'VAULT'
              ? (vaultEntry?.platformId ?? null)
              : null,
      };
    });
  }

  async revokeSession(
    organizationId: string,
    sessionId: string,
    userId: string,
  ) {
    const session = await this.prisma.delegatedSession.findUnique({
      where: { id: sessionId },
      include: {
        grantee: { select: { id: true, email: true, providerProfiles: true } },
      },
    });

    if (!session || session.organizationId !== organizationId) {
      throw new NotFoundException('Session not found.');
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    const isAuthorizedAdmin =
      membership &&
      (membership.role === 'ADMIN' || membership.role === 'OWNER');

    if (session.grantorId !== userId && !isAuthorizedAdmin) {
      if (session.granteeId === userId) {
        throw new ForbiddenException(
          'You cannot revoke a session granted to you.',
        );
      }
      throw new ForbiddenException(
        'You do not have permission to revoke this session.',
      );
    }

    if (session.status !== 'ACTIVE' && session.status !== 'REVOKE_FAILED') {
      throw new BadRequestException(
        `Cannot revoke a session that is ${session.status.toLowerCase()}.`,
      );
    }

    // ── Fix 2 & 4: Revoke provider access first; follow the state machine ──
    //
    // Success path: provider removal confirmed → REVOKED
    // Failure path: provider unreachable → REVOKE_FAILED (scheduler retries)
    //
    // We never mark REVOKED if the provider still has the collaborator.
    if (
      session.integrationProvider &&
      session.integrationResourceExternalId &&
      session.grantee?.email &&
      this.integrationsService
    ) {
      let principalId = session.grantee.email;
      if (typeof this.integrationsService.resolvePrincipalId === 'function') {
        principalId = this.integrationsService.resolvePrincipalId(
          session.integrationProvider,
          session.grantee,
        );
      }

      try {
        if (session.integrationProvider !== 'GODADDY') {
          await this.integrationsService.revokeAccess(
            organizationId,
            session.integrationProvider,
            {
              resourceId: session.integrationResourceExternalId,
              resourceType: session.integrationResourceType,
              principalEmail: principalId,
              referenceId: session.integrationReferenceId ?? undefined,
            },
          );
        }

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
            username: principalId,
            reason: 'Manual revocation by grantor/admin',
          },
        });

        this.logger.log(
          `[SESSION] ${session.integrationProvider} access revoked for session ${sessionId}`,
        );
      } catch (err: unknown) {
        // Provider call failed — record REVOKE_FAILED so scheduler retries
        this.logger.error(
          `[REVOKE] ${session.integrationProvider} revokeAccess failed for session ${sessionId}: ${(err as Error).message}`,
        );

        await this.prisma.delegatedSession.update({
          where: { id: sessionId },
          data: { status: 'REVOKE_FAILED' },
        });

        this.eventEmitter.emit('audit.log', {
          organizationId,
          actorId: userId,
          action: 'integration.access_failed',
          resourceType: 'SESSION',
          resourceId: sessionId,
          metadata: {
            provider: session.integrationProvider,
            reason: `Manual revoke failed: ${(err as Error).message}. Will retry automatically.`,
          },
        });

        // Return the pending state so the caller knows revocation was recorded
        return { ...session, status: 'REVOKE_FAILED' };
      }
    }

    // Provider confirmed (or no provider) — mark session definitively REVOKED
    const updated = await this.prisma.delegatedSession.update({
      where: { id: sessionId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedBy: userId,
      },
    });

    const durationSeconds = session.createdAt
      ? Math.floor((Date.now() - session.createdAt.getTime()) / 1000)
      : undefined;
    this.eventEmitter.emit(
      'session.revoked',
      new DelegatedSessionRevokedEvent(
        session.id,
        organizationId,
        userId,
        durationSeconds,
        session.integrationProvider ?? undefined,
        'Access revoked by admin',
      ),
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

    // validateSessionForReveal checks: granteeId, status, expiry, maxReveals,
    // AND permission === REVEAL. EXTENSION sessions are rejected here with 403.
    this.validationService.validateSessionForReveal(session, granteeId);

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

  /**
   * Retrieves plaintext credentials for the Browser Extension autofill flow.
   *
   * Access model:
   *   - EXTENSION sessions → allowed here (autofill only) ✅
   *   - REVEAL sessions    → also allowed here (they can still autofill) ✅
   *   - Neither session type unlocks the web-portal reveal (/reveal endpoint).
   *
   * Key differences from revealSecretViaSession():
   *   - Does NOT check permission === REVEAL — both EXTENSION and REVEAL sessions
   *     may be used by the browser extension for autofill.
   *   - Uses reason "Browser Extension Autofill" for audit distinction.
   *   - Still enforces: granteeId, status=ACTIVE, expiry, maxReveals (via validateSessionForUse).
   */
  async launchSessionForExtension(
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

    // validateSessionForUse enforces: granteeId match, ACTIVE status, expiry, maxReveals.
    // It does NOT check permission — both EXTENSION and REVEAL sessions are valid for autofill.
    this.validationService.validateSessionForUse(session, granteeId);

    if (session.scope !== 'SECRET') {
      throw new BadRequestException(
        'Session must be scoped to a SECRET to launch autofill.',
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
          'Concurrent autofill detected or session modified. Please try again.',
        );
      }

      const plaintext = await this.secretLifecycleService.revealSecret(
        {
          organizationId,
          secretId: lockedSession.resourceId,
          userId: granteeId,
          reason: `Browser Extension Autofill: ${reason}`,
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

  /**
   * Returns all delegated sessions where the given userId is the grantee.
   * Used by admins to see what access has been granted to a specific member.
   */
  async getSessionsByGrantee(organizationId: string, granteeId: string) {
    const sessions = await this.prisma.delegatedSession.findMany({
      where: { organizationId, granteeId },
      orderBy: { createdAt: 'desc' },
      include: {
        grantor: { select: { email: true, fullName: true } },
      },
    });
    return this.enrichSessionsWithResourceNames(sessions);
  }

  /**
   * Revokes all ACTIVE delegated sessions for a specific grantee in the org.
   * Vault/Secret sessions are revoked directly; integration sessions use the
   * existing per-session revoke path so provider cleanup is triggered correctly.
   * Returns a summary: { revokedCount, skippedCount }.
   */
  async revokeAllForGrantee(
    organizationId: string,
    granteeId: string,
    adminId: string,
  ) {
    // Fetch only sessions in revocable states
    const sessions = await this.prisma.delegatedSession.findMany({
      where: {
        organizationId,
        granteeId,
        status: { in: ['ACTIVE', 'REVOKE_FAILED'] },
      },
      include: {
        grantee: { select: { id: true, email: true, providerProfiles: true } },
      },
    });

    if (sessions.length === 0) {
      return { revokedCount: 0, skippedCount: 0 };
    }

    let revokedCount = 0;
    let skippedCount = 0;

    for (const session of sessions) {
      try {
        await this.revokeSession(organizationId, session.id, adminId);
        revokedCount++;
      } catch {
        // Individual revoke failures are non-fatal for the bulk operation
        skippedCount++;
      }
    }

    this.eventEmitter.emit('audit.log', {
      organizationId,
      actorId: adminId,
      action: 'session.revoke_all',
      resourceType: 'USER',
      resourceId: granteeId,
      metadata: { revokedCount, skippedCount },
    });

    return { revokedCount, skippedCount };
  }
}
