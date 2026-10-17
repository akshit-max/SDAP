import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { BillingService } from './billing.service';

export type ReconcileMode = 'off' | 'dry-run' | 'live';

/** Delay before the post-boot catch-up run (Render free tier misses crons while asleep). */
export const RECONCILE_STARTUP_DELAY_MS = 60 * 1000;

/**
 * BillingReconciliationScheduler
 *
 * Resolves first-checkout payments left PENDING when the customer's browser never
 * returned from HDFC. See BillingService.reconcilePendingCheckouts for the rules.
 *
 * Runs every 10 minutes, plus once 60s after boot — a sleeping Render instance
 * does not fire crons, so the catch-up covers orders abandoned while it slept.
 *
 * HDFC_RECONCILE_MODE (read on every run):
 *   dry-run (default) — query HDFC and log what would change; write nothing
 *   live              — apply changes via confirmOrderAndActivate
 *   off               — do nothing
 * Unrecognised values fall back to dry-run so a typo can never enable writes.
 */
@Injectable()
export class BillingReconciliationScheduler
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(BillingReconciliationScheduler.name);
  private startupTimer?: NodeJS.Timeout;

  constructor(
    private readonly billingService: BillingService,
    private readonly config: ConfigService,
  ) {}

  onApplicationBootstrap(): void {
    this.startupTimer = setTimeout(
      () => void this.run('startup'),
      RECONCILE_STARTUP_DELAY_MS,
    );
    this.startupTimer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.startupTimer) clearTimeout(this.startupTimer);
  }

  @Cron('*/10 * * * *', { name: 'billing-checkout-reconcile' })
  async runScheduled(): Promise<void> {
    await this.run('cron');
  }

  async run(trigger: 'startup' | 'cron'): Promise<void> {
    const mode = this.mode();
    if (mode === 'off') return;
    try {
      const summary = await this.billingService.reconcilePendingCheckouts({
        dryRun: mode === 'dry-run',
      });
      if (summary.scanned > 0 || summary.skipped) {
        this.logger.log(
          `[RECONCILE] ${trigger} run complete (mode ${mode}): ${JSON.stringify(summary)}`,
        );
      }
    } catch (err: unknown) {
      this.logger.error(
        `[RECONCILE] ${trigger} run failed: ${(err as Error).message}`,
      );
    }
  }

  mode(): ReconcileMode {
    const raw = (this.config.get<string>('HDFC_RECONCILE_MODE') ?? 'dry-run')
      .trim()
      .toLowerCase();
    if (raw === 'off' || raw === 'live' || raw === 'dry-run') return raw;
    this.logger.warn(
      `[RECONCILE] Unrecognised HDFC_RECONCILE_MODE "${raw}" — using dry-run`,
    );
    return 'dry-run';
  }
}
