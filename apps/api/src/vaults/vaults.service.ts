import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVaultDto, UpdateVaultDto } from '@repo/types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  VaultCreatedEvent,
  VaultUpdatedEvent,
  VaultDeletedEvent,
} from './vaults.events';

import { Prisma } from '@prisma/client';

@Injectable()
export class VaultsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createVault(orgId: string, userId: string, dto: CreateVaultDto) {
    const vault = await this.prisma.vault.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        description: dto.description,
      },
    });

    this.eventEmitter.emit(
      VaultCreatedEvent.EVENT_NAME,
      new VaultCreatedEvent(orgId, vault.id, userId),
    );

    return vault;
  }

  async getVaults(orgId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { organizationId: orgId, deletedAt: null };

    const [items, total] = await Promise.all([
      this.prisma.vault.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.vault.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getVaultById(orgId: string, vaultId: string) {
    const vault = await this.prisma.vault.findFirst({
      where: {
        id: vaultId,
        organizationId: orgId,
        deletedAt: null,
      },
    });

    if (!vault) {
      throw new NotFoundException('Vault not found');
    }

    return vault;
  }

  async updateVault(
    orgId: string,
    vaultId: string,
    userId: string,
    dto: UpdateVaultDto,
  ) {
    // Ensure vault exists
    await this.getVaultById(orgId, vaultId);

    const updatedVault = await this.prisma.vault.update({
      where: { id: vaultId },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });

    this.eventEmitter.emit(
      VaultUpdatedEvent.EVENT_NAME,
      new VaultUpdatedEvent(orgId, vaultId, userId),
    );

    return updatedVault;
  }

  async deleteVault(orgId: string, vaultId: string, userId: string) {
    // Ensure vault exists
    await this.getVaultById(orgId, vaultId);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const now = new Date();
      // Soft delete the vault
      await tx.vault.update({
        where: { id: vaultId },
        data: { deletedAt: now },
      });

      // Soft delete all active secrets in the vault
      // Note: In a massive enterprise deployment, if a vault has >100k secrets,
      // this might require batching, but updateMany is highly optimized in Postgres.
      await tx.secret.updateMany({
        where: {
          vaultId,
          deletedAt: null,
        },
        data: { deletedAt: now },
      });
    });

    // Emit event for vault deletion
    this.eventEmitter.emit(
      VaultDeletedEvent.EVENT_NAME,
      new VaultDeletedEvent(orgId, vaultId, userId),
    );

    // We do not emit SecretDeletedEvent for every secret to avoid event explosion,
    // The VaultDeletedEvent implies all child secrets are effectively inaccessible.
    // However, if strict individual audit is needed, it would be handled via a background job.
  }
}
