import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { VaultsService } from '../vaults.service';
import {
  CreateVaultDto,
  UpdateVaultDto,
  CreateVaultSchema,
  UpdateVaultSchema,
  Permission,
} from '@repo/types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../authorization/guards/permissions.guard';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import { OrganizationContext } from '../../authorization/decorators/organization-context.decorator';

@Controller('organizations/:orgId/vaults')
@OrganizationContext('orgId')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VaultsController {
  constructor(private readonly vaultsService: VaultsService) {}

  @Post()
  @RequirePermissions(Permission.VAULT_CREATE)
  async createVault(
    @Param('orgId') orgId: string,
    @Request() req: RequestWithUser,
    @Body(new ZodValidationPipe(CreateVaultSchema)) dto: CreateVaultDto,
  ) {
    return this.vaultsService.createVault(orgId, req.user.id, dto);
  }

  @Get()
  @RequirePermissions(Permission.VAULT_READ)
  async getVaults(
    @Param('orgId') orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.vaultsService.getVaults(
      orgId,
      page ? parseInt(page, 10) : 1,
      limit ? Math.min(parseInt(limit, 10), 100) : 20,
    );
  }

  @Get(':vaultId')
  @RequirePermissions(Permission.VAULT_READ)
  async getVaultById(
    @Param('orgId') orgId: string,
    @Param('vaultId') vaultId: string,
  ) {
    return this.vaultsService.getVaultById(orgId, vaultId);
  }

  @Patch(':vaultId')
  @RequirePermissions(Permission.VAULT_UPDATE)
  async updateVault(
    @Param('orgId') orgId: string,
    @Param('vaultId') vaultId: string,
    @Request() req: RequestWithUser,
    @Body(new ZodValidationPipe(UpdateVaultSchema)) dto: UpdateVaultDto,
  ) {
    return this.vaultsService.updateVault(orgId, vaultId, req.user.id, dto);
  }

  @Delete(':vaultId')
  @RequirePermissions(Permission.VAULT_DELETE)
  async deleteVault(
    @Param('orgId') orgId: string,
    @Param('vaultId') vaultId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.vaultsService.deleteVault(orgId, vaultId, req.user.id);
  }
}
