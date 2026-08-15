import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  CreateInvitationSchema,
  Permission,
} from '@repo/types';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  CreateInvitationDto,
} from './dto/organizations.dto';
import { PermissionsGuard } from '../authorization/guards/permissions.guard';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { OrganizationContext } from '../authorization/decorators/organization-context.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  async create(
    @Request() req: any,
    @Body(new ZodValidationPipe(CreateOrganizationSchema))
    dto: CreateOrganizationDto,
  ) {
    const org = await this.organizationsService.create(req.user.id, dto);
    return { success: true, data: org };
  }

  @Get()
  @ApiOperation({ summary: 'List all organizations for user' })
  async findAll(@Request() req: any) {
    const orgs = await this.organizationsService.findAllForUser(req.user.id);
    return { success: true, data: orgs };
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current organization' })
  async findCurrent(@Request() req: any) {
    const orgs = await this.organizationsService.findAllForUser(req.user.id);
    return { success: true, data: orgs.length > 0 ? orgs[0] : null };
  }

  @RequirePermissions(Permission.ORGANIZATION_READ)
  @OrganizationContext('id')
  @Get(':id')
  @ApiOperation({ summary: 'Get an organization by ID' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    const org = await this.organizationsService.findOne(id);
    return { success: true, data: org };
  }

  @RequirePermissions(Permission.ORGANIZATION_READ)
  @OrganizationContext('id')
  @Get(':id/members')
  @ApiOperation({ summary: 'Get organization members' })
  async getMembers(@Request() req: any, @Param('id') id: string) {
    const members = await this.organizationsService.getMembers(id);
    return { success: true, data: members };
  }

  @RequirePermissions(Permission.ORGANIZATION_UPDATE)
  @OrganizationContext('id')
  @Patch(':id')
  @ApiOperation({ summary: 'Update an organization' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateOrganizationSchema))
    dto: UpdateOrganizationDto,
  ) {
    const org = await this.organizationsService.update(req.user.id, id, dto);
    return { success: true, data: org };
  }

  @RequirePermissions(Permission.MEMBER_INVITE)
  @OrganizationContext('id')
  @Post(':id/invites')
  @ApiOperation({ summary: 'Invite a member to the organization' })
  async invite(
    @Request() req: any,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateInvitationSchema))
    dto: CreateInvitationDto,
  ) {
    const result = await this.organizationsService.invite(
      req.user.id,
      id,
      dto.email,
    );
    return { success: true, data: result };
  }

  @Post('invites/:token/accept')
  @ApiOperation({ summary: 'Accept an invitation' })
  async acceptInvite(@Request() req: any, @Param('token') token: string) {
    const result = await this.organizationsService.acceptInvite(
      req.user.id,
      token,
    );
    return result;
  }

  @RequirePermissions(Permission.MEMBER_INVITE)
  @OrganizationContext('id')
  @Get(':id/invites')
  @ApiOperation({ summary: 'Get pending invitations' })
  async getPendingInvitations(@Param('id') id: string) {
    const invites = await this.organizationsService.getPendingInvitations(id);
    return { success: true, data: invites };
  }

  @RequirePermissions(Permission.MEMBER_INVITE)
  @OrganizationContext('id')
  @Delete(':id/invites/:inviteId')
  @ApiOperation({ summary: 'Cancel a pending invitation' })
  async cancelInvitation(
    @Request() req: any,
    @Param('id') id: string,
    @Param('inviteId') inviteId: string,
  ) {
    await this.organizationsService.cancelInvitation(id, inviteId, req.user.id);
    return { success: true };
  }

  @RequirePermissions(Permission.MEMBER_UPDATE_ROLE)
  @OrganizationContext('id')
  @Patch(':id/members/:memberId/role')
  @ApiOperation({ summary: 'Change a member role' })
  async changeMemberRole(
    @Request() req: any,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() body: { role: 'ADMIN' | 'MEMBER' },
  ) {
    const updated = await this.organizationsService.changeMemberRole(
      id,
      memberId,
      body.role,
      req.user.id,
    );
    return { success: true, data: updated };
  }

  @RequirePermissions(Permission.MEMBER_REMOVE)
  @OrganizationContext('id')
  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove a member' })
  async removeMember(
    @Request() req: any,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    await this.organizationsService.removeMember(id, memberId, req.user.id);
    return { success: true };
  }

  @RequirePermissions(Permission.MEMBER_REMOVE)
  @OrganizationContext('id')
  @Post(':id/members/:memberId/offboard')
  @ApiOperation({ summary: 'Offboard a member: revoke all sessions, tokens, pending approvals, and remove membership' })
  async offboardMember(
    @Request() req: any,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.organizationsService.offboardMember(id, memberId, req.user.id);
  }
}
