import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
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
  private readonly activeRenewalSubIds = new Set<string>();

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
    customerPhone?: string,
  ): Promise<{ paymentLink: string; orderId: string }> {
    let resolvedPhone = customerPhone?.trim();

    // If phone not supplied in payload, attempt to load from organization.settings.billingPhone
    if (!resolvedPhone && (this.prisma as any).organization?.findUnique) {
      try {
        const org = await (this.prisma as any).organization.findUnique({
          where: { id: organizationId },
          select: { settings: true },
        });
        const orgSettings = (org?.settings as Record<string, any>) || {};
        if (
          orgSettings.billingPhone &&
          typeof orgSettings.billingPhone === 'string'
        ) {
          resolvedPhone = orgSettings.billingPhone.trim();
        }
      } catch (err) {
        this.logger.warn(
          `Could not read org billingPhone: ${(err as Error).message}`,
        );
      }
    }

    // Guard: phone must be exactly 10 digits — validated server-side (F-003)
    // Frontend validation is a UX aid only; we do not trust it.
    // Never log the phone value.
    if (!resolvedPhone || !/^\d{10}$/.test(resolvedPhone)) {
      throw new BadRequestException(
        'A valid 10-digit mobile number is required for payment processing',
      );
    }

    // Persist phone to organization settings if not already stored
    if ((this.prisma as any).organization?.update) {
      try {
        const org = await (this.prisma as any).organization.findUnique({
          where: { id: organizationId },
          select: { settings: true },
        });
        const currentSettings = (org?.settings as Record<string, any>) || {};
        if (currentSettings.billingPhone !== resolvedPhone) {
          await (this.prisma as any).organization.update({
            where: { id: organizationId },
            data: {
              settings: {
                ...currentSettings,
                billingPhone: resolvedPhone,
              },
            },
          });
        }
      } catch (err) {
        this.logger.warn(
          `Failed to persist billingPhone to org settings: ${(err as Error).message}`,
        );
      }
    }

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
      customer_phone: resolvedPhone, // Validated 10-digit number for HDFC mandate registration
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

    // SECURITY: Verify HMAC — hard reject on failure (F-001).
    // Invalid or missing signature means the return URL was not issued by HDFC.
    // We do NOT fall through to Order Status API on signature failure — that path
    // could allow a tampered redirect to influence payment processing timing.
    const hmacValid = this.signature.verifyReturnUrl(params);
    if (!hmacValid) {
      this.logger.warn(
        `[RETURN] HMAC verification failed for order ${orderId} — rejecting return URL`,
      );
      return {
        success: false,
        orderId,
        redirectPath: '/pricing?error=signature_invalid',
      };
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
      return {
        success: true,
        orderId,
        redirectPath: `/pricing?success=true&order_id=${orderId}`,
      };
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

    // Handle bank-initiated mandate events (P4-4)
    if (event_name === HDFC_WEBHOOK_EVENTS.MANDATE_REVOKED) {
      const mandateId =
        content?.mandate?.mandate_id ??
        content?.mandate?.id ??
        (content?.order as any)?.mandate_id ??
        (content as any)?.mandate_id;

      if (!mandateId) {
        this.logger.warn(
          `[WEBHOOK] Received MANDATE_REVOKED with no mandate ID`,
        );
        return;
      }

      this.logger.log(`[WEBHOOK] ${event_name} for mandate ${mandateId}`);
      await this.handleMandateRevokedWebhook(mandateId);
      return;
    }

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
    if (!payment) {
      this.logger.warn(`[WEBHOOK] No payment for order ${orderId}`);
      return;
    }
    if (payment.status === 'FAILED') {
      this.logger.log(`[WEBHOOK] Order ${orderId} already FAILED — idempotent`);
      return;
    }

    // Protection against delayed/contradictory failure webhooks reversing a genuinely settled payment
    if (payment.status === 'SUCCESS') {
      const orderStatus = await this.hdfc.getOrderStatus(orderId);
      if (orderStatus.status === 'CHARGED') {
        this.logger.warn(
          `[WEBHOOK] Received ORDER_FAILED for settled order ${orderId}, but HDFC reports CHARGED — ignoring contradictory webhook`,
        );
        return;
      }
    }

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
      const newFailureCount = (sub.failureCount ?? 0) + 1;
      if (newFailureCount >= MAX_FAILURES_BEFORE_EXPIRE) {
        await this.revokeAndExpire(
          sub,
          `Payment failed ${newFailureCount} times — grace period exhausted`,
        );
      } else {
        await this.subscriptions.markPastDue(sub.organizationId, reason);
        this.logger.warn(
          `[WEBHOOK] Org ${sub.organizationId} renewal failed (attempt ${newFailureCount}) → PAST_DUE`,
        );
      }
    }
    this.logger.log(`[WEBHOOK] Order ${orderId} marked FAILED`);
  }

  private async handleMandateRevokedWebhook(mandateId: string): Promise<void> {
    const sub = await this.prisma.subscription.findFirst({
      where: { hdfcMandateId: mandateId },
    });

    if (!sub) {
      this.logger.warn(
        `[WEBHOOK] Received MANDATE_REVOKED for unknown mandate ${mandateId}`,
      );
      return;
    }

    // Idempotency: if already EXPIRED or FREE, mandate revocation is already settled
    if (sub.status === 'EXPIRED' || sub.status === 'FREE') {
      this.logger.log(
        `[WEBHOOK] Mandate ${mandateId} revoked for org ${sub.organizationId}, but subscription already ${sub.status} — idempotent`,
      );
      return;
    }

    // If subscription is already CANCELLED, clear mandate ID to prevent renewal attempts
    if (sub.status === 'CANCELLED') {
      if (sub.hdfcMandateId) {
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: { hdfcMandateId: null },
        });
      }
      this.logger.log(
        `[WEBHOOK] Mandate ${mandateId} revoked for already CANCELLED subscription ${sub.id}`,
      );
      return;
    }

    const now = new Date();
    // If ACTIVE and customer already paid for current cycle:
    // Do NOT cut off access prematurely. Mark CANCELLED, nullify mandate ID so no future debits occur.
    // The subscription will run until currentPeriodEnd, where Sweep 4 (expireCancelledPeriodEnded)
    // will expire it and trigger downgrade compliance reset.
    if (
      sub.status === 'ACTIVE' &&
      sub.currentPeriodEnd &&
      sub.currentPeriodEnd > now
    ) {
      await this.subscriptions.cancel(
        sub.organizationId,
        'Mandate revoked by bank',
      );
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { hdfcMandateId: null },
      });

      this.eventEmitter.emit('audit.log', {
        organizationId: sub.organizationId,
        actorId: null,
        action: 'billing.mandate_revoked',
        resourceType: 'SUBSCRIPTION',
        resourceId: sub.id,
        metadata: {
          mandateId,
          reason: 'Bank-initiated mandate revocation',
          reconciliation: 'CANCELLED_UNTIL_PERIOD_END',
          currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
        },
      });

      this.logger.log(
        `[WEBHOOK] Mandate ${mandateId} revoked — org ${sub.organizationId} subscription marked CANCELLED until period end ${sub.currentPeriodEnd.toISOString()}`,
      );
      return;
    }

    // If PAST_DUE or period has already lapsed, no valid paid cycle remains. Expire immediately.
    await this.subscriptions.expire(sub.organizationId);

    this.eventEmitter.emit('audit.log', {
      organizationId: sub.organizationId,
      actorId: null,
      action: 'billing.mandate_revoked',
      resourceType: 'SUBSCRIPTION',
      resourceId: sub.id,
      metadata: {
        mandateId,
        reason: 'Bank-initiated mandate revocation',
        reconciliation: 'EXPIRED_IMMEDIATELY',
      },
    });

    this.logger.log(
      `[WEBHOOK] Mandate ${mandateId} revoked — org ${sub.organizationId} subscription expired immediately (status was ${sub.status})`,
    );
  }

  // ─── 4. Confirm Order and Activate (shared by return URL + webhook) ─────────

  private async confirmOrderAndActivate(
    payment: Payment,
    source: 'return_url' | 'webhook' | 'scheduler',
  ): Promise<{ success: boolean; orderId: string; redirectPath: string }> {
    const orderId = payment.hdfcOrderId;

    // Idempotency guard: if payment is already marked SUCCESS in DB, do not re-activate or extend period twice
    const currentPayment = await this.prisma.payment.findUnique({
      where: { id: payment.id },
    });
    if (currentPayment?.status === 'SUCCESS') {
      this.logger.log(
        `[CONFIRM] Payment ${payment.id} for order ${orderId} already SUCCESS — idempotent (source: ${source})`,
      );
      return {
        success: true,
        orderId,
        redirectPath: `/pricing?success=true&order_id=${orderId}`,
      };
    }

    // Call Order Status API — backend confirms payment, never trust redirect params
    const orderStatus = await this.hdfc.getOrderStatus(orderId);
    this.logger.log(
      `[CONFIRM] Order ${orderId} HDFC status: ${orderStatus.status} (source: ${source})`,
    );

    // F-002: Cross-validate the Order Status response against our stored payment record.
    // The returned order_id, amount, and currency must match exactly.
    // A mismatch means the response does not belong to this payment — reject immediately.
    if (orderStatus.order_id !== orderId) {
      this.logger.error(
        `[CONFIRM] Order ID mismatch — expected ${orderId}, got ${orderStatus.order_id} (source: ${source})`,
      );
      return {
        success: false,
        orderId,
        redirectPath: '/pricing?error=payment_validation_failed',
      };
    }
    // HDFC returns amount as a number (e.g. 499 or 499.00). Our DB stores it as an integer (INR).
    // Strict numeric equality prevents fractional mismatches (e.g. 499.49 !== 499).
    if (Number(orderStatus.amount) !== payment.amount) {
      this.logger.error(
        `[CONFIRM] Amount mismatch — expected ${payment.amount}, got ${orderStatus.amount} (source: ${source})`,
      );
      return {
        success: false,
        orderId,
        redirectPath: '/pricing?error=payment_validation_failed',
      };
    }
    if (orderStatus.currency !== 'INR') {
      this.logger.error(
        `[CONFIRM] Currency mismatch — expected INR, got ${orderStatus.currency} (source: ${source})`,
      );
      return {
        success: false,
        orderId,
        redirectPath: '/pricing?error=payment_validation_failed',
      };
    }

    if (orderStatus.status !== 'CHARGED') {
      // Non-terminal: still pending — don't change state
      if (
        orderStatus.status === 'NEW' ||
        orderStatus.status === 'PENDING_VBV' ||
        (orderStatus.status as string) === 'PENDING'
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
      if (sub) {
        const newFailureCount = (sub.failureCount ?? 0) + 1;
        if (newFailureCount >= MAX_FAILURES_BEFORE_EXPIRE) {
          await this.revokeAndExpire(
            sub,
            `Payment declined ${newFailureCount} times — grace period exhausted`,
          );
        } else {
          await this.subscriptions.markPastDue(
            sub.organizationId,
            orderStatus.bank_error_message ?? 'Payment declined',
          );
        }
      }
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
    const isRenewal = payment.type === 'RECURRING_EXECUTION';
    const periodStart =
      isRenewal && sub.currentPeriodEnd ? sub.currentPeriodEnd : new Date();
    const periodEnd = addBillingPeriod(periodStart, sub.billingCycle);

    let baseAmount = sub.baseAmount;
    let extraUsers = sub.extraUsers;
    let totalAmount = sub.totalAmount;

    if (isRenewal) {
      const billing = calculateBillingAmount(
        sub.plan,
        sub.billingCycle,
        payment.seatsAtCharge,
      );
      if (billing) {
        baseAmount = billing.baseAmount;
        extraUsers = billing.extraUsers;
        totalAmount = billing.totalAmount;
      }
    }

    try {
      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCESS',
            hdfcTxnId: orderStatus.txn_id || null,
            processedAt: new Date(),
          },
        }),
      ]);
    } catch (error: any) {
      if (error.code === 'P2002') {
        this.logger.error(
          `[CONFIRM] Duplicate transaction ID ${orderStatus.txn_id} detected for order ${orderId} (source: ${source})`,
        );
        if (source === 'webhook') {
          // Throw so the webhook controller returns 500 and HDFC stops reporting success
          throw new ConflictException('Duplicate transaction ID');
        }
        return {
          success: false,
          orderId,
          redirectPath: '/pricing?error=internal_error',
        };
      }
      throw error;
    }

    await this.subscriptions.activate(sub.organizationId, {
      periodStart,
      periodEnd,
      seatsAtCharge: payment.seatsAtCharge,
      baseAmount,
      extraUsers,
      totalAmount,
    });

    this.eventEmitter.emit('audit.log', {
      organizationId: sub.organizationId,
      actorId: null,
      action: isRenewal
        ? 'billing.renewal_success'
        : 'billing.subscription_activated',
      resourceType: 'SUBSCRIPTION',
      resourceId: sub.id,
      metadata: isRenewal
        ? {
            amount: totalAmount,
            seats: payment.seatsAtCharge,
            periodEnd: periodEnd.toISOString(),
            source,
          }
        : {
            plan: sub.plan,
            billingCycle: sub.billingCycle,
            amount: sub.totalAmount,
            source,
          },
    });

    this.logger.log(
      `[CONFIRM] Subscription ${isRenewal ? 'renewed' : 'activated'} for org ${sub.organizationId}, plan ${sub.plan}`,
    );
    return {
      success: true,
      orderId,
      redirectPath: `/pricing?success=true&order_id=${orderId}`,
    };
  }

  // ─── 4b. Get Payment Receipt (Safeguard 1 & 3) ──────────────────────────────
  async getPaymentReceipt(
    organizationId: string,
    userId: string,
    hdfcOrderId: string,
  ) {
    // Ensure the requesting user actually belongs to this organization
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (!member) {
      throw new ForbiddenException('User is not a member of this organization');
    }

    const sub = await this.subscriptions.findByOrgId(organizationId);
    if (!sub) return null;

    return this.prisma.payment.findFirst({
      where: {
        subscriptionId: sub.id,
        hdfcOrderId,
        status: 'SUCCESS',
      },
      select: {
        hdfcOrderId: true,
        hdfcTxnId: true,
        amount: true,
        currency: true,
        processedAt: true,
      },
    });
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

  // ─── 6b. Force Expire (Dev/UAT only) ────────────────────────────────────────

  async forceExpireSubscription(organizationId: string): Promise<Subscription> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Force expire is disabled in production environments',
      );
    }

    const sub = await this.subscriptions.findByOrgId(organizationId);
    if (!sub || sub.status === 'FREE' || sub.status === 'EXPIRED') {
      throw new NotFoundException(
        'No active or cancelled subscription to expire',
      );
    }

    const updated = await this.subscriptions.expire(organizationId);

    this.eventEmitter.emit('audit.log', {
      organizationId,
      actorId: null,
      action: 'billing.subscription_expired',
      resourceType: 'SUBSCRIPTION',
      resourceId: sub.id,
      metadata: { reason: 'Dev-forced expiration' },
    });

    this.logger.log(
      `[DEV EXPIRE] Org ${organizationId} subscription forcefully expired for testing.`,
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

    if (this.activeRenewalSubIds.has(sub.id)) {
      this.logger.warn(
        `[RENEWAL] Renewal already in progress for sub ${sub.id} (org ${orgId}) — skipping concurrent sweep`,
      );
      return;
    }

    this.activeRenewalSubIds.add(sub.id);
    try {
      // Check if there is already a PENDING renewal payment for this subscription
      const existingPending = await this.prisma.payment.findFirst({
        where: {
          subscriptionId: sub.id,
          type: 'RECURRING_EXECUTION',
          status: 'PENDING',
        },
      });
      if (existingPending) {
        this.logger.log(
          `[RENEWAL] Org ${orgId} already has pending renewal payment ${existingPending.hdfcOrderId} — polling order status`,
        );
        await this.confirmOrderAndActivate(existingPending, 'scheduler');
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
        const chargeRes = await this.hdfc.executeMandateCharge(
          sub.hdfcMandateId,
          {
            order_id: orderId,
            amount: formatAmount(totalAmount),
            currency: 'INR',
            customer_id: sub.hdfcCustomerId ?? `cust-${orgId.substring(0, 8)}`,
          },
        );

        if (chargeRes.status === 'FAILED') {
          throw new Error(`Mandate execution failed: ${chargeRes.status}`);
        }

        if (chargeRes.status === 'CHARGED') {
          await this.confirmOrderAndActivate(payment, 'scheduler');
        } else {
          this.logger.log(
            `[RENEWAL] Org ${orgId} mandate charge initiated (order ${orderId}, status ${chargeRes.status}) — payment PENDING awaiting authoritative confirmation`,
          );
        }
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
    } finally {
      this.activeRenewalSubIds.delete(sub.id);
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
