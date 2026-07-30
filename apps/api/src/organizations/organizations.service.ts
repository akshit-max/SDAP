import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from '@repo/types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  OrganizationCreatedEvent,
  MemberInvitedEvent,
  InvitationAcceptedEvent,
} from './organizations.events';
import { ORG_CONFIG } from '@repo/config';

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
    // Enforce maximum organizations per user
    const existingCount = await this.prisma.organizationMember.count({
      where: { userId, removedAt: null },
    });
    if (existingCount >= ORG_CONFIG.MAX_ORGS_PER_USER) {
      throw new BadRequestException(
        `You cannot belong to more than ${ORG_CONFIG.MAX_ORGS_PER_USER} organizations.`,
      );
    }

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

  async findOne(orgId: string) {
    return this.prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
  }

  async getMembers(orgId: string) {
    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId: orgId, removedAt: null },
      include: { user: { select: { id: true, email: true, fullName: true, isActive: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    return members;
  }

  async update(userId: string, orgId: string, dto: UpdateOrganizationDto) {
    return this.prisma.organization.update({
      where: { id: orgId },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }

  async invite(userId: string, orgId: string, email: string) {
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

    this.eventEmitter.emit(
      'member.invited',
      new MemberInvitedEvent(orgId, email, userId, rawToken),
    );

    return { rawToken };
  }

  async acceptInvite(userId: string, rawToken: string) {
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
          role: 'MEMBER',
          invitedBy: invitation.invitedBy,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    });

    this.eventEmitter.emit(
      'invitation.accepted',
      new InvitationAcceptedEvent(invitation.organizationId, userId),
    );

    return { success: true };
  }

  async getPendingInvitations(orgId: string) {
    return this.prisma.organizationInvitation.findMany({
      where: { organizationId: orgId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        invitedBy: true,
      },
    });
  }

  async cancelInvitation(orgId: string, inviteId: string, userId: string) {
    const invite = await this.prisma.organizationInvitation.findFirst({
      where: { id: inviteId, organizationId: orgId, status: 'PENDING' },
    });
    if (!invite) {
      throw new ConflictException('Invitation not found or already processed');
    }
    return this.prisma.organizationInvitation.update({
      where: { id: inviteId },
      data: { status: 'REVOKED', updatedBy: userId },
    });
  }

  async changeMemberRole(
    orgId: string,
    memberId: string,
    role: 'ADMIN' | 'MEMBER',
    requestorId: string,
  ) {
    const member = await this.prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId: orgId, removedAt: null },
    });
    if (!member) throw new ConflictException('Member not found');
    if (member.role === 'OWNER') {
      throw new ConflictException('Cannot change the role of an OWNER');
    }
    return this.prisma.organizationMember.update({
      where: { id: memberId },
      data: { role, updatedBy: requestorId },
      include: { user: { select: { id: true, email: true, fullName: true } } },
    });
  }

  async removeMember(orgId: string, memberId: string, requestorId: string) {
    const member = await this.prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId: orgId, removedAt: null },
    });
    if (!member) throw new ConflictException('Member not found');
    if (member.role === 'OWNER') {
      throw new ConflictException('Cannot remove the OWNER of an organization');
    }
    if (member.userId === requestorId) {
      throw new ConflictException('You cannot remove yourself');
    }
    return this.prisma.organizationMember.update({
      where: { id: memberId },
      data: { removedAt: new Date(), updatedBy: requestorId },
    });
  }
}
