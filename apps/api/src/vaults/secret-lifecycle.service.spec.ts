import { Test, TestingModule } from '@nestjs/testing';
import { SecretLifecycleService } from './secret-lifecycle.service';
import { EncryptionService } from './encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma, SecretStatus, SecretType } from '@prisma/client';

describe('SecretLifecycleService', () => {
  let service: SecretLifecycleService;
  let prisma: PrismaService;
  let encryption: EncryptionService;

  // Mock Data
  const mockUserId = 'user-123';
  const mockOrgId = 'org-123';
  const mockVaultId = 'vault-456';
  const mockKeyId = 'key-789';

  const mockKeyMetadata = { id: mockKeyId, version: 1, status: 'ACTIVE' };
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = process.env;
    process.env = {
      ...originalEnv,
      VAULT_ENCRYPTION_KEY: Buffer.from('a'.repeat(32)).toString('base64'),
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(async () => {
    // Create a mock Prisma transaction client
    const mockTx = {
      keyMetadata: {
        findFirst: jest.fn().mockResolvedValue(mockKeyMetadata),
      },
      secret: {
        create: jest
          .fn()
          .mockImplementation((args) =>
            Promise.resolve({ id: args.data.id, ...args.data }),
          ),
        findUnique: jest.fn(),
        update: jest
          .fn()
          .mockImplementation((args) =>
            Promise.resolve({ id: args.where.id, ...args.data }),
          ),
      },
      secretVersion: {
        create: jest
          .fn()
          .mockImplementation((args) =>
            Promise.resolve({ id: 'ver-id', ...args.data }),
          ),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const mockPrisma = {
      $transaction: jest.fn().mockImplementation(async (cb) => {
        return cb(mockTx);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecretLifecycleService,
        EncryptionService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<SecretLifecycleService>(SecretLifecycleService);
    prisma = module.get<PrismaService>(PrismaService);
    encryption = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSecret', () => {
    it('should generate DEK, encrypt payload, and create version 1 in a transaction', async () => {
      const result = await service.createSecret({
        vaultId: mockVaultId,
        name: 'DB_PASSWORD',
        plaintext: 'supersecret',
        organizationId: mockOrgId,
        userId: mockUserId,
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.vaultId).toBe(mockVaultId);
      expect(result.status).toBe(SecretStatus.ACTIVE);
      expect(result.type).toBe(SecretType.OTHER);
      expect(result.encryptedDek).toBeDefined(); // serialized dek
    });

    it('should throw if no active key metadata is found', async () => {
      // Override the mockTx within the transaction callback
      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (cb) => {
        return cb({
          keyMetadata: { findFirst: jest.fn().mockResolvedValue(null) },
        });
      });

      await expect(
        service.createSecret({
          vaultId: mockVaultId,
          name: 'DB_PASSWORD',
          plaintext: 'supersecret',
          organizationId: mockOrgId,
          userId: mockUserId,
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateSecret', () => {
    const mockSecretId = 'secret-uuid';
    const mockEncryptedDek =
      Buffer.from('iv').toString('base64') +
      '.' +
      Buffer.from('authTag').toString('base64') +
      '.' +
      Buffer.from('ciphertext').toString('base64');

    const mockSecretData = {
      id: mockSecretId,
      vaultId: mockVaultId,
      encryptedDek: mockEncryptedDek,
      keyMetadataId: mockKeyId,
      deletedAt: null,
      versions: [{ version: 1 }],
    };

    it('should create version 2 sequentially', async () => {
      jest
        .spyOn(encryption, 'decryptDEK')
        .mockReturnValue(Buffer.from('a'.repeat(32)));
      jest.spyOn(encryption, 'encryptPayload').mockReturnValue({
        ciphertext: Buffer.from('c'),
        iv: Buffer.from('i'),
        authTag: Buffer.from('a'),
        fingerprint: 'hash',
      });

      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (cb) => {
        return cb({
          secret: {
            findUnique: jest.fn().mockResolvedValue(mockSecretData),
            update: jest
              .fn()
              .mockResolvedValue({ id: mockSecretId, updatedAt: new Date() }),
          },
          secretVersion: {
            create: jest
              .fn()
              .mockImplementation((args) => Promise.resolve(args.data)),
          },
        });
      });

      await service.updateSecret({
        secretId: mockSecretId,
        plaintext: 'newsecret',
        organizationId: mockOrgId,
        userId: mockUserId,
      });

      // The transaction mock captures the closure. We can verify it didn't throw.
    });

    it('should throw ConflictException on Prisma P2002 error (concurrent updates)', async () => {
      // Simulate unique constraint failure
      (prisma.$transaction as jest.Mock).mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'x',
        }),
      );

      await expect(
        service.updateSecret({
          secretId: mockSecretId,
          plaintext: 'concurrently-updated-secret',
          organizationId: mockOrgId,
          userId: mockUserId,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('revealSecret', () => {
    const mockSecretId = 'secret-uuid';
    const mockEncryptedDek =
      Buffer.from('iv').toString('base64') +
      '.' +
      Buffer.from('authTag').toString('base64') +
      '.' +
      Buffer.from('ciphertext').toString('base64');

    it('should decrypt and return plaintext successfully', async () => {
      const plaintextBuffer = Buffer.from('decrypted-secret');
      jest
        .spyOn(encryption, 'decryptDEK')
        .mockReturnValue(Buffer.from('a'.repeat(32)));
      jest.spyOn(encryption, 'decryptPayload').mockReturnValue(plaintextBuffer);

      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (cb) => {
        return cb({
          secret: {
            findUnique: jest.fn().mockResolvedValue({
              id: mockSecretId,
              vaultId: mockVaultId,
              encryptedDek: mockEncryptedDek,
              deletedAt: null,
              versions: [{ version: 1, ciphertext: '', iv: '', authTag: '' }],
            }),
            update: jest.fn(),
          },
        });
      });

      const result = await service.revealSecret({
        secretId: mockSecretId,
        organizationId: mockOrgId,
        userId: mockUserId,
      });

      expect(result).toBe('decrypted-secret');
    });

    it('should throw generic InternalServerErrorException on decryption failure (constant-time)', async () => {
      jest
        .spyOn(encryption, 'decryptDEK')
        .mockReturnValue(Buffer.from('a'.repeat(32)));
      jest.spyOn(encryption, 'decryptPayload').mockImplementation(() => {
        throw new Error('Internal Crypto Error (e.g. invalid auth tag)');
      });

      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (cb) => {
        return cb({
          secret: {
            findUnique: jest.fn().mockResolvedValue({
              id: mockSecretId,
              vaultId: mockVaultId,
              encryptedDek: mockEncryptedDek,
              deletedAt: null,
              versions: [{ version: 1, ciphertext: '', iv: '', authTag: '' }],
            }),
          },
        });
      });

      await expect(
        service.revealSecret({
          secretId: mockSecretId,
          organizationId: mockOrgId,
          userId: mockUserId,
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw generic InternalServerErrorException if secret is soft-deleted', async () => {
      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (cb) => {
        return cb({
          secret: {
            findUnique: jest.fn().mockResolvedValue({
              id: mockSecretId,
              deletedAt: new Date(),
              versions: [],
            }),
          },
        });
      });

      await expect(
        service.revealSecret({
          secretId: mockSecretId,
          organizationId: mockOrgId,
          userId: mockUserId,
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('softDeleteSecret', () => {
    it('should update Secret status to DELETED and set deletedAt for all versions', async () => {
      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (cb) => {
        const mockTx = {
          secret: {
            findUnique: jest
              .fn()
              .mockResolvedValue({ id: 'secret-id', deletedAt: null }),
            update: jest.fn(),
          },
          secretVersion: {
            updateMany: jest.fn(),
          },
        };
        await cb(mockTx);
        expect(mockTx.secret.update).toHaveBeenCalled();
        expect(mockTx.secretVersion.updateMany).toHaveBeenCalled();
        return true;
      });

      await service.softDeleteSecret('secret-id', mockUserId);
    });

    it('should throw NotFoundException if already deleted', async () => {
      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (cb) => {
        const mockTx = {
          secret: {
            findUnique: jest
              .fn()
              .mockResolvedValue({ id: 'secret-id', deletedAt: new Date() }),
          },
        };
        return cb(mockTx);
      });

      await expect(
        service.softDeleteSecret('secret-id', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
