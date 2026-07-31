import { Injectable } from '@nestjs/common';
import { EncryptionService } from '../../vaults/encryption.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

/**
 * Handles AES-256-GCM encryption/decryption for integration PATs.
 * Follows the same envelope-encryption pattern as secrets:
 *   - A per-connection DEK is generated and encrypted by the MEK.
 *   - The PAT is encrypted with the DEK.
 *   - Both are serialized as hex strings for DB storage.
 */
@Injectable()
export class IntegrationEncryptionService {
  constructor(
    private readonly encryption: EncryptionService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Serialization helpers (mirror SecretLifecycleService) ─────────────────

  private serialize(iv: Buffer, authTag: Buffer, ciphertext: Buffer): string {
    return [
      iv.toString('hex'),
      authTag.toString('hex'),
      ciphertext.toString('hex'),
    ].join(':');
  }

  private deserialize(stored: string): { iv: Buffer; authTag: Buffer; ciphertext: Buffer } {
    const parts = stored.split(':');
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
      throw new Error('Invalid encrypted data format');
    }
    return {
      iv: Buffer.from(parts[0], 'hex'),
      authTag: Buffer.from(parts[1], 'hex'),
      ciphertext: Buffer.from(parts[2], 'hex'),
    };
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Encrypt a plaintext PAT for storage.
   * The organization ID and provider name are used as AAD.
   */
  async encryptToken(
    plaintext: string,
    organizationId: string,
    provider: string,
  ): Promise<{ encryptedToken: string; encryptedDek: string; keyMetadataId: string }> {
    // Resolve active key metadata
    const keyMetadata = await this.prisma.keyMetadata.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { version: 'desc' },
    });
    if (!keyMetadata) throw new Error('No active encryption key found');

    // Generate DEK and encrypt with MEK
    const dek = this.encryption.generateDEK();
    const dekResult = this.encryption.encryptDEK(dek);
    const encryptedDek = this.serialize(dekResult.iv, dekResult.authTag, dekResult.ciphertext);

    // Build AAD: org:provider
    const aadBuffer = Buffer.from(`${organizationId}:${provider}`, 'utf8');

    // Encrypt PAT with DEK using raw AES-GCM (no EncryptionContext — using string AAD)
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
    cipher.setAAD(aadBuffer);
    const ciphertext = Buffer.concat([
      cipher.update(Buffer.from(plaintext, 'utf8')),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    const encryptedToken = this.serialize(iv, authTag, ciphertext);

    return { encryptedToken, encryptedDek, keyMetadataId: keyMetadata.id };
  }

  /**
   * Decrypt a stored PAT.
   */
  decryptToken(
    encryptedToken: string,
    encryptedDek: string,
    organizationId: string,
    provider: string,
  ): string {
    // Decrypt DEK
    const { iv: dekIv, authTag: dekAuthTag, ciphertext: dekCt } = this.deserialize(encryptedDek);
    const dek = this.encryption.decryptDEK(dekCt, dekIv, dekAuthTag);

    // Decrypt token
    const { iv, authTag, ciphertext } = this.deserialize(encryptedToken);
    const aadBuffer = Buffer.from(`${organizationId}:${provider}`, 'utf8');

    const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv);
    decipher.setAuthTag(authTag);
    decipher.setAAD(aadBuffer);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString('utf8');
  }
}
