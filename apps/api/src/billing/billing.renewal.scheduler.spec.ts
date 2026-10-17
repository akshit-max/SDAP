import { BillingRenewalScheduler } from './billing.renewal.scheduler';

describe('BillingRenewalScheduler — unpaid first checkouts are never renewed', () => {
  const paidSub = { id: 'sub-paid', organizationId: 'org-paid' };
  const unpaidSub = { id: 'sub-unpaid', organizationId: 'org-unpaid' };
  const billingService = {
    // Only the unpaid subscription is claimed (and released) by the guard
    releaseIfUnpaidCheckout: jest.fn((sub: { id: string }) =>
      Promise.resolve(sub.id === 'sub-unpaid'),
    ),
    processRenewal: jest.fn(),
    revokeAndExpire: jest.fn(),
  };
  const subscriptions = {
    findDueForRenewal: jest.fn().mockResolvedValue([]),
    findPastDueInGrace: jest.fn(),
    findGraceExpired: jest.fn(),
    findCancelledAndExpired: jest.fn().mockResolvedValue([]),
  };
  const scheduler = new BillingRenewalScheduler(
    billingService as any,
    subscriptions as any,
    { get: () => undefined } as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    subscriptions.findPastDueInGrace.mockResolvedValue([]);
    subscriptions.findGraceExpired.mockResolvedValue([]);
  });

  it('sweep 2 (PAST_DUE retry) does not debit an unpaid checkout, but retries a paid one', async () => {
    subscriptions.findPastDueInGrace.mockResolvedValue([unpaidSub, paidSub]);

    await scheduler.runRenewalSweep();

    expect(billingService.releaseIfUnpaidCheckout).toHaveBeenCalledWith(
      unpaidSub,
    );
    expect(billingService.processRenewal).toHaveBeenCalledTimes(1);
    expect(billingService.processRenewal).toHaveBeenCalledWith(paidSub);
  });

  it('sweep 3 (grace expired) does not revoke/expire an unpaid checkout, but expires a paid one', async () => {
    subscriptions.findGraceExpired.mockResolvedValue([unpaidSub, paidSub]);

    await scheduler.runRenewalSweep();

    expect(billingService.revokeAndExpire).toHaveBeenCalledTimes(1);
    expect(billingService.revokeAndExpire).toHaveBeenCalledWith(
      paidSub,
      expect.any(String),
    );
  });
});

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
