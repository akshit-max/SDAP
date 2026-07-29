import { Test, TestingModule } from '@nestjs/testing';
import { AuditListenerService } from './audit-listener.service';
import { PrismaService } from '../prisma/prisma.service';
import { SecretRevealSucceededEvent } from '../vaults/vaults.events';

describe('AuditListenerService', () => {
  let service: AuditListenerService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditListenerService,
        {
          provide: PrismaService,
          useValue: {
            auditEvent: {
              create: jest.fn().mockResolvedValue({}),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuditListenerService>(AuditListenerService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleSecretRevealed', () => {
    it('should persist exactly one audit record for a secret.reveal.succeeded event', async () => {
      const event = new SecretRevealSucceededEvent(
        'org-1',
        'vault-1',
        'secret-1',
        'user-1',
      );

      await service.handleSecretRevealed(event);

      expect(prisma.auditEvent.create).toHaveBeenCalledTimes(1);
      expect(prisma.auditEvent.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          action: 'secret.revealed',
          actorId: 'user-1',
          resourceType: 'SECRET',
          resourceId: 'secret-1',
          metadata: {
            vaultId: 'vault-1',
          },
          eventVersion: 1,
        },
      });
    });

    it('should not throw an error if persistence fails (non-blocking)', async () => {
      // Mock failure
      jest
        .spyOn(prisma.auditEvent, 'create')
        .mockRejectedValueOnce(new Error('DB connection failed'));

      const event = new SecretRevealSucceededEvent(
        'org-1',
        'vault-1',
        'secret-1',
        'user-1',
      );

      // Should resolve successfully despite inner failure
      await expect(service.handleSecretRevealed(event)).resolves.not.toThrow();
      expect(prisma.auditEvent.create).toHaveBeenCalledTimes(1);
    });
  });
});
