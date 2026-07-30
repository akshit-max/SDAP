import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SecretLifecycleService } from '../secret-lifecycle.service';
import {
  CreateSecretSchema,
  UpdateSecretSchema,
  UpdateSecretMetadataSchema,
  Permission,
} from '@repo/types';
import {
  CreateSecretDto,
  UpdateSecretDto,
  UpdateSecretMetadataDto,
} from '../dto/vaults.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../authorization/guards/permissions.guard';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import { OrganizationContext } from '../../authorization/decorators/organization-context.decorator';

@ApiTags('Secrets')
@ApiBearerAuth()
@Controller('organizations/:orgId/vaults/:vaultId/secrets')
@OrganizationContext('orgId')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SecretsController {
  constructor(private readonly secretService: SecretLifecycleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new secret in a vault' })
  @RequirePermissions(Permission.SECRET_CREATE)
  async createSecret(
    @Param('orgId') orgId: string,
    @Param('vaultId') vaultId: string,
    @Request() req: RequestWithUser,
    @Body(new ZodValidationPipe(CreateSecretSchema)) dto: CreateSecretDto,
  ) {
    return this.secretService.createSecret({
      vaultId,
      name: dto.name,
      description: dto.description,
      type: dto.type,
      plaintext: dto.plaintext,
      organizationId: orgId,
      userId: req.user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List secrets in a vault (metadata only)' })
  @RequirePermissions(Permission.SECRET_READ)
  async getSecrets(@Param('vaultId') vaultId: string) {
    return this.secretService.getSecretsByVaultId(vaultId);
  }

  @Get(':secretId')
  @ApiOperation({ summary: 'Get secret details (metadata only)' })
  @RequirePermissions(Permission.SECRET_READ)
  async getSecretById(@Param('secretId') secretId: string) {
    return this.secretService.getSecretMetadataById(secretId);
  }

  @Post(':secretId/reveal')
  @ApiOperation({ summary: 'Reveal the plaintext value of a secret' })
  @RequirePermissions(Permission.SECRET_REVEAL)
  async revealSecret(
    @Param('orgId') orgId: string,
    @Param('secretId') secretId: string,
    @Request() req: RequestWithUser,
    @Body('reason') reason?: string,
  ) {
    const plaintext = await this.secretService.revealSecret({
      secretId,
      organizationId: orgId,
      userId: req.user.id,
      reason,
    });
    return { plaintext };
  }

  @Patch(':secretId')
  @ApiOperation({ summary: 'Update the metadata of a secret' })
  @RequirePermissions(Permission.SECRET_UPDATE)
  async updateSecret(
    @Param('orgId') orgId: string,
    @Param('secretId') secretId: string,
    @Request() req: RequestWithUser,
    @Body() body: Record<string, unknown>,
  ) {
    // Determine if this is a plaintext update or a metadata update
    if ('plaintext' in body && body.plaintext !== undefined) {
      const dto = new ZodValidationPipe(UpdateSecretSchema).transform(body, {
        type: 'body',
      });
      return this.secretService.updateSecret({
        secretId,
        plaintext: dto.plaintext,
        organizationId: orgId,
        userId: req.user.id,
      });
    } else {
      const dto = new ZodValidationPipe(UpdateSecretMetadataSchema).transform(
        body,
        { type: 'body' },
      );
      return this.secretService.updateSecret({
        secretId,
        name: dto.name,
        description: dto.description,
        status: dto.status,
        organizationId: orgId,
        userId: req.user.id,
      });
    }
  }

  @Delete(':secretId')
  @ApiOperation({ summary: 'Delete a secret' })
  @RequirePermissions(Permission.SECRET_DELETE)
  async deleteSecret(
    @Param('orgId') orgId: string,
    @Param('secretId') secretId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.secretService.softDeleteSecret(secretId, req.user.id, orgId);
  }
}
