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
import { WebhooksService } from './webhooks.service';
import { CreateWebhookSchema, CreateWebhookDto, WEBHOOK_EVENTS } from './webhooks.dto';

@ApiTags('Webhooks')
@ApiBearerAuth()
@Controller('organizations/:orgId/webhooks')
@OrganizationContext('orgId')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  /** List available event types */
  @Get('events')
  @ApiOperation({ summary: 'List all webhook event types' })
  @RequirePermissions(Permission.ORGANIZATION_READ)
  listEvents() {
    return { events: WEBHOOK_EVENTS };
  }

  /** List active subscriptions */
  @Get()
  @ApiOperation({ summary: 'List webhook subscriptions' })
  @RequirePermissions(Permission.ORGANIZATION_READ)
  list(@Param('orgId') orgId: string) {
    return this.webhooksService.listSubscriptions(orgId);
  }

  /** Create a new subscription */
  @Post()
  @ApiOperation({ summary: 'Create a webhook subscription' })
  @RequirePermissions(Permission.ORGANIZATION_UPDATE)
  create(
    @Param('orgId') orgId: string,
    @Request() _req: RequestWithUser,
    @Body(new ZodValidationPipe(CreateWebhookSchema)) dto: CreateWebhookDto,
  ) {
    return this.webhooksService.createSubscription(orgId, dto.url, dto.events, dto.description);
  }

  /** Delete a subscription */
  @Delete(':subscriptionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a webhook subscription' })
  @RequirePermissions(Permission.ORGANIZATION_UPDATE)
  async delete(
    @Param('orgId') orgId: string,
    @Param('subscriptionId') subscriptionId: string,
  ) {
    await this.webhooksService.deleteSubscription(orgId, subscriptionId);
  }
}
