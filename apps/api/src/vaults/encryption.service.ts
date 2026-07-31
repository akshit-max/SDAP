import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

export type EncryptionContext = {
  organizationId: string;
  vaultId: string;
  secretId: string;
  version: number;
};

export type EncryptionResult = {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
  fingerprint: string;
};

@Injectable()
export class EncryptionService {
  private readonly MEK: Buffer;
  private readonly ALGORITHM = 'aes-256-gcm';

  constructor() {
    const mekBase64 = process.env.VAULT_ENCRYPTION_KEY;
    if (!mekBase64) {
      throw new Error('VAULT_ENCRYPTION_KEY environment variable is missing.');
    }

    this.MEK = Buffer.from(mekBase64, 'base64');
    if (this.MEK.length !== 32) {
      throw new Error(
        'VAULT_ENCRYPTION_KEY must be a valid 256-bit (32 byte) key encoded in Base64.',
      );
    }
  }

  /**
   * Generates a random 256-bit Data Encryption Key (DEK).
   */
  generateDEK(): Buffer {
    return crypto.randomBytes(32);
  }

  /**
   * Encrypts the DEK using the MEK.
   */
  encryptDEK(dek: Buffer): EncryptionResult {
    if (dek.length !== 32) {
      throw new InternalServerErrorException('Invalid DEK length');
    }

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.MEK, iv);

    const ciphertext = Buffer.concat([cipher.update(dek), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      ciphertext,
      iv,
      authTag,
      fingerprint: this.computeFingerprint(dek),
    };
  }

  /**
   * Decrypts the DEK using the MEK.
   */
  decryptDEK(encryptedDek: Buffer, iv: Buffer, authTag: Buffer): Buffer {
    try {
      const decipher = crypto.createDecipheriv(this.ALGORITHM, this.MEK, iv);
      decipher.setAuthTag(authTag);

      return Buffer.concat([decipher.update(encryptedDek), decipher.final()]);
    } catch {
      // Swallowing cryptographic errors to maintain constant-time response profiles externally
      // In a real app, this should log to an internal secure logger
      throw new Error('Decryption failed');
    }
  }

  /**
   * Encrypts the actual secret payload using the provided DEK and contextual AAD.
   */
  encryptPayload(
    plaintext: Buffer,
    dek: Buffer,
    context: EncryptionContext,
  ): EncryptionResult {
    if (dek.length !== 32) {
      throw new InternalServerErrorException('Invalid DEK length');
    }

    const iv = crypto.randomBytes(12);
    const aad = this.computeAAD(context);

    const cipher = crypto.createCipheriv(this.ALGORITHM, dek, iv);
    cipher.setAAD(aad);

    const ciphertext = Buffer.concat([
      cipher.update(plaintext),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return {
      ciphertext,
      iv,
      authTag,
      fingerprint: this.computeFingerprint(plaintext),
    };
  }

  /**
   * Decrypts the secret payload using the provided DEK and contextual AAD.
   */
  decryptPayload(
    ciphertext: Buffer,
    dek: Buffer,
    iv: Buffer,
    authTag: Buffer,
    context: EncryptionContext,
  ): Buffer {
    if (dek.length !== 32) {
      throw new InternalServerErrorException('Invalid DEK length');
    }

    try {
      const aad = this.computeAAD(context);
      const decipher = crypto.createDecipheriv(this.ALGORITHM, dek, iv);
      decipher.setAuthTag(authTag);
      decipher.setAAD(aad);

      return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch {
      throw new Error('Decryption failed');
    }
  }

  /**
   * Generates a deterministic, serialized string for the AAD context and hashes it for logging/storage,
   * but the actual AAD passed to AES-GCM is a Buffer.
   */
  computeAAD(context: EncryptionContext): Buffer {
    const serialized = `${context.organizationId}:${context.vaultId}:${context.secretId}:${context.version}`;
    return Buffer.from(serialized, 'utf8');
  }

  /**
   * Computes the SHA-256 fingerprint for integrity and duplicate detection.
   */
  computeFingerprint(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Decrypts a DEK with an old MEK and re-encrypts it with a new MEK.
   * Used during offline key rotation.
   */
  rewrapDEK(
    encryptedDek: Buffer,
    iv: Buffer,
    authTag: Buffer,
    oldMek: Buffer,
    newMek: Buffer,
  ): EncryptionResult {
    let dek: Buffer;
    try {
      const decipher = crypto.createDecipheriv(this.ALGORITHM, oldMek, iv);
      decipher.setAuthTag(authTag);
      dek = Buffer.concat([decipher.update(encryptedDek), decipher.final()]);
    } catch {
      throw new Error('Failed to decrypt DEK with old MEK');
    }

    if (dek.length !== 32) {
      throw new InternalServerErrorException('Invalid DEK length after decryption');
    }

    const newIv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.ALGORITHM, newMek, newIv);

    const ciphertext = Buffer.concat([cipher.update(dek), cipher.final()]);
    const newAuthTag = cipher.getAuthTag();

    return {
      ciphertext,
      iv: newIv,
      authTag: newAuthTag,
      fingerprint: this.computeFingerprint(dek),
    };
  }
}
