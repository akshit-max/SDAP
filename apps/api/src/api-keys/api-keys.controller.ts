import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../authorization/guards/permissions.guard';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { Permission } from '@repo/types';
import { OrganizationContext } from '../authorization/decorators/organization-context.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeySchema, CreateApiKeyDto } from './api-keys.dto';

@ApiTags('API Keys')
@ApiBearerAuth()
@Controller('organizations/:orgId/api-keys')
@OrganizationContext('orgId')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  /**
   * GET /organizations/:orgId/api-keys
   * List all active API keys (prefixes only — never raw keys).
   */
  @Get()
  @ApiOperation({ summary: 'List API keys for an organization' })
  @RequirePermissions(Permission.ORGANIZATION_READ)
  list(@Param('orgId') orgId: string) {
    return this.apiKeysService.list(orgId);
  }

  /**
   * POST /organizations/:orgId/api-keys
   * Create a new API key. Returns the raw key ONCE — never shown again.
   */
  @Post()
  @ApiOperation({ summary: 'Create an API key (raw key shown once)' })
  @RequirePermissions(Permission.ORGANIZATION_UPDATE)
  create(
    @Param('orgId') orgId: string,
    @Request() req: RequestWithUser,
    @Body(new ZodValidationPipe(CreateApiKeySchema)) dto: CreateApiKeyDto,
  ) {
    return this.apiKeysService.create(orgId, req.user.id, dto);
  }

  /**
   * DELETE /organizations/:orgId/api-keys/:keyId
   * Revoke an API key immediately.
   */
  @Delete(':keyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke an API key' })
  @RequirePermissions(Permission.ORGANIZATION_UPDATE)
  async revoke(
    @Param('orgId') orgId: string,
    @Param('keyId') keyId: string,
    @Request() req: RequestWithUser,
  ) {
    await this.apiKeysService.revoke(orgId, keyId, req.user.id);
  }

  /**
   * POST /organizations/:orgId/api-keys/:keyId/rotate
   * Revoke old key, generate new one with same name/TTL.
   * Returns new raw key ONCE.
   */
  @Post(':keyId/rotate')
  @ApiOperation({ summary: 'Rotate an API key (revoke + regenerate)' })
  @RequirePermissions(Permission.ORGANIZATION_UPDATE)
  rotate(
    @Param('orgId') orgId: string,
    @Param('keyId') keyId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.apiKeysService.rotate(orgId, keyId, req.user.id);
  }
}
