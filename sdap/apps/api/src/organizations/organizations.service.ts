import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from '@repo/types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrganizationCreatedEvent } from './organizations.events';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async generateUniqueSlug(baseName: string): Promise<string> {
    const baseSlug = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const exists = await this.prisma.organization.findUnique({
        where: { slug },
      });
      if (!exists) {
        return slug;
      }
      counter++;
      slug = `${baseSlug}-${counter}`;
    }
  }

  async create(userId: string, dto: CreateOrganizationDto) {
    const slug = await this.generateUniqueSlug(dto.name);

    const organization = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: dto.name,
          slug,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: userId,
          role: 'OWNER',
          createdBy: userId,
          updatedBy: userId,
        },
      });

      return org;
    });

    this.eventEmitter.emit(
      'organization.created',
      new OrganizationCreatedEvent(organization.id, organization.name, userId),
    );

    return organization;
  }

  async findAllForUser(userId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId, removedAt: null },
      include: {
        organization: true,
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => m.organization);
  }

  async findOne(userId: string, orgId: string) {
    // Controller/Guard now handles permission check
    return this.prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
  }

  async update(userId: string, orgId: string, dto: UpdateOrganizationDto) {
    // Controller/Guard now handles permission check
    return this.prisma.organization.update({
      where: { id: orgId },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }

  async invite(userId: string, orgId: string, email: string) {
    // Controller/Guard now handles permission check
    const crypto = await import('crypto');
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.organizationInvitation.upsert({
      where: {
        organizationId_email: {
          organizationId: orgId,
          email,
        },
      },
      update: {
        tokenHash,
        expiresAt,
        status: 'PENDING',
        invitedBy: userId,
        updatedBy: userId,
      },
      create: {
        organizationId: orgId,
        email,
        tokenHash,
        expiresAt,
        invitedBy: userId,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    const { MemberInvitedEvent } = await import('./organizations.events');
    this.eventEmitter.emit(
      'member.invited',
      new MemberInvitedEvent(orgId, email, userId),
    );

    return { rawToken };
  }

  async acceptInvite(userId: string, rawToken: string) {
    const crypto = await import('crypto');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { tokenHash },
    });

    if (!invitation) {
      throw new ConflictException('Invalid invitation token');
    }

    if (invitation.status !== 'PENDING') {
      throw new ConflictException(`Invitation is ${invitation.status}`);
    }

    if (new Date() > invitation.expiresAt) {
      await this.prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new ConflictException('Invitation expired');
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (user.email !== invitation.email) {
      throw new ConflictException(
        'This invitation was sent to a different email address',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED', updatedBy: userId },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: invitation.organizationId,
          userId: userId,
          role: 'MEMBER', // In seed.ts we used MEMBER, not OWNER for members.
          invitedBy: invitation.invitedBy,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    });

    const { InvitationAcceptedEvent } = await import('./organizations.events');
    this.eventEmitter.emit(
      'invitation.accepted',
      new InvitationAcceptedEvent(invitation.organizationId, userId),
    );

    return { success: true };
  }
}
