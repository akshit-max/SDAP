import { Injectable, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async requireMembership(userId: string, organizationId: string) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!membership || membership.removedAt !== null) {
      // If we throw Forbidden, they know it exists. If we throw NotFound, we hide existence.
      // Usually, if you're not a member, you shouldn't even know it exists.
      throw new NotFoundException('Organization not found');
    }

    return membership;
  }

  async requireOwner(userId: string, organizationId: string) {
    const membership = await this.requireMembership(userId, organizationId);
    
    if (membership.role !== 'OWNER') {
      throw new ForbiddenException('You must be an owner to perform this action');
    }

    return membership;
  }
}
