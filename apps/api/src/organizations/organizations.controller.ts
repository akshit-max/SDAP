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
  CreateOrganizationDto,
  UpdateOrganizationSchema,
  UpdateOrganizationDto,
  CreateInvitationSchema,
  CreateInvitationDto,
  Permission,
} from '@repo/types';
import { PermissionsGuard } from '../authorization/guards/permissions.guard';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { OrganizationContext } from '../authorization/decorators/organization-context.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  async create(
    @Request() req: any,
    @Body(new ZodValidationPipe(CreateOrganizationSchema))
    dto: CreateOrganizationDto,
  ) {
    const org = await this.organizationsService.create(req.user.id, dto);
    return { success: true, data: org };
  }

  @Get()
  async findAll(@Request() req: any) {
    const orgs = await this.organizationsService.findAllForUser(req.user.id);
    return { success: true, data: orgs };
  }

  @Get('current')
  async findCurrent(@Request() req: any) {
    const orgs = await this.organizationsService.findAllForUser(req.user.id);
    return { success: true, data: orgs.length > 0 ? orgs[0] : null };
  }

  @RequirePermissions(Permission.ORGANIZATION_READ)
  @OrganizationContext('id')
  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const org = await this.organizationsService.findOne(id);
    return { success: true, data: org };
  }

  @RequirePermissions(Permission.ORGANIZATION_READ)
  @OrganizationContext('id')
  @Get(':id/members')
  async getMembers(@Request() req: any, @Param('id') id: string) {
    const members = await this.organizationsService.getMembers(id);
    return { success: true, data: members };
  }

  @RequirePermissions(Permission.ORGANIZATION_UPDATE)
  @OrganizationContext('id')
  @Patch(':id')
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
  async getPendingInvitations(@Param('id') id: string) {
    const invites = await this.organizationsService.getPendingInvitations(id);
    return { success: true, data: invites };
  }

  @RequirePermissions(Permission.MEMBER_INVITE)
  @OrganizationContext('id')
  @Delete(':id/invites/:inviteId')
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
  async removeMember(
    @Request() req: any,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    await this.organizationsService.removeMember(id, memberId, req.user.id);
    return { success: true };
  }
}
