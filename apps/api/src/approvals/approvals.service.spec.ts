import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalsService } from './approvals.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SessionsService } from '../sessions/sessions.service';
import { ApprovalRequestStatus, ApprovalType } from '@repo/types';
import { BadRequestException } from '@nestjs/common';

describe('ApprovalsService (State Machine)', () => {
  let service: ApprovalsService;
  let prisma: PrismaService;
  let sessionsService: SessionsService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalsService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((callback) =>
              callback({
                approvalRequest: {
                  findUnique: jest.fn(),
                  update: jest.fn(),
                },
              }),
            ),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: SessionsService,
          useValue: {
            createSession: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ApprovalsService>(ApprovalsService);
    prisma = module.get<PrismaService>(PrismaService);
    sessionsService = module.get<SessionsService>(SessionsService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveApprovalRequest', () => {
    const orgId = 'org-1';
    const approvalId = 'app-1';
    const resolverId = 'admin-1';
    const requesterId = 'user-1';

    it('should throw BadRequestException if resolving a request that is already APPROVED', async () => {
      // Mock the transaction callback's findUnique
      const txMock = {
        approvalRequest: {
          findUnique: jest.fn().mockResolvedValue({
            id: approvalId,
            organizationId: orgId,
            requesterId,
            status: ApprovalRequestStatus.APPROVED, // Already approved
          }),
          update: jest.fn(),
        },
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (cb) => {
        return cb(txMock as any);
      });

      await expect(
        service.resolveApprovalRequest(
          orgId,
          approvalId,
          resolverId,
          ApprovalRequestStatus.REJECTED,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if resolving a request that is already REJECTED', async () => {
      const txMock = {
        approvalRequest: {
          findUnique: jest.fn().mockResolvedValue({
            id: approvalId,
            organizationId: orgId,
            requesterId,
            status: ApprovalRequestStatus.REJECTED, // Already rejected
          }),
          update: jest.fn(),
        },
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (cb) => {
        return cb(txMock as any);
      });

      await expect(
        service.resolveApprovalRequest(
          orgId,
          approvalId,
          resolverId,
          ApprovalRequestStatus.APPROVED,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if requester tries to approve their own request', async () => {
      const txMock = {
        approvalRequest: {
          findUnique: jest.fn().mockResolvedValue({
            id: approvalId,
            organizationId: orgId,
            requesterId: resolverId, // Requester is the resolver
            status: ApprovalRequestStatus.PENDING,
          }),
          update: jest.fn(),
        },
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (cb) => {
        return cb(txMock as any);
      });

      await expect(
        service.resolveApprovalRequest(
          orgId,
          approvalId,
          resolverId,
          ApprovalRequestStatus.APPROVED,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create session and emit event on successful APPROVAL', async () => {
      const txMock = {
        approvalRequest: {
          findUnique: jest.fn().mockResolvedValue({
            id: approvalId,
            organizationId: orgId,
            requesterId,
            type: ApprovalType.DELEGATED_SESSION,
            requestPayload: { some: 'payload' },
            status: ApprovalRequestStatus.PENDING,
          }),
          update: jest.fn().mockResolvedValue({
            id: approvalId,
            status: ApprovalRequestStatus.APPROVED,
          }),
        },
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (cb) => {
        return cb(txMock as any);
      });

      await service.resolveApprovalRequest(
        orgId,
        approvalId,
        resolverId,
        ApprovalRequestStatus.APPROVED,
      );

      expect(sessionsService.createSession).toHaveBeenCalledWith(
        orgId,
        requesterId,
        { some: 'payload' },
        txMock as any,
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'approval.approved',
        expect.anything(),
      );
    });
  });
});
