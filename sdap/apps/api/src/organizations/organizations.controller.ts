import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateOrganizationSchema, CreateOrganizationDto, UpdateOrganizationSchema, UpdateOrganizationDto } from '@repo/types';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  async create(
    @Request() req: any,
    @Body(new ZodValidationPipe(CreateOrganizationSchema)) dto: CreateOrganizationDto
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
    // For now, if the user asks for current, we just return the most recently joined one.
    // In Phase 6 (Sessions), the current org will be bound to the session token.
    const orgs = await this.organizationsService.findAllForUser(req.user.id);
    return { success: true, data: orgs.length > 0 ? orgs[0] : null };
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const org = await this.organizationsService.findOne(req.user.id, id);
    return { success: true, data: org };
  }

  @Patch(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateOrganizationSchema)) dto: UpdateOrganizationDto
  ) {
    const org = await this.organizationsService.update(req.user.id, id, dto);
    return { success: true, data: org };
  }
}
