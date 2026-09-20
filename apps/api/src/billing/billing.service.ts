import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  BillingCycle,
  Payment,
  PlanTier,
  Subscription,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HdfcGatewayService } from './hdfc/hdfc-gateway.service';
import { HdfcSignatureService } from './hdfc/hdfc-signature.service';
import { SubscriptionService } from './subscription/subscription.service';
import type {
  HdfcReturnUrlParams,
  HdfcWebhookPayload,
} from './hdfc/hdfc-types';
import { HDFC_WEBHOOK_EVENTS } from './hdfc/hdfc-types';

// ─── Plan pricing constants (mirrored server-side from billing.ts) ────────────
// These are the source of truth for server-side billing calculations.
// NEVER trust amounts from the client.
const PLAN_BASE_PRICES: Record<string, Record<string, number | null>> = {
  PRO: { MONTHLY: 499, ANNUAL: 4990 },
  BUSINESS: { MONTHLY: 1999, ANNUAL: 19990 },
};
const INCLUDED_SEATS: Record<string, number> = { PRO: 5, BUSINESS: 15 };
const EXTRA_USER_RATES: Record<string, Record<string, number | null>> = {
  PRO: { MONTHLY: 50, ANNUAL: 500 },
  BUSINESS: { MONTHLY: 50, ANNUAL: null }, // Annual extra-user rate TBD — keep null until confirmed
};
// Note: mandate max amounts are now read from HDFC_MAX_AMOUNT_PRO / HDFC_MAX_AMOUNT_BUSINESS env vars
// (not hardcoded — wired through ConfigService in BillingService constructor)
const GRACE_PERIOD_DAYS = 3;
const MAX_FAILURES_BEFORE_EXPIRE = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a unique HDFC-compatible ID: max 21 chars, alphanumeric, starts with a letter */
function generateHdfcId(prefix: string): string {
  const rand = Math.random().toString(36).substring(2, 14).toUpperCase();
  const ts = Date.now().toString(36).toUpperCase().slice(-6);
  return `${prefix}${ts}${rand}`.substring(0, 21);
}

/** Format an INR integer as a decimal string for HDFC APIs (e.g. 499 → "499.00") */
function formatAmount(inr: number): string {
  return inr.toFixed(2);
}

/**
 * Calculate billing amount server-side. Returns null if not calculable (e.g. BUSINESS ANNUAL).
 * This mirrors the logic in apps/web/lib/subscription/billing.ts — server is authoritative.
 */
function calculateBillingAmount(
  plan: PlanTier,
  billingCycle: BillingCycle,
  activeSeats: number,
): {
  baseAmount: number;
  extraUsers: number;
  extraUserRate: number;
  totalAmount: number;
} | null {
  const base = PLAN_BASE_PRICES[plan]?.[billingCycle];
  if (base === null || base === undefined) return null;

  const included = INCLUDED_SEATS[plan] ?? 5;
  const extraUsers = Math.max(0, activeSeats - included);
  const extraUserRate = EXTRA_USER_RATES[plan]?.[billingCycle] ?? null;

  if (extraUsers > 0 && extraUserRate === null) return null; // Cannot calculate

  const totalAmount = base + extraUsers * (extraUserRate ?? 0);
  return {
    baseAmount: base,
    extraUsers,
    extraUserRate: extraUserRate ?? 0,
    totalAmount,
  };
}

/**
 * Add one billing period to a date, anchored to the given start.
 * MONTHLY = add 1 month; ANNUAL = add 1 year.
 */
function addBillingPeriod(from: Date, cycle: BillingCycle): Date {
  const d = new Date(from);
  if (cycle === 'MONTHLY') {
    d.setMonth(d.getMonth() + 1);
  } else {
    d.setFullYear(d.getFullYear() + 1);
  }
  return d;
}

