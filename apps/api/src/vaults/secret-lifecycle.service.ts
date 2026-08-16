import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService, EncryptionResult } from './encryption.service';
import { SecretType, SecretStatus, Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  SecretCreatedEvent,
  SecretUpdatedEvent,
  SecretDeletedEvent,
  SecretRevealRequestedEvent,
  SecretRevealSucceededEvent,
  SecretRevealFailedEvent,
} from './vaults.events';

export interface CreateSecretInput {
  vaultId: string;
  name: string;
  description?: string;
  type?: SecretType;
  plaintext: string;
  organizationId: string;
  userId: string;
}

export interface UpdateSecretInput {
  secretId: string;
  plaintext?: string;
  name?: string;
  description?: string;
  status?: SecretStatus;
  organizationId: string;
  userId: string;
}

export interface RevealSecretInput {
  secretId: string;
  organizationId: string;
  userId: string;
  reason?: string;
}

@Injectable()
export class SecretLifecycleService {
  private readonly logger = new Logger(SecretLifecycleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Serializes an EncryptionResult into a single Base64 string for storage (IV + AuthTag + Ciphertext)
   */
  private serializeDek(result: EncryptionResult): string {
    const iv = result.iv.toString('base64');
    const authTag = result.authTag.toString('base64');
    const ciphertext = result.ciphertext.toString('base64');
    return `${iv}.${authTag}.${ciphertext}`;
  }

  /**
   * Deserializes a Base64 string back into IV, AuthTag, and Ciphertext buffers
   */
  private deserializeDek(serialized: string): {
    iv: Buffer;
    authTag: Buffer;
    ciphertext: Buffer;
  } {
    const parts = serialized.split('.');
    if (parts.length !== 3) {
      throw new InternalServerErrorException(
        'Corrupted DEK format in database',
      );
    }
    return {
      iv: Buffer.from(parts[0]!, 'base64'),
      authTag: Buffer.from(parts[1]!, 'base64'),
      ciphertext: Buffer.from(parts[2]!, 'base64'),
    };
  }

  /**
   * Fetches the currently active MEK metadata record.
   */
  private async getActiveKeyMetadata(tx: Prisma.TransactionClient) {
    const activeKey = await tx.keyMetadata.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { version: 'desc' },
    });

    if (!activeKey) {
      this.logger.error(
        'No active KeyMetadata record found in the database. Cannot encrypt secrets.',
      );
      throw new InternalServerErrorException(
        'Cryptographic configuration error',
      );
    }

