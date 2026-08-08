import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IntegrationProvider, IntegrationStatus } from './core/integration-types';
import { IntegrationRegistry } from './core/integration-registry.service';
import { IntegrationEncryptionService } from './core/integration-encryption.service';
import { ConnectIntegrationDto, GrantIntegrationAccessDto, RevokeIntegrationAccessDto } from './integrations.dto';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: IntegrationRegistry,
    private readonly encryption: IntegrationEncryptionService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Identity Resolution ────────────────────────────────────────────────────

  resolvePrincipalId(provider: IntegrationProvider, user: { id: string; email: string; providerProfiles?: unknown }): string {
    const adapter = this.registry.getAdapter(provider);
    if ('resolvePrincipalId' in adapter && typeof (adapter as any).resolvePrincipalId === 'function') {
      try {
        return (adapter as any).resolvePrincipalId(user);
      } catch (err: unknown) {
        throw new BadRequestException((err as Error).message);
      }
    }
    // Default fallback: assume email is the principal ID for most providers
    return user.email;
  }

  // ─── Connect ────────────────────────────────────────────────────────────────

  async connect(organizationId: string, userId: string, dto: ConnectIntegrationDto) {
    const adapter = this.registry.getAdapter(dto.provider);

    // 1. Validate token with the provider
    let identity: string;
    let meta: Record<string, unknown> | undefined;
    try {
      ({ identity, meta } = await adapter.validateToken(dto.token));
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Token validation failed';
      throw new BadRequestException(`Cannot connect to ${dto.provider}: ${msg}`);
    }

    // 2. Encrypt and upsert
    const { encryptedToken, encryptedDek, keyMetadataId } =
      await this.encryption.encryptToken(dto.token, organizationId, dto.provider);

    const connection = await this.prisma.integrationConnection.upsert({
      where: { organizationId_provider: { organizationId, provider: dto.provider } },
      update: {
        status: IntegrationStatus.ACTIVE,
        encryptedToken,
        encryptedDek,
        keyMetadataId,
        providerMeta: meta as any,
        lastCheckedAt: new Date(),
        lastError: null,
        updatedBy: userId,
        deletedAt: null,
      },
      create: {
        organizationId,
        provider: dto.provider,
        status: IntegrationStatus.ACTIVE,
        encryptedToken,
        encryptedDek,
        keyMetadataId,
        providerMeta: meta as any,
        lastCheckedAt: new Date(),
        createdBy: userId,
        updatedBy: userId,
      },
    });

    this.logger.log(
      `[INTEGRATION] ${dto.provider} connected for org ${organizationId} (identity: ${identity})`,
    );

    this.eventEmitter.emit('integration.connected', {
      organizationId,
      provider: dto.provider,
      actorId: userId,
    });

    return { id: connection.id, provider: connection.provider, identity, status: connection.status };
  }

  // ─── OAuth Flow ─────────────────────────────────────────────────────────────

  async getOAuthUrl(organizationId: string, provider: IntegrationProvider, state: string) {
    const adapter = this.registry.getAdapter(provider);
    
    // We import this inline or from the core types if available, but for now we'll cast.
    // Instead of importing the type guard, we can just check the methods.
    if ('buildAuthorizationUrl' in adapter && typeof adapter.buildAuthorizationUrl === 'function') {
      return { url: adapter.buildAuthorizationUrl(state) };
    }
    throw new BadRequestException(`Provider ${provider} does not support OAuth`);
  }

  async handleOAuthCallback(organizationId: string, userId: string, provider: IntegrationProvider, code: string) {
    const adapter = this.registry.getAdapter(provider);
    
    if ('exchangeCodeAndStore' in adapter && typeof adapter.exchangeCodeAndStore === 'function') {
      try {
        const { grantedEmail } = await adapter.exchangeCodeAndStore(organizationId, userId, code);
        this.eventEmitter.emit('integration.connected', {
          organizationId,
          provider,
          actorId: userId,
        });
        return { identity: grantedEmail, status: IntegrationStatus.ACTIVE };
      } catch (err: unknown) {
        throw new BadRequestException(`OAuth failed: ${(err as Error).message}`);
      }
    }
    throw new BadRequestException(`Provider ${provider} does not support OAuth`);
  }

  // ─── Disconnect ──────────────────────────────────────────────────────────────

  async disconnect(organizationId: string, userId: string, provider: IntegrationProvider) {
    const conn = await this.findConnection(organizationId, provider);

    await this.prisma.integrationConnection.update({
      where: { id: conn.id },
      data: {
        status: IntegrationStatus.DISCONNECTED,
        encryptedToken: '',
        encryptedDek: '',
        updatedBy: userId,
        deletedAt: new Date(),
      },
    });

    this.logger.log(`[INTEGRATION] ${provider} disconnected for org ${organizationId}`);
    this.eventEmitter.emit('integration.disconnected', { organizationId, provider, actorId: userId });
  }

  // ─── Health Check ────────────────────────────────────────────────────────────

  async healthCheck(organizationId: string, provider: IntegrationProvider) {
    const conn = await this.findConnection(organizationId, provider);
    const adapter = this.registry.getAdapter(provider);
    const token = this.encryption.decryptToken(
      conn.encryptedToken,
      conn.encryptedDek,
      organizationId,
      provider,
    );

    let result;
    try {
      result = await adapter.healthCheck(token);
    } catch {
      result = { healthy: false, error: 'Adapter threw during health check', checkedAt: new Date() };
    }

    await this.prisma.integrationConnection.update({
      where: { id: conn.id },
      data: {
        lastCheckedAt: result.checkedAt,
        lastError: result.healthy ? null : (result.error ?? 'Unknown error'),
        status: result.healthy ? IntegrationStatus.ACTIVE : IntegrationStatus.ERROR,
      },
    });

    return result;
  }

  // ─── List Resources ──────────────────────────────────────────────────────────

  async listResources(organizationId: string, provider: IntegrationProvider) {
    const conn = await this.findConnection(organizationId, provider);
    const adapter = this.registry.getAdapter(provider);
    const token = this.encryption.decryptToken(
      conn.encryptedToken,
      conn.encryptedDek,
      organizationId,
      provider,
    );
    return adapter.listResources(token);
  }

  // ─── Grant Access ────────────────────────────────────────────────────────────

  async grantAccess(
    organizationId: string,
    provider: IntegrationProvider,
    dto: GrantIntegrationAccessDto,
  ) {
    const conn = await this.findConnection(organizationId, provider);
    const adapter = this.registry.getAdapter(provider);
    const token = this.encryption.decryptToken(
      conn.encryptedToken,
      conn.encryptedDek,
      organizationId,
      provider,
    );
    return adapter.grantAccess(token, dto);
  }

  // ─── Revoke Access ───────────────────────────────────────────────────────────

  async revokeAccess(
    organizationId: string,
    provider: IntegrationProvider,
    dto: RevokeIntegrationAccessDto,
  ) {
    const conn = await this.findConnection(organizationId, provider);
    const adapter = this.registry.getAdapter(provider);
    const token = this.encryption.decryptToken(
      conn.encryptedToken,
      conn.encryptedDek,
      organizationId,
      provider,
    );
    return adapter.revokeAccess(token, dto);
  }


  // ─── List Connections ────────────────────────────────────────────────────────

  async listConnections(organizationId: string) {
    const connections = await this.prisma.integrationConnection.findMany({
      where: { organizationId, deletedAt: null },
      select: {
        id: true,
        provider: true,
        status: true,
        providerMeta: true,
        lastCheckedAt: true,
        lastError: true,
        createdAt: true,
      },
    });

    const supported = this.registry.getSupportedProviders();

    return supported.map((p: IntegrationProvider) => {
      const conn = connections.find((c: { provider: string }) => c.provider === p);
      return conn
        ? conn
        : { id: null, provider: p, status: IntegrationStatus.DISCONNECTED, providerMeta: null, lastCheckedAt: null, lastError: null, createdAt: null };
    });
  }

  // ─── Internal ────────────────────────────────────────────────────────────────

  private async findConnection(organizationId: string, provider: IntegrationProvider) {
    const conn = await this.prisma.integrationConnection.findFirst({
      where: { organizationId, provider, deletedAt: null, status: { not: IntegrationStatus.DISCONNECTED } },
    });
    if (!conn) {
      throw new NotFoundException(
        `${provider} integration is not connected for this organization.`,
      );
    }
    return conn;
  }
}
