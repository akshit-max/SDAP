import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from '@repo/types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrganizationCreatedEvent } from './organizations.events';
import { OrganizationAccessService } from './organization-access.service';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: OrganizationAccessService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async generateUniqueSlug(baseName: string): Promise<string> {
    const baseSlug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const exists = await this.prisma.organization.findUnique({ where: { slug } });
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
      // Create the organization
      const org = await tx.organization.create({
        data: {
          name: dto.name,
          slug,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // Add the creator as the initial OWNER
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

    this.eventEmitter.emit('organization.created', new OrganizationCreatedEvent(organization.id, organization.name, userId));

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
    await this.accessService.requireMembership(userId, orgId);
    return this.prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
  }

  async update(userId: string, orgId: string, dto: UpdateOrganizationDto) {
    await this.accessService.requireOwner(userId, orgId);
    
    return this.prisma.organization.update({
      where: { id: orgId },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }
}
