import {
  SubscriptionService,
  isLatestCheckoutUnpaid,
} from './subscription.service';

describe('SubscriptionService — unpaid checkout helpers', () => {
  const prisma = {
    payment: { findFirst: jest.fn() },
    subscription: { updateMany: jest.fn() },
  };
  const service = new SubscriptionService(prisma as any);

  beforeEach(() => jest.clearAllMocks());

  describe('isLatestCheckoutUnpaid()', () => {
    it('looks at the most recent MANDATE_REGISTRATION payment only', async () => {
      prisma.payment.findFirst.mockResolvedValue({ status: 'FAILED' });
      await isLatestCheckoutUnpaid(prisma as any, 'sub-1');
      expect(prisma.payment.findFirst).toHaveBeenCalledWith({
        where: { subscriptionId: 'sub-1', type: 'MANDATE_REGISTRATION' },
        orderBy: { createdAt: 'desc' },
        select: { status: true },
      });
    });

    it.each([
      ['PENDING', true],
      ['FAILED', true],
      ['SUCCESS', false],
      ['REFUNDED', false],
    ])('latest checkout %s → unpaid=%p', async (status, expected) => {
      prisma.payment.findFirst.mockResolvedValue({ status });
      expect(await isLatestCheckoutUnpaid(prisma as any, 'sub-1')).toBe(
        expected,
      );
    });

    it('treats a subscription with no checkout payment as not unpaid', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);
      expect(await isLatestCheckoutUnpaid(prisma as any, 'sub-1')).toBe(false);
    });
  });

  describe('releaseUnpaidPastDue()', () => {
    it('moves PAST_DUE → PENDING with a compare-and-set on PAST_DUE', async () => {
      prisma.subscription.updateMany.mockResolvedValue({ count: 1 });

      expect(await service.releaseUnpaidPastDue('org-1')).toBe(true);
      expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', status: 'PAST_DUE' },
        data: { status: 'PENDING', graceUntil: null },
      });
    });

    it('returns false when the subscription is no longer PAST_DUE', async () => {
      prisma.subscription.updateMany.mockResolvedValue({ count: 0 });
      expect(await service.releaseUnpaidPastDue('org-1')).toBe(false);
    });
  });
});
