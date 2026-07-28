import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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
  Permission,
} from '@repo/types';
import { PermissionsGuard } from '../authorization/guards/permissions.guard';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { OrganizationContext } from '../authorization/decorators/organization-context.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/organizations')
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
    const org = await this.organizationsService.findOne(req.user.id, id);
    return { success: true, data: org };
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
    @Body('email') email: string,
  ) {
    const result = await this.organizationsService.invite(
      req.user.id,
      id,
      email,
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
}
