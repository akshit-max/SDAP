import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BillingService } from './billing.service';
import { SubscriptionService } from './subscription/subscription.service';

/**
 * BillingRenewalScheduler
 *
 * Runs daily at 2:00 AM IST (20:30 UTC) — @Cron('30 20 * * *')
 * All times are interpreted as UTC by @nestjs/schedule.
 * 20:30 UTC = 02:00 IST (UTC+5:30)
 *
 * HDFC Mandate Execution requirement:
 * The merchant must initiate execution at least 25 hours before the auto-debit date.
 * This scheduler uses a 26-hour sweep window (> 25h) to satisfy this requirement.
 * Subscriptions expiring within 26 hours are processed, giving a safe lead time.
 *
 * Three sweeps run in parallel via Promise.allSettled:
 *   1. processUpcomingRenewals   — ACTIVE subs expiring within 26h
 *   2. retryPastDueSubscriptions — PAST_DUE subs within their grace period
 *   3. expireGraceExpired        — PAST_DUE subs where grace has elapsed → revoke + expire
 *   4. expireCancelledPeriodEnded — CANCELLED subs past period end → revoke + expire
 *
 * Pattern follows SessionExpiryScheduler exactly.
 * Each sweep processes max 50 records per run (remainder handled next day).
 */
@Injectable()
export class BillingRenewalScheduler {
  private readonly logger = new Logger(BillingRenewalScheduler.name);

  constructor(
    private readonly billingService: BillingService,
    private readonly subscriptions: SubscriptionService,
  ) {}

  /**
   * Daily at 2:00 AM IST.
   * Cron: '30 20 * * *'  →  20:30 UTC = 02:00 IST
   *
   * HDFC lead time: 26-hour sweep window > 25-hour minimum required by HDFC.
   * This ensures mandate execution is always initiated with sufficient lead time.
   */
  @Cron('30 20 * * *', { name: 'billing-renewal-sweep' })
  async runRenewalSweep(): Promise<void> {
    this.logger.log('[SCHEDULER] Billing renewal sweep started');

    await Promise.allSettled([
      this.processUpcomingRenewals(),
      this.retryPastDueSubscriptions(),
      this.expireGraceExpired(),
      this.expireCancelledPeriodEnded(),
    ]);

    this.logger.log('[SCHEDULER] Billing renewal sweep complete');
  }

  // ─── Sweep 1: Process upcoming renewals (26h window) ──────────────────────

  private async processUpcomingRenewals(): Promise<void> {
    // 26h window > HDFC's 25h minimum lead time requirement
    const subscriptions = await this.subscriptions.findDueForRenewal(26);
    if (subscriptions.length === 0) return;

    this.logger.log(
      `[SWEEP 1] Processing ${subscriptions.length} upcoming renewal(s)`,
    );

    for (const sub of subscriptions) {
      try {
        await this.billingService.processRenewal(sub);
      } catch (err: unknown) {
        // Per-subscription failures must not abort the entire sweep
        this.logger.error(
          `[SWEEP 1] Renewal failed for org ${sub.organizationId}: ${(err as Error).message}`,
        );
      }
    }
  }

  // ─── Sweep 2: Retry PAST_DUE subscriptions within grace period ─────────────

  private async retryPastDueSubscriptions(): Promise<void> {
    const subscriptions = await this.subscriptions.findPastDueInGrace();
    if (subscriptions.length === 0) return;

    this.logger.log(
      `[SWEEP 2] Retrying ${subscriptions.length} PAST_DUE subscription(s) in grace`,
    );

    for (const sub of subscriptions) {
      try {
        await this.billingService.processRenewal(sub);
      } catch (err: unknown) {
        this.logger.error(
          `[SWEEP 2] Retry failed for org ${sub.organizationId}: ${(err as Error).message}`,
        );
      }
    }
  }

  // ─── Sweep 3: Expire subscriptions where grace period has elapsed ───────────

  private async expireGraceExpired(): Promise<void> {
    const subscriptions = await this.subscriptions.findGraceExpired();
    if (subscriptions.length === 0) return;

    this.logger.log(
      `[SWEEP 3] Expiring ${subscriptions.length} grace-period-expired subscription(s)`,
    );

    for (const sub of subscriptions) {
      try {
        await this.billingService.revokeAndExpire(
          sub,
          'Grace period elapsed — subscription expired',
        );
      } catch (err: unknown) {
        this.logger.error(
          `[SWEEP 3] Expire failed for org ${sub.organizationId}: ${(err as Error).message}`,
        );
      }
    }
  }

  // ─── Sweep 4: Revoke and expire CANCELLED subs where period has ended ───────

  private async expireCancelledPeriodEnded(): Promise<void> {
    const subscriptions = await this.subscriptions.findCancelledAndExpired();
    if (subscriptions.length === 0) return;

    this.logger.log(
      `[SWEEP 4] Revoking ${subscriptions.length} cancelled subscription(s) past period end`,
    );

    for (const sub of subscriptions) {
      try {
        await this.billingService.revokeAndExpire(
          sub,
          'Subscription cancelled — period ended',
        );
      } catch (err: unknown) {
        this.logger.error(
          `[SWEEP 4] Expire failed for cancelled org ${sub.organizationId}: ${(err as Error).message}`,
        );
      }
    }
  }
}
