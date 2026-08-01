import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SessionsService } from '../sessions/sessions.service';
import {
  ApprovalRequestStatus,
  ApprovalType,
} from '@repo/types';
import { CreateSessionDto } from '../sessions/dto/sessions.dto';
import { ApprovalRequestedEvent } from './events/approval-requested.event';
import { ApprovalApprovedEvent } from './events/approval-approved.event';
import { ApprovalRejectedEvent } from './events/approval-rejected.event';

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly sessionsService: SessionsService,
  ) {}

  async createApprovalRequest(
    organizationId: string,
    requesterId: string,
    type: ApprovalType,
    payload: any,
  ) {
    const request = await this.prisma.approvalRequest.create({
      data: {
        organizationId,
        requesterId,
        type,
        requestPayload: payload,
        status: ApprovalRequestStatus.PENDING,
      },
    });

    this.eventEmitter.emit(
      'approval.requested',
      new ApprovalRequestedEvent(
        request.id,
        organizationId,
        requesterId,
        type,
        payload as CreateSessionDto,
      ),
    );

    return request;
  }

  async resolveApprovalRequest(
    organizationId: string,
    approvalId: string,
    resolvedByUserId: string,
    status: 'APPROVED' | 'REJECTED',
    reason?: string,
  ) {
    // 1. We must execute this inside a transaction to prevent race conditions on state machine
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.approvalRequest.findUnique({
        where: { id: approvalId },
      });

      if (!request || request.organizationId !== organizationId) {
        throw new NotFoundException('Approval request not found.');
      }

      if (request.status !== 'PENDING') {
        throw new BadRequestException(
          `Approval request is already ${request.status.toLowerCase()}.`,
        );
      }

      // Check that the requester is not approving their own request (unless we allow self-approval for some reason, but typically admins shouldn't approve their own requests if they fall into the workflow. Actually if they are admin they bypassed it. But just in case:)
      if (request.requesterId === resolvedByUserId) {
        throw new BadRequestException(
          'You cannot approve or reject your own request.',
        );
      }

      // 2. Update state
      const updatedRequest = await tx.approvalRequest.update({
        where: { id: approvalId },
        data: {
          status: status as any,
          resolvedAt: new Date(),
          resolvedBy: resolvedByUserId,
          reason,
        },
      });

      // 3. Side effects based on status
      if (status === 'APPROVED') {
        if (request.type === 'DELEGATED_SESSION') {
          const payload = request.requestPayload as unknown as CreateSessionDto;
          // We call SessionsService. Note that in a true unit-of-work we might want SessionsService to accept the tx client,
          // but Prisma doesn't easily support cross-service transaction injection without custom patterns.
          // For now, if createSession fails, the transaction will NOT rollback the createSession if it uses a separate Prisma client call.
          // Since createSession just inserts one row, it's generally safe. To be strictly transactional, SessionsService needs to accept tx.
          // For Phase 6, we'll just call it.
          await this.sessionsService.createSession(
            organizationId,
            resolvedByUserId, // The grantor of the session is the user who approved it
            payload,
            tx,
          );
        }

        this.eventEmitter.emit(
          'approval.approved',
          new ApprovalApprovedEvent(
            approvalId,
            organizationId,
            resolvedByUserId,
            reason,
          ),
        );
      } else {
        this.eventEmitter.emit(
          'approval.rejected',
          new ApprovalRejectedEvent(
            approvalId,
            organizationId,
            resolvedByUserId,
            reason,
          ),
        );
      }

      return updatedRequest;
    });
  }

  async getPendingApprovals(organizationId: string) {
    return this.prisma.approvalRequest.findMany({
      where: {
        organizationId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        requester: { select: { fullName: true, email: true } },
      },
    });
  }

  async getMyRequests(organizationId: string, requesterId: string) {
    return this.prisma.approvalRequest.findMany({
      where: {
        organizationId,
        requesterId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
