import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationProvider } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../authorization/guards/permissions.guard';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { Permission } from '@repo/types';
import { OrganizationContext } from '../authorization/decorators/organization-context.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { IntegrationsService } from './integrations.service';
import {
  ConnectIntegrationSchema,
  ConnectIntegrationDto,
  GrantIntegrationAccessSchema,
  GrantIntegrationAccessDto,
  RevokeIntegrationAccessSchema,
  RevokeIntegrationAccessDto,
} from './integrations.dto';

@ApiTags('Integrations')
@ApiBearerAuth()
@Controller('organizations/:orgId/integrations')
@OrganizationContext('orgId')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  /**
   * GET /organizations/:orgId/integrations
   * List all supported providers and their connection status.
   */
  @Get()
  @ApiOperation({ summary: 'List all integration connections for an organization' })
  @RequirePermissions(Permission.INTEGRATION_READ)
  listConnections(@Param('orgId') orgId: string) {
    return this.integrationsService.listConnections(orgId);
  }

  /**
   * POST /organizations/:orgId/integrations/connect
   * Connect a provider using a PAT.
   */
  @Post('connect')
  @ApiOperation({ summary: 'Connect an integration provider with a Personal Access Token' })
  @RequirePermissions(Permission.INTEGRATION_CONNECT)
  connect(
    @Param('orgId') orgId: string,
    @Request() req: RequestWithUser,
    @Body(new ZodValidationPipe(ConnectIntegrationSchema)) dto: ConnectIntegrationDto,
  ) {
    return this.integrationsService.connect(orgId, req.user.id, dto);
  }

  /**
   * DELETE /organizations/:orgId/integrations/:provider
   * Disconnect a provider.
   */
  @Delete(':provider')
  @ApiOperation({ summary: 'Disconnect an integration provider' })
  @RequirePermissions(Permission.INTEGRATION_DISCONNECT)
  disconnect(
    @Param('orgId') orgId: string,
    @Param('provider') provider: IntegrationProvider,
    @Request() req: RequestWithUser,
  ) {
    return this.integrationsService.disconnect(orgId, req.user.id, provider);
  }

  /**
   * GET /organizations/:orgId/integrations/:provider/health
   * Run a health check against the provider API.
   */
  @Get(':provider/health')
  @ApiOperation({ summary: 'Health check for a connected provider' })
  @RequirePermissions(Permission.INTEGRATION_READ)
  healthCheck(
    @Param('orgId') orgId: string,
    @Param('provider') provider: IntegrationProvider,
  ) {
    return this.integrationsService.healthCheck(orgId, provider);
  }

  /**
   * GET /organizations/:orgId/integrations/:provider/resources
   * List resources available to the connected provider account.
   */
  @Get(':provider/resources')
  @ApiOperation({ summary: 'List provider resources (teams, orgs, domains)' })
  @RequirePermissions(Permission.INTEGRATION_READ)
  listResources(
    @Param('orgId') orgId: string,
    @Param('provider') provider: IntegrationProvider,
  ) {
    return this.integrationsService.listResources(orgId, provider);
  }

  /**
   * POST /organizations/:orgId/integrations/:provider/grant
   * Grant platform access to a principal via the provider.
   */
  @Post(':provider/grant')
  @ApiOperation({ summary: 'Grant access to a resource on the integration provider' })
  @RequirePermissions(Permission.SESSION_START)
  grantAccess(
    @Param('orgId') orgId: string,
    @Param('provider') provider: IntegrationProvider,
    @Body(new ZodValidationPipe(GrantIntegrationAccessSchema)) dto: GrantIntegrationAccessDto,
    @Request() _req: RequestWithUser,
  ) {
    return this.integrationsService.grantAccess(orgId, provider, dto);
  }

  /**
   * POST /organizations/:orgId/integrations/:provider/revoke
   * Revoke platform access from a principal via the provider.
   */
  @Post(':provider/revoke')
  @ApiOperation({ summary: 'Revoke access from a resource on the integration provider' })
  @RequirePermissions(Permission.SESSION_REVOKE)
  revokeAccess(
    @Param('orgId') orgId: string,
    @Param('provider') provider: IntegrationProvider,
    @Body(new ZodValidationPipe(RevokeIntegrationAccessSchema)) dto: RevokeIntegrationAccessDto,
    @Request() _req: RequestWithUser,
  ) {
    return this.integrationsService.revokeAccess(orgId, provider, dto);
  }
}
