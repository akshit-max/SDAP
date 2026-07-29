import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalType, CreateSessionDto } from '@repo/types';

@Injectable()
export class ApprovalPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Determines if a request requires formal approval.
   * For Phase 6: ADMIN or OWNER can auto-approve their own requests (no approval workflow required).
   * MEMBER role always requires approval.
   */
  async requiresApproval(
    organizationId: string,
    requesterId: string,
    type: ApprovalType,
    payload: any,
  ): Promise<boolean> {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: requesterId,
        },
      },
    });

    if (!membership) {
      throw new UnauthorizedException(
        'Requester is not a member of the organization.',
      );
    }

    if (membership.role === 'ADMIN' || membership.role === 'OWNER') {
      return false; // Auto-approved
    }

    return true; // Requires formal approval
  }
}