    return activeKey;
  }

  async createSecret(input: CreateSecretInput) {
    const {
      vaultId,
      name,
      description,
      type,
      plaintext,
      organizationId,
      userId,
    } = input;
    const plaintextBuffer = Buffer.from(plaintext, 'utf8');
    const secretId = crypto.randomUUID(); // Predetermine ID for AAD

    try {
      return await this.prisma.$transaction(async (tx) => {
      const activeKey = await this.getActiveKeyMetadata(tx);

      const dek = this.encryption.generateDEK();
      const encryptedDekResult = this.encryption.encryptDEK(dek);
      const serializedDek = this.serializeDek(encryptedDekResult);

      const version = 1;
      const context = { organizationId, vaultId, secretId, version };
      const encryptedPayload = this.encryption.encryptPayload(
        plaintextBuffer,
        dek,
        context,
      );

      this.logger.log(
        `[AUDIT INTENT] User ${userId} creating Secret ${secretId} (v1) in Vault ${vaultId}`,
      );

      const secret = await tx.secret.create({
        data: {
          id: secretId,
          vaultId,
          name,
          description,
          type: type || SecretType.OTHER,
          status: SecretStatus.ACTIVE,
          encryptedDek: serializedDek,
          keyMetadataId: activeKey.id,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      await tx.secretVersion.create({
        data: {
          secretId: secret.id,
          version,
          ciphertext: encryptedPayload.ciphertext.toString('base64'),
          iv: encryptedPayload.iv.toString('base64'),
          authTag: encryptedPayload.authTag.toString('base64'),
          fingerprint: encryptedPayload.fingerprint,
          keyMetadataId: activeKey.id,
          createdBy: userId,
        },
      });

      this.logger.log(
        `[AUDIT SUCCESS] User ${userId} successfully created Secret ${secret.id} (v1)`,
      );

      this.eventEmitter.emit(
        SecretCreatedEvent.EVENT_NAME,
        new SecretCreatedEvent(organizationId, vaultId, secret.id, userId),
      );

      return secret;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A secret with this name already exists in the vault.',
        );
      }
      throw error;
    }
  }

  async getSecretsByVaultId(vaultId: string) {
    return this.prisma.secret.findMany({
      where: { vaultId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        vaultId: true,
        name: true,
        description: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastRevealedAt: true,
        revealCount: true,
        createdBy: true,
        updatedBy: true,
      },
    });
  }

  async getSecretMetadataById(secretId: string) {
    const secret = await this.prisma.secret.findFirst({
      where: { id: secretId, deletedAt: null },
      select: {
        id: true,
        vaultId: true,
        name: true,
        description: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastRevealedAt: true,
        revealCount: true,
        createdBy: true,
        updatedBy: true,
        // Required for org-scope enforcement in ProgrammaticController.
        // Without this, result.vault was always undefined and the check
        // (result.vault.organizationId !== callerOrgId) always threw — endpoint was broken.
        vault: { select: { organizationId: true } },
      },
    });

    if (!secret) {
      throw new NotFoundException('Secret not found');
    }

    return secret;
  }

  async updateSecret(input: UpdateSecretInput) {
    const { secretId, plaintext, organizationId, userId } = input;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const secret = await tx.secret.findUnique({
          where: { id: secretId },
          include: {
            vault: true,
            versions: { orderBy: { version: 'desc' }, take: 1 },
          },
        });

        if (
          !secret ||
          secret.deletedAt ||
          secret.vault.organizationId !== organizationId
        ) {
          throw new NotFoundException('Secret not found');
        }

        const latestVersion = secret.versions[0];
        let updatedSecret = secret;

        // Only append a new version if plaintext is provided
        if (plaintext) {
          const newVersionNumber = (latestVersion?.version || 0) + 1;

          // Decrypt the DEK
          const dekParts = this.deserializeDek(secret.encryptedDek);
          const dek = this.encryption.decryptDEK(
            dekParts.ciphertext,
            dekParts.iv,
            dekParts.authTag,
          );

          // Encrypt the new payload
          const context = {
            organizationId,
            vaultId: secret.vaultId,
            secretId,
            version: newVersionNumber,
          };
          const plaintextBuffer = Buffer.from(plaintext, 'utf8');
          const encryptedPayload = this.encryption.encryptPayload(
            plaintextBuffer,
            dek,
            context,
          );

          this.logger.log(
            `[AUDIT INTENT] User ${userId} appending new version v${newVersionNumber} to Secret ${secretId}`,
          );

          // Persist new version
          await tx.secretVersion.create({
            data: {
              secretId: secret.id,
              version: newVersionNumber,
              ciphertext: encryptedPayload.ciphertext.toString('base64'),
              iv: encryptedPayload.iv.toString('base64'),
              authTag: encryptedPayload.authTag.toString('base64'),
              fingerprint: encryptedPayload.fingerprint,
              keyMetadataId: secret.keyMetadataId, // Keep original DEK's key relation (no rotation yet)
              createdBy: userId,
            },
          });
        }

        // Update metadata
        updatedSecret = await tx.secret.update({
          where: { id: secretId },
          data: {
            ...(input.name !== undefined && { name: input.name }),
            ...(input.description !== undefined && {
              description: input.description,
            }),
            ...(input.status !== undefined && { status: input.status }),
            updatedAt: new Date(),
            updatedBy: userId,
          },
          include: {
            vault: true,
            versions: { orderBy: { version: 'desc' }, take: 1 },
          },
        });

        this.logger.log(
          `[AUDIT SUCCESS] User ${userId} successfully updated metadata/version for Secret ${secret.id}`,
        );

        this.eventEmitter.emit(
          SecretUpdatedEvent.EVENT_NAME,
          new SecretUpdatedEvent(
            organizationId,
            secret.vaultId,
            secret.id,
            userId,
          ),
        );

        return updatedSecret;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Concurrent update detected. Please try again.',
        );
      }
      throw error;
    }
  }

  async revealSecret(
    input: RevealSecretInput,
    versionNumber?: number,
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    if (tx) {
      return this.executeRevealSecret(input, versionNumber, tx);
    }
    return this.prisma.$transaction((innerTx) =>
      this.executeRevealSecret(input, versionNumber, innerTx),
    );
  }

  private async executeRevealSecret(
    input: RevealSecretInput,
    versionNumber: number | undefined,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const { secretId, organizationId, userId, reason } = input;

    this.logger.log(
      `[AUDIT INTENT] User ${userId} requesting reveal of Secret ${secretId} ${versionNumber ? `(v${versionNumber})` : '(latest)'}. Reason: ${reason || 'None'}`,
    );

    const secret = await tx.secret.findUnique({
      where: { id: secretId },
      include: {
        vault: true,
        versions: versionNumber
          ? { where: { version: versionNumber } }
          : { orderBy: { version: 'desc' }, take: 1 },
      },
    });

    if (
      !secret ||
      secret.deletedAt ||
      secret.vault.organizationId !== organizationId ||
      secret.versions.length === 0
    ) {
      this.eventEmitter.emit(
        SecretRevealRequestedEvent.EVENT_NAME,
        new SecretRevealRequestedEvent(
          organizationId,
          'unknown',
          secretId,
          userId,
          'unknown',
          'unknown',
        ),
      );
      this.eventEmitter.emit(
        SecretRevealFailedEvent.EVENT_NAME,
        new SecretRevealFailedEvent(
          organizationId,
          'unknown',
          secretId,
          userId,
          'Secret unavailable',
        ),
      );
      throw new InternalServerErrorException('Unable to reveal secret');
    }

    this.eventEmitter.emit(
      SecretRevealRequestedEvent.EVENT_NAME,
      new SecretRevealRequestedEvent(
        organizationId,
        secret.vaultId,
        secretId,
        userId,
        'unknown',
        'unknown',
      ),
    );

    try {
      const targetVersion = secret.versions[0];
      if (!targetVersion) {
        throw new Error('Secret unavailable');
      }

      // Decrypt DEK
      const dekParts = this.deserializeDek(secret.encryptedDek);
      const dek = this.encryption.decryptDEK(
        dekParts.ciphertext,
        dekParts.iv,
        dekParts.authTag,
      );

      // Decrypt Payload
      const context = {
        organizationId,
        vaultId: secret.vaultId,
        secretId,
        version: targetVersion.version,
      };
      const plaintextBuffer = this.encryption.decryptPayload(
        Buffer.from(targetVersion.ciphertext, 'base64'),
        dek,
        Buffer.from(targetVersion.iv, 'base64'),
        Buffer.from(targetVersion.authTag, 'base64'),
        context,
      );

      // Update Reveal Metadata
      await tx.secret.update({
        where: { id: secretId },
        data: {
          lastRevealedAt: new Date(),
          revealCount: { increment: 1 },
        },
      });

      this.logger.log(
        `[AUDIT SUCCESS] User ${userId} successfully revealed Secret ${secretId} (v${targetVersion.version})`,
      );

      this.eventEmitter.emit(
        SecretRevealSucceededEvent.EVENT_NAME,
        new SecretRevealSucceededEvent(
          organizationId,
          secret.vaultId,
          secret.id,
          userId,
        ),
      );

      return plaintextBuffer.toString('utf8');
    } catch (err: unknown) {
      let msg = 'Unknown error';
      if (err instanceof Error) msg = err.message;
      this.logger.warn(
        `[AUDIT FAILURE] User ${userId} failed to reveal Secret ${secretId}: ${msg}`,
      );

      this.eventEmitter.emit(
        SecretRevealFailedEvent.EVENT_NAME,
        new SecretRevealFailedEvent(
          organizationId,
          secret?.vaultId || 'unknown',
          secretId,
          userId,
          msg,
        ),
      );

      throw new InternalServerErrorException('Unable to reveal secret');
    }
  }

  async softDeleteSecret(
    secretId: string,
    userId: string,
    organizationId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      this.logger.log(
        `[AUDIT INTENT] User ${userId} soft-deleting Secret ${secretId}`,
      );

      const secret = await tx.secret.findUnique({
        where: { id: secretId },
        include: { vault: true },
      });
      if (
        !secret ||
        secret.deletedAt ||
        secret.vault.organizationId !== organizationId
      ) {
        throw new NotFoundException('Secret not found');
      }

      const now = new Date();
      await tx.secret.update({
        where: { id: secretId },
        data: {
          status: SecretStatus.DELETED,
          deletedAt: now,
          deletedBy: userId,
        },
      });

      await tx.secretVersion.updateMany({
        where: { secretId },
        data: { deletedAt: now },
      });

      this.logger.log(
        `[AUDIT SUCCESS] User ${userId} soft-deleted Secret ${secretId}`,
      );

      this.eventEmitter.emit(
        SecretDeletedEvent.EVENT_NAME,
        new SecretDeletedEvent(
          secret.vault.organizationId,
          secret.vaultId,
          secret.id,
          userId,
        ),
      );

      return secret;
    });
  }
}
