import {
  BillingReconciliationScheduler,
  RECONCILE_STARTUP_DELAY_MS,
} from './billing.reconciliation.scheduler';

describe('BillingReconciliationScheduler', () => {
  const billingService = {
    reconcilePendingCheckouts: jest.fn(),
  };
  let configValue: string | undefined;
  const config = { get: jest.fn(() => configValue) };
  let scheduler: BillingReconciliationScheduler;

  beforeEach(() => {
    jest.clearAllMocks();
    configValue = undefined;
    billingService.reconcilePendingCheckouts.mockResolvedValue({
      scanned: 0,
      skipped: false,
    });
    scheduler = new BillingReconciliationScheduler(
      billingService as any,
      config as any,
    );
  });

  afterEach(() => {
    scheduler.onModuleDestroy();
    jest.useRealTimers();
  });

  it('defaults to dry-run when HDFC_RECONCILE_MODE is unset', async () => {
    await scheduler.runScheduled();
    expect(billingService.reconcilePendingCheckouts).toHaveBeenCalledWith({
      dryRun: true,
    });
  });

  it('writes only when HDFC_RECONCILE_MODE=live', async () => {
    configValue = ' LIVE ';
    await scheduler.runScheduled();
    expect(billingService.reconcilePendingCheckouts).toHaveBeenCalledWith({
      dryRun: false,
    });
  });

  it('does nothing when HDFC_RECONCILE_MODE=off', async () => {
    configValue = 'off';
    await scheduler.runScheduled();
    expect(billingService.reconcilePendingCheckouts).not.toHaveBeenCalled();
  });

  it('falls back to dry-run for an unrecognised value', async () => {
    configValue = 'yes-please';
    await scheduler.runScheduled();
    expect(billingService.reconcilePendingCheckouts).toHaveBeenCalledWith({
      dryRun: true,
    });
  });

  it('runs a catch-up pass 60 seconds after startup', async () => {
    jest.useFakeTimers();
    scheduler.onApplicationBootstrap();

    jest.advanceTimersByTime(RECONCILE_STARTUP_DELAY_MS - 1);
    expect(billingService.reconcilePendingCheckouts).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(billingService.reconcilePendingCheckouts).toHaveBeenCalledTimes(1);
  });

  it('swallows sweep errors so the cron keeps running', async () => {
    billingService.reconcilePendingCheckouts.mockRejectedValue(
      new Error('db down'),
    );
    await expect(scheduler.runScheduled()).resolves.toBeUndefined();
  });
});
