import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BillingService } from './billing.service';
import { HdfcWebhookGuard } from './hdfc/hdfc-webhook.guard';
import { InitiateBillingDto, CancelSubscriptionDto } from './dto/billing.dto';
import type {
  HdfcReturnUrlParams,
  HdfcWebhookPayload,
} from './hdfc/hdfc-types';

/**
 * BillingController
 *
 * Routes:
 *   POST /organizations/:orgId/billing/initiate   [JWT]         — start payment
 *   GET  /organizations/:orgId/billing/status     [JWT]         — get subscription state
 *   POST /organizations/:orgId/billing/cancel     [JWT, OWNER]  — cancel subscription
 *   GET  /billing/return                          [PUBLIC]      — HDFC return URL handler
 *   POST /billing/webhook                         [Basic Auth]  — HDFC webhook receiver
 *
 * Security note:
 *   - /billing/return and /billing/webhook are intentionally PUBLIC routes
 *     (HDFC calls them server-to-server, no JWT available)
 *   - Webhook is protected by HdfcWebhookGuard (Basic Auth)
 *   - Return URL is protected by HMAC signature verification inside BillingService
 */
@Controller()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ─── Org-scoped routes (JWT protected) ─────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('organizations/:orgId/billing/initiate')
  async initiatePayment(
    @Param('orgId') orgId: string,
    @Body() dto: InitiateBillingDto,
    @Req() req: Request & { user: { userId: string; email: string } },
  ) {
    return this.billingService.initiatePayment(
      orgId,
      req.user.email,
      dto.plan,
      dto.billingCycle,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('organizations/:orgId/billing/status')
  async getStatus(@Param('orgId') orgId: string) {
    return this.billingService.getStatus(orgId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('organizations/:orgId/billing/cancel')
  async cancelSubscription(
    @Param('orgId') orgId: string,
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.billingService.cancelSubscription(
      orgId,
      dto.reason ?? 'User requested cancellation',
    );
  }

  // ─── Public routes (no JWT — HDFC server-to-server) ────────────────────────

  /**
   * HDFC Return URL handler.
   * HDFC redirects the customer here after payment completes.
   * Verifies HMAC, calls Order Status, then redirects the browser to the app.
   * Must be HTTPS — UAT uses the Render API URL.
   */
  @Get('billing/return')
  async handleReturn(
    @Query() params: HdfcReturnUrlParams,
    @Res() res: Response,
  ) {
    const result = await this.billingService.handleReturn(params);
    // Redirect customer browser to frontend pricing page
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    return res.redirect(`${appUrl}${result.redirectPath}`);
  }

  /**
   * HDFC Webhook receiver.
   * Protected by HdfcWebhookGuard (Basic Auth — HDFC_WEBHOOK_USERNAME/PASSWORD).
   * Must return HTTP 200 — HDFC retries until it receives 200.
   * Processing is fully idempotent.
   */
  @UseGuards(HdfcWebhookGuard)
  @Post('billing/webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: HdfcWebhookPayload) {
    await this.billingService.handleWebhook(payload);
    return { received: true };
  }
}
