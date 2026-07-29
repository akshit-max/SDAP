import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConflictException } from '@nestjs/common';

describe('OrganizationsService', () => {
  let service: OrganizationsService;

  const mockOrg = {
    id: 'org-1',
    name: 'Acme Corp',
    slug: 'acme-corp',
    isActive: true,
    deletedAt: null,
  };

  const mockPrismaService = {
    organization: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organizationMember: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    organizationInvitation: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUniqueOrThrow: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(mockPrismaService)),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('should create an organization with a unique slug and emit an event', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null); // slug is unique
      mockPrismaService.organization.create.mockResolvedValue(mockOrg);
      mockPrismaService.organizationMember.create.mockResolvedValue({});

      const result = await service.create('user-1', { name: 'Acme Corp' });

      expect(result).toEqual(mockOrg);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'organization.created',
        expect.any(Object),
      );
    });
  });

  describe('findAllForUser()', () => {
    it('should return organizations for user', async () => {
      mockPrismaService.organizationMember.findMany.mockResolvedValue([
        { organization: mockOrg },
      ]);

      const result = await service.findAllForUser('user-1');
      expect(result).toEqual([mockOrg]);
    });
  });

  describe('acceptInvite()', () => {
    it('should throw ConflictException for invalid token', async () => {
      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        null,
      );

      await expect(service.acceptInvite('user-1', 'bad-token')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if invitation is already accepted', async () => {
      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        status: 'ACCEPTED',
        expiresAt: new Date(Date.now() + 999999),
      });

      await expect(
        service.acceptInvite('user-1', 'some-token'),
      ).rejects.toThrow(ConflictException);
    });
  });
});
