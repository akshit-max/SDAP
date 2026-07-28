import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MembershipResolver {
  constructor(private readonly prisma: PrismaService) {}

  async resolveMembership(userId: string, organizationId: string) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!membership || membership.removedAt !== null) {
      throw new NotFoundException('Organization not found'); // hide existence
    }

    return membership;
  }
}
