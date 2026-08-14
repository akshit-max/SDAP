import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditListenerService {
  private readonly logger = new Logger(AuditListenerService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async persistEvent(
    organizationId: string,
    action: string,
    actorId: string | null,
    resourceType: string | null,
    resourceId: string | null,
    metadata: any = {},
  ) {
    try {
      await this.prisma.auditEvent.create({
        data: {
          organizationId,
          action,
          actorId,
          resourceType,
          resourceId,
          metadata,
          eventVersion: 1,
        },
      });
    } catch (error) {
      // Non-blocking: log the failure but do not throw
      this.logger.error(`Failed to persist audit event [${action}]`, error);
    }
  }

  @OnEvent('secret.created')
  async handleSecretCreated(event: any) {
    await this.persistEvent(
      event.organizationId,
      'secret.created',
      event.actorId,
      'SECRET',
      event.secretId,
      { vaultId: event.vaultId },
    );
  }

  @OnEvent('secret.updated')
  async handleSecretUpdated(event: any) {
    await this.persistEvent(
      event.organizationId,
      'secret.updated',
      event.actorId,
      'SECRET',
      event.secretId,
      { vaultId: event.vaultId },
    );
  }

  @OnEvent('secret.deleted')
  async handleSecretDeleted(event: any) {
    await this.persistEvent(
      event.organizationId,
      'secret.deleted',
      event.actorId,
      'SECRET',
      event.secretId,
      { vaultId: event.vaultId },
    );
  }

  @OnEvent('secret.reveal.succeeded')
  async handleSecretRevealed(event: any) {
    await this.persistEvent(
      event.organizationId,
      'secret.revealed',
      event.actorId,
      'SECRET',
      event.secretId,
      { vaultId: event.vaultId },
    );
  }

  @OnEvent('session.created')
  async handleSessionCreated(event: any) {
    await this.persistEvent(
      event.organizationId,
      'session.created',
      event.grantorId,
      'DELEGATED_SESSION',
      event.sessionId,
      {
        granteeId: event.granteeId,
        scope: event.scope,
        resourceId: event.resourceId,
        ...(event.platform ? { platform: event.platform } : {}),
        ...(event.reason ? { reason: event.reason } : {}),
        ...(event.expiresAt ? { expiresAt: event.expiresAt } : {}),
      },
    );
  }

  @OnEvent('session.revoked')
  async handleSessionRevoked(event: any) {
    await this.persistEvent(
      event.organizationId,
      'session.revoked',
      event.revokedByUserId,
      'DELEGATED_SESSION',
      event.sessionId,
      {
        ...(event.durationSeconds !== undefined ? { durationSeconds: event.durationSeconds } : {}),
      },
    );
  }

  @OnEvent('session.expired')
  async handleSessionExpired(event: any) {
    await this.persistEvent(
      event.organizationId,
      'session.expired',
      null,
      'DELEGATED_SESSION',
      event.sessionId,
      { durationSeconds: event.durationSeconds },
    );
  }

  @OnEvent('approval.requested')
  async handleApprovalRequested(event: any) {
    await this.persistEvent(
      event.organizationId,
      'approval.requested',
      event.requesterId,
      'APPROVAL_REQUEST',
      event.approvalId,
      { type: event.type, payload: event.requestPayload },
    );
  }

  @OnEvent('approval.approved')
  async handleApprovalApproved(event: any) {
    await this.persistEvent(
      event.organizationId,
      'approval.approved',
      event.resolvedByUserId,
      'APPROVAL_REQUEST',
      event.approvalId,
      { reason: event.reason },
    );
  }

  @OnEvent('approval.rejected')
  async handleApprovalRejected(event: any) {
    await this.persistEvent(
      event.organizationId,
      'approval.rejected',
      event.resolvedByUserId,
      'APPROVAL_REQUEST',
      event.approvalId,
      { reason: event.reason },
    );
  }

  // ─── Integration Events ───────────────────────────────────────────────────

  /**
   * Generic passthrough handler: services emit 'audit.log' with a fully-formed
   * payload. This lets the sessions service and expiry scheduler emit rich events
   * without knowing about the audit module internals.
   */
  @OnEvent('audit.log')
  async handleGenericAuditLog(event: any) {
    await this.persistEvent(
      event.organizationId,
      event.action,
      event.actorId ?? null,
      event.resourceType ?? null,
      event.resourceId ?? null,
      event.metadata ?? {},
    );
  }

  @OnEvent('integration.connected')
  async handleIntegrationConnected(event: any) {
    await this.persistEvent(
      event.organizationId,
      'integration.connected',
      event.actorId,
      'INTEGRATION',
      null,
      { provider: event.provider },
    );
  }

  @OnEvent('integration.disconnected')
  async handleIntegrationDisconnected(event: any) {
    await this.persistEvent(
      event.organizationId,
      'integration.disconnected',
      event.actorId,
      'INTEGRATION',
      null,
      { provider: event.provider },
    );
  }
}

