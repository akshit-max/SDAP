import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

const PREFIX = 'wk_live_';
const KEY_BYTES = 32; // 256 bits of entropy

export interface CreatedApiKey {
  /** The full raw key shown ONCE to the user — never stored */
  rawKey: string;
  id: string;
  name: string;
  keyPrefix: string;
  expiresAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Create ──────────────────────────────────────────────────────────────────

  async create(
    organizationId: string,
    userId: string,
    dto: { name: string; expiresAt?: Date },
  ): Promise<CreatedApiKey> {
    // Check for name collision within org
    const existing = await this.prisma.apiKey.findFirst({
      where: { organizationId, name: dto.name, status: 'ACTIVE' },
    });
    if (existing) {
      throw new ConflictException(`An API key named "${dto.name}" already exists in this organization.`);
    }

    // Generate cryptographically random key: prefix + base62 random
    const random = crypto.randomBytes(KEY_BYTES).toString('base64url');
    const rawKey = `${PREFIX}${random}`;

    // Store only the SHA-256 hash
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, PREFIX.length + 8); // e.g. "wk_live_AbCd1234"

    const record = await this.prisma.apiKey.create({
      data: {
        organizationId,
        name: dto.name,
        keyHash,
        keyPrefix,
        status: 'ACTIVE',
        expiresAt: dto.expiresAt ?? null,
        createdBy: userId,
      },
    });

    this.logger.log(`[API_KEY] Created key "${dto.name}" for org ${organizationId}`);

    return {
      rawKey, // Shown ONCE — not stored
      id: record.id,
      name: record.name,
      keyPrefix: record.keyPrefix,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
    };
  }

  // ─── List ────────────────────────────────────────────────────────────────────

  async list(organizationId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { organizationId, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        status: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
        createdBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return keys;
  }

  // ─── Revoke ──────────────────────────────────────────────────────────────────

  async revoke(organizationId: string, keyId: string, userId: string): Promise<void> {
    const key = await this.findKey(organizationId, keyId);
    await this.prisma.apiKey.update({
      where: { id: key.id },
      data: { status: 'REVOKED', revokedAt: new Date(), revokedBy: userId },
    });
    this.logger.log(`[API_KEY] Revoked key ${keyId} by user ${userId}`);
  }

  // ─── Rotate ──────────────────────────────────────────────────────────────────

  /**
   * Rotation: revoke old key, create new one with same name and TTL.
   * Returns the new raw key for one-time display.
   */
  async rotate(organizationId: string, keyId: string, userId: string): Promise<CreatedApiKey> {
    const old = await this.findKey(organizationId, keyId);

    // Revoke old
    await (this.prisma as any).apiKey.update({
      where: { id: old.id },
      data: { status: 'REVOKED', revokedAt: new Date(), revokedBy: userId },
    });

    // Create new with same metadata
    return this.create(organizationId, userId, {
      name: old.name,
      expiresAt: old.expiresAt ?? undefined,
    });
  }

  // ─── Validate (used by auth guard) ──────────────────────────────────────────

  /**
   * Validates a raw API key. Returns the key record if valid, null if not.
   * Also updates lastUsedAt and checks expiry.
   */
  async validate(
    rawKey: string,
  ): Promise<{ organizationId: string; id: string } | null> {
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const record = await this.prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (!record) return null;
    if (record.status !== 'ACTIVE') return null;
    if (record.expiresAt && new Date() > record.expiresAt) {
      // Mark expired
      await this.prisma.apiKey.update({
        where: { id: record.id },
        data: { status: 'EXPIRED' },
      });
      return null;
    }

    // Touch lastUsedAt (fire and forget — don't block validation)
    this.prisma.apiKey
      .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    return { organizationId: record.organizationId, id: record.id };
  }

  // ─── Internal ────────────────────────────────────────────────────────────────

  private async findKey(organizationId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, organizationId, status: 'ACTIVE' },
    });
    if (!key) throw new NotFoundException('API key not found or already revoked.');
    return key;
  }
}