// ─── BillingService ───────────────────────────────────────────────────────────

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly paymentPageClientId: string;
  private readonly returnUrl: string;
  private readonly mandateMaxAmounts: Record<string, string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly hdfc: HdfcGatewayService,
    private readonly signature: HdfcSignatureService,
    private readonly subscriptions: SubscriptionService,
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.paymentPageClientId = this.config.getOrThrow<string>(
      'HDFC_PAYMENT_PAGE_CLIENT_ID',
    );
    this.returnUrl = this.config.getOrThrow<string>('HDFC_RETURN_URL');
    // Mandate max amounts from env (configurable without code deploy)
    this.mandateMaxAmounts = {
      PRO: this.config.getOrThrow<string>('HDFC_MAX_AMOUNT_PRO'),
      BUSINESS: this.config.getOrThrow<string>('HDFC_MAX_AMOUNT_BUSINESS'),
    };
  }

  // ─── 1. Initiate Payment ────────────────────────────────────────────────────

  /**
   * Creates a new payment session with mandate registration.
   * Called when an org owner clicks "Upgrade" on the pricing page.
   *
   * Security: amount calculated server-side from org member count.
   * Never trusts client-sent amount.
   */
  async initiatePayment(
    organizationId: string,
    ownerEmail: string,
    plan: PlanTier,
    billingCycle: BillingCycle,
  ): Promise<{ paymentLink: string; orderId: string }> {
    // Guard: no duplicate active subscriptions
    const existing = await this.subscriptions.findByOrgId(organizationId);
    if (existing?.status === 'ACTIVE') {
      throw new ConflictException(
        'Organization already has an active subscription',
      );
    }

    // Count active seats (server-side authority)
    const activeSeats =
      await this.subscriptions.countActiveSeats(organizationId);

    // Calculate amount server-side
    const billing = calculateBillingAmount(plan, billingCycle, activeSeats);
    if (!billing) {
      throw new BadRequestException(
        `Cannot calculate billing amount for ${plan} ${billingCycle} plan with ${activeSeats} seats. Please contact support.`,
      );
    }

    const { baseAmount, extraUsers, extraUserRate, totalAmount } = billing;

    // Generate stable IDs
    const orderId = generateHdfcId('wPM'); // Payment order ID
    const mandateId = generateHdfcId('mnd'); // Mandate ID — stored on Subscription
    const customerId = `cust-${organizationId.substring(0, 8)}`;

    // Record as PENDING before calling HDFC (if HDFC fails, we can clean up)
    await this.subscriptions.setPending(organizationId, {
      plan,
      billingCycle,
      hdfcCustomerId: customerId,
      hdfcMandateId: mandateId,
      baseAmount,
      extraUsers,
      extraUserRate,
      totalAmount,
    });

    // Create PENDING payment record
    await this.prisma.payment.create({
      data: {
        subscription: { connect: { organizationId } },
        type: 'MANDATE_REGISTRATION',
        status: 'PENDING',
        hdfcOrderId: orderId,
        amount: totalAmount,
        seatsAtCharge: activeSeats,
      },
    });

    // Mandate date range: today → +3 years
    const today = new Date();
    const mandateEnd = new Date(today);
    mandateEnd.setFullYear(today.getFullYear() + 3);
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    // Call HDFC Session API with mandate registration
    const session = await this.hdfc.createSessionWithMandate({
      order_id: orderId,
      amount: formatAmount(totalAmount),
      customer_id: customerId,
      customer_email: ownerEmail,
      customer_phone: '9999999999', // Placeholder — TODO: store phone on User
      payment_page_client_id: this.paymentPageClientId,
      action: 'paymentPage',
      currency: 'INR',
      return_url: this.returnUrl,
      description: `WITHUS ${plan} — ${billingCycle} Subscription`,
      options: { create_mandate: 'REQUIRED' },
      mandate: {
        max_amount: this.mandateMaxAmounts[plan] ?? '5000', // falls back to PRO default
        frequency: billingCycle === 'MONTHLY' ? 'MONTH' : 'YEAR',
        mandate_id: mandateId,
        start_date: today.toISOString().split('T')[0] as string,
        end_date: mandateEnd.toISOString().split('T')[0] as string,
      },
    });

    this.logger.log(
      `[INITIATE] Session created for org ${organizationId}, order ${orderId}`,
    );
    const paymentLink = session.payment_links?.web;
    if (!paymentLink) {
      throw new InternalServerErrorException(
        'HDFC API did not return a payment link',
      );
    }
    return { paymentLink, orderId };
  }

  // ─── 2. Handle Return URL ───────────────────────────────────────────────────

  /**
   * Called when HDFC redirects the customer back after payment.
   * Verifies HMAC, then calls Order Status to confirm payment.
   * Idempotent — safe to call multiple times for the same order.
   */
  async handleReturn(params: HdfcReturnUrlParams): Promise<{
    success: boolean;
    orderId: string;
    redirectPath: string;
  }> {
    const orderId = params.order_id;
    if (!orderId)
      throw new BadRequestException('Missing order_id in return URL');

    // SECURITY: Verify HMAC — log mismatch but do NOT block in UAT (sandbox RESPONSE_KEY may differ).
    // In production, HMAC failure should be a hard reject. Order Status API is the authoritative verifier.
    const hmacValid = this.signature.verifyReturnUrl(params);
    if (!hmacValid) {
      this.logger.warn(
        `[RETURN] HMAC verification failed for order ${orderId} — proceeding to Order Status API for verification`,
      );
      // Fall through — Order Status API will confirm or reject the payment
    }

    // Idempotency: find existing payment record
    const payment = await this.prisma.payment.findUnique({
      where: { hdfcOrderId: orderId },
    });
    if (!payment) {
      this.logger.warn(`[RETURN] No payment record found for order ${orderId}`);
      return {
        success: false,
        orderId,
        redirectPath: '/pricing?error=payment_not_found',
      };
    }

    // Already processed — idempotent return
    if (payment.status === 'SUCCESS') {
      this.logger.log(
        `[RETURN] Order ${orderId} already processed — idempotent return`,
      );
      return { success: true, orderId, redirectPath: '/pricing?success=true' };
    }

    // Call Order Status API — this is the authoritative backend verification, not the browser redirect
    return this.confirmOrderAndActivate(payment, 'return_url');
  }

  // ─── 3. Handle Webhook ──────────────────────────────────────────────────────

  /**
   * Processes HDFC webhook events.
   * Authentication is handled by HdfcWebhookGuard (Basic Auth) before reaching here.
   * All processing is idempotent — HDFC may deliver events multiple times.
   */
  async handleWebhook(payload: HdfcWebhookPayload): Promise<void> {
    const { event_name, content } = payload;
    const order = content?.order;
    if (!order?.order_id) {
      this.logger.warn(
        `[WEBHOOK] Received event ${event_name} with no order data`,
      );
      return;
    }

    this.logger.log(`[WEBHOOK] ${event_name} for order ${order.order_id}`);

    switch (event_name) {
      case HDFC_WEBHOOK_EVENTS.ORDER_SUCCEEDED:
        await this.handleOrderSucceededWebhook(order.order_id);
        break;
      case HDFC_WEBHOOK_EVENTS.ORDER_FAILED:
        await this.handleOrderFailedWebhook(
          order.order_id,
          order.bank_error_message ?? 'Order failed',
        );
        break;
      default:
        this.logger.log(`[WEBHOOK] Unhandled event: ${event_name}`);
    }
  }

  private async handleOrderSucceededWebhook(orderId: string): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { hdfcOrderId: orderId },
    });
    if (!payment) {
      this.logger.warn(`[WEBHOOK] No payment for order ${orderId}`);
      return;
    }
    if (payment.status === 'SUCCESS') {
      this.logger.log(
        `[WEBHOOK] Order ${orderId} already SUCCESS — idempotent`,
      );
      return;
    }
    await this.confirmOrderAndActivate(payment, 'webhook');
  }

  private async handleOrderFailedWebhook(
    orderId: string,
    reason: string,
  ): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { hdfcOrderId: orderId },
    });
    if (!payment || payment.status !== 'PENDING') return;
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        failureReason: reason,
        processedAt: new Date(),
      },
    });
    const sub = await this.prisma.subscription.findUnique({
      where: { id: payment.subscriptionId },
    });
    if (sub) {
      await this.subscriptions.markPastDue(sub.organizationId, reason);
    }
    this.logger.log(`[WEBHOOK] Order ${orderId} marked FAILED`);
  }

  // ─── 4. Confirm Order and Activate (shared by return URL + webhook) ─────────

  private async confirmOrderAndActivate(
    payment: Payment,
    source: 'return_url' | 'webhook' | 'scheduler',
  ): Promise<{ success: boolean; orderId: string; redirectPath: string }> {
    const orderId = payment.hdfcOrderId;

    // Call Order Status API — backend confirms payment, never trust redirect params
    const orderStatus = await this.hdfc.getOrderStatus(orderId);
    this.logger.log(
      `[CONFIRM] Order ${orderId} HDFC status: ${orderStatus.status} (source: ${source})`,
    );

    if (orderStatus.status !== 'CHARGED') {
      // Non-terminal: still pending — don't change state
      if (
        orderStatus.status === 'NEW' ||
        orderStatus.status === 'PENDING_VBV'
      ) {
        return {
          success: false,
          orderId,
          redirectPath: '/pricing?status=pending',
        };
      }
      // Terminal failure
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failureCode: String(orderStatus.status_id),
          failureReason: orderStatus.bank_error_message ?? 'Payment declined',
          processedAt: new Date(),
        },
      });
      const sub = await this.prisma.subscription.findUnique({
        where: { id: payment.subscriptionId },
      });
      if (sub)
        await this.subscriptions.markPastDue(
          sub.organizationId,
          orderStatus.bank_error_message ?? 'Payment declined',
        );
      return {
        success: false,
        orderId,
        redirectPath: '/pricing?error=payment_failed',
      };
    }

    // CHARGED — activate subscription
    const sub = await this.prisma.subscription.findUnique({
      where: { id: payment.subscriptionId },
    });
    if (!sub) {
      this.logger.error(`[CONFIRM] No subscription for payment ${payment.id}`);
      return {
        success: false,
        orderId,
        redirectPath: '/pricing?error=internal_error',
      };
    }

    // Billing anchor: periodStart = now (first activation); subsequent renewals use previousPeriodEnd
    const periodStart = new Date();
    const periodEnd = addBillingPeriod(periodStart, sub.billingCycle);

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          hdfcTxnId: orderStatus.txn_id,
          processedAt: new Date(),
        },
      }),
    ]);

    await this.subscriptions.activate(sub.organizationId, {
      periodStart,
      periodEnd,
      seatsAtCharge: payment.seatsAtCharge,
      baseAmount: sub.baseAmount,
      extraUsers: sub.extraUsers,
      totalAmount: sub.totalAmount,
    });

    this.eventEmitter.emit('audit.log', {
      organizationId: sub.organizationId,
      actorId: null,
      action: 'billing.subscription_activated',
      resourceType: 'SUBSCRIPTION',
      resourceId: sub.id,
      metadata: {
        plan: sub.plan,
        billingCycle: sub.billingCycle,
        amount: sub.totalAmount,
        source,
      },
    });

    this.logger.log(
      `[CONFIRM] Subscription activated for org ${sub.organizationId}, plan ${sub.plan}`,
    );
    return { success: true, orderId, redirectPath: '/pricing?success=true' };
  }

  // ─── 5. Get Subscription Status ─────────────────────────────────────────────

  async getStatus(organizationId: string): Promise<Subscription | null> {
    return this.subscriptions.findByOrgId(organizationId);
  }

  // ─── 6. Cancel Subscription ─────────────────────────────────────────────────

  async cancelSubscription(
    organizationId: string,
    reason: string,
  ): Promise<Subscription> {
    const sub = await this.subscriptions.findByOrgId(organizationId);
    if (!sub || sub.status === 'FREE' || sub.status === 'EXPIRED') {
      throw new NotFoundException('No active subscription to cancel');
    }
    if (sub.status === 'CANCELLED') {
      throw new ConflictException('Subscription is already cancelled');
    }

    const updated = await this.subscriptions.cancel(organizationId, reason);

    this.eventEmitter.emit('audit.log', {
      organizationId,
      actorId: null,
      action: 'billing.subscription_cancelled',
      resourceType: 'SUBSCRIPTION',
      resourceId: sub.id,
      metadata: { reason, periodEnd: sub.currentPeriodEnd },
    });

    this.logger.log(
      `[CANCEL] Org ${organizationId} subscription cancelled — active until ${sub.currentPeriodEnd?.toISOString()}`,
    );
    return updated;
  }

  // ─── 7. Process Renewal (called by scheduler) ────────────────────────────────

  /**
   * Execute a mandate charge for a single subscription renewal.
   * Uses billing anchor: newPeriodStart = sub.currentPeriodEnd (not now).
   * HDFC requires initiation at least 25 hours before the debit date.
   * The scheduler finds subscriptions expiring within 26h to satisfy this.
   */
  async processRenewal(sub: Subscription): Promise<void> {
    const orgId = sub.organizationId;
    if (!sub.hdfcMandateId) {
      this.logger.warn(`[RENEWAL] Org ${orgId} has no mandateId — skipping`);
      return;
    }

    // Calculate current-cycle amount (seats may have changed)
    const activeSeats = await this.subscriptions.countActiveSeats(orgId);
    const billing = calculateBillingAmount(
      sub.plan,
      sub.billingCycle,
      activeSeats,
    );
    if (!billing) {
      this.logger.warn(
        `[RENEWAL] Cannot calculate amount for org ${orgId} (${sub.plan} ${sub.billingCycle}) — skipping`,
      );
      return;
    }

    const { baseAmount, extraUsers, extraUserRate, totalAmount } = billing;
    const orderId = generateHdfcId('rPM');

    // Create PENDING payment record (idempotency key = orderId)
    const payment = await this.prisma.payment.create({
      data: {
        subscription: { connect: { id: sub.id } },
        type: 'RECURRING_EXECUTION',
        status: 'PENDING',
        hdfcOrderId: orderId,
        amount: totalAmount,
        seatsAtCharge: activeSeats,
      },
    });

    try {
      await this.hdfc.executeMandateCharge(sub.hdfcMandateId, {
        order_id: orderId,
        amount: formatAmount(totalAmount),
        currency: 'INR',
        customer_id: sub.hdfcCustomerId ?? `cust-${orgId.substring(0, 8)}`,
      });

      // Billing anchor: newPeriodStart = previousPeriodEnd (not now)
      const newPeriodStart = sub.currentPeriodEnd ?? new Date();
      const newPeriodEnd = addBillingPeriod(newPeriodStart, sub.billingCycle);

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'SUCCESS', processedAt: new Date() },
      });

      await this.subscriptions.activate(orgId, {
        periodStart: newPeriodStart,
        periodEnd: newPeriodEnd,
        seatsAtCharge: activeSeats,
        baseAmount,
        extraUsers,
        totalAmount,
      });

      this.eventEmitter.emit('audit.log', {
        organizationId: orgId,
        actorId: null,
        action: 'billing.renewal_success',
        resourceType: 'SUBSCRIPTION',
        resourceId: sub.id,
        metadata: {
          amount: totalAmount,
          seats: activeSeats,
          periodEnd: newPeriodEnd.toISOString(),
        },
      });

      this.logger.log(
        `[RENEWAL] Org ${orgId} renewed — ₹${totalAmount}, period ends ${newPeriodEnd.toISOString()}`,
      );
    } catch (err: unknown) {
      const reason = (err as Error).message;
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failureReason: reason,
          processedAt: new Date(),
        },
      });

      const newFailureCount = (sub.failureCount ?? 0) + 1;

      if (newFailureCount >= MAX_FAILURES_BEFORE_EXPIRE) {
        await this.revokeAndExpire(
          sub,
          `Renewal failed ${newFailureCount} times — grace period exhausted`,
        );
      } else {
        await this.subscriptions.markPastDue(orgId, reason);
        this.logger.warn(
          `[RENEWAL] Org ${orgId} renewal failed (attempt ${newFailureCount}) → PAST_DUE`,
        );
      }
    }
  }

  // ─── 8. Revoke mandate and expire subscription ───────────────────────────────

  async revokeAndExpire(sub: Subscription, reason: string): Promise<void> {
    if (sub.hdfcMandateId) {
      try {
        await this.hdfc.revokeMandate(sub.hdfcMandateId);
        this.logger.log(
          `[REVOKE] Mandate ${sub.hdfcMandateId} revoked for org ${sub.organizationId}`,
        );
      } catch (err: unknown) {
        this.logger.error(
          `[REVOKE] Failed to revoke mandate ${sub.hdfcMandateId}: ${(err as Error).message}`,
        );
        // Continue to expire — don't block expiry on mandate revoke failure
      }
    }

    await this.subscriptions.expire(sub.organizationId);

    this.eventEmitter.emit('audit.log', {
      organizationId: sub.organizationId,
      actorId: null,
      action: 'billing.subscription_expired',
      resourceType: 'SUBSCRIPTION',
      resourceId: sub.id,
      metadata: { reason },
    });

    this.logger.log(
      `[EXPIRE] Org ${sub.organizationId} subscription expired — reason: ${reason}`,
    );
  }

  // ─── 9. Refund ──────────────────────────────────────────────────────────────

  async refundPayment(paymentId: string, amount: number): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment || payment.status !== 'SUCCESS')
      throw new BadRequestException('Payment not eligible for refund');

    const refundRequestId = generateHdfcId('rfnd');
    const result = await this.hdfc.refundOrder(payment.hdfcOrderId, {
      unique_request_id: refundRequestId,
      amount,
    });

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: result.status === 'SUCCESS' ? 'REFUNDED' : 'SUCCESS',
        refundedAmount: amount,
        refundRequestId,
      },
    });

    this.logger.log(
      `[REFUND] Payment ${paymentId} refund ${result.status} — ₹${amount}`,
    );
  }
}
