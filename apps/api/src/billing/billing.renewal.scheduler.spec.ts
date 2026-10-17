import { BillingRenewalScheduler } from './billing.renewal.scheduler';

describe('BillingRenewalScheduler — kill switch', () => {
  const subscriptions = {
    findDueForRenewal: jest.fn().mockResolvedValue([]),
    findPastDueInGrace: jest.fn().mockResolvedValue([]),
    findGraceExpired: jest.fn().mockResolvedValue([]),
    findCancelledAndExpired: jest.fn().mockResolvedValue([]),
  };
  let flag: string | undefined;
  const config = { get: jest.fn(() => flag) };
  const scheduler = new BillingRenewalScheduler(
    {} as any,
    subscriptions as any,
    config as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it.each([undefined, 'true', 'yes', ''])(
    'runs all sweeps when BILLING_RENEWAL_SWEEP_ENABLED=%p',
    async (value) => {
      flag = value;
      await scheduler.runRenewalSweep();
      expect(subscriptions.findDueForRenewal).toHaveBeenCalled();
      expect(subscriptions.findPastDueInGrace).toHaveBeenCalled();
      expect(subscriptions.findGraceExpired).toHaveBeenCalled();
      expect(subscriptions.findCancelledAndExpired).toHaveBeenCalled();
    },
  );

  it.each(['false', ' FALSE '])(
    'skips every sweep when BILLING_RENEWAL_SWEEP_ENABLED=%p',
    async (value) => {
      flag = value;
      await scheduler.runRenewalSweep();
      expect(subscriptions.findDueForRenewal).not.toHaveBeenCalled();
      expect(subscriptions.findPastDueInGrace).not.toHaveBeenCalled();
      expect(subscriptions.findGraceExpired).not.toHaveBeenCalled();
      expect(subscriptions.findCancelledAndExpired).not.toHaveBeenCalled();
    },
  );
});
