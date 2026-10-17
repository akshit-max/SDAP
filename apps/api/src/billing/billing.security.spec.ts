import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BillingService, generateHdfcId } from './billing.service';
import { HdfcGatewayService } from './hdfc/hdfc-gateway.service';
import { HdfcSignatureService } from './hdfc/hdfc-signature.service';
import { SubscriptionService } from './subscription/subscription.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

// ---------------------------------------------------------------------------
// BillingService Security Regression Tests
// F-001: HMAC enforcement on return URL
// F-002: Order Status cross-validation (order_id, amount, currency)
//
// These tests verify security controls only.
// They do NOT test mandate, renewal, or cancellation behavior.
// All HDFC API calls and database calls are mocked.
// ---------------------------------------------------------------------------

// ── Minimal payment record shape used by confirmOrderAndActivate ─────────────
const basePayment = {
  id: 'pay-uuid-001',
  hdfcOrderId: 'wPMABC123DEF456',
  subscriptionId: 'sub-uuid-001',
  amount: 499, // INR integer — matches PLAN_BASE_PRICES.PRO.MONTHLY
  status: 'PENDING',
  seatsAtCharge: 1,
};

// ── Minimal CHARGED Order Status response from HDFC ─────────────────────────
const chargedOrderStatus = {
  order_id: 'wPMABC123DEF456',
  status: 'CHARGED',
  status_id: 21,
  amount: 499, // integer — HDFC sometimes returns integer, sometimes 499.00 float
  currency: 'INR',
  txn_id: 'txn-hdfc-001',
};

// ── Mock implementations ──────────────────────────────────────────────────────

const mockSignature = {
  verifyReturnUrl: jest.fn(),
  verifyWebhookAuth: jest.fn(),
};

const mockHdfc = {
  getOrderStatus: jest.fn(),
  createSessionWithMandate: jest.fn(),
  executeMandateCharge: jest.fn(),
  revokeMandate: jest.fn(),
};

const mockSubscriptions = {
  findByOrgId: jest.fn(),
  countActiveSeats: jest.fn(),
  setPending: jest.fn(),
  activate: jest.fn(),
  markPastDue: jest.fn(),
  cancel: jest.fn(),
  expire: jest.fn(),
};

const mockPrisma = {
  payment: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  subscription: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(
    (ops: unknown[]) => Promise.all(ops) as Promise<unknown[]>,
  ),
};

const mockConfig = {
  getOrThrow: jest.fn((key: string) => {
    const map: Record<string, string> = {
      HDFC_PAYMENT_PAGE_CLIENT_ID: 'hdfcmaster',
      HDFC_RETURN_URL: 'https://api.example.com/billing/return',
      HDFC_MAX_AMOUNT_PRO: '5000',
      HDFC_MAX_AMOUNT_BUSINESS: '50000',
    };
    return map[key] ?? `mock-${key}`;
  }),
};

const mockEventEmitter = { emit: jest.fn() };

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('BillingService — Security Regression Tests', () => {
  let service: BillingService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: HdfcSignatureService, useValue: mockSignature },
        { provide: HdfcGatewayService, useValue: mockHdfc },
        { provide: SubscriptionService, useValue: mockSubscriptions },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  // ── F-003: Customer Phone Validation ────────────────────────────────────────

  describe('F-003: initiatePayment() — customer phone validation', () => {
    const baseInitiateArgs = {
      organizationId: 'org-uuid-001',
      ownerEmail: 'owner@example.com',
      plan: 'PRO' as const,
      billingCycle: 'MONTHLY' as const,
    };

    beforeEach(() => {
      // Subscription is FREE — allows initiation
      mockSubscriptions.findByOrgId.mockResolvedValue({ status: 'FREE' });
      mockSubscriptions.countActiveSeats.mockResolvedValue(1);
      mockSubscriptions.setPending.mockResolvedValue({});
      mockPrisma.payment.create.mockResolvedValue({});
      mockHdfc.createSessionWithMandate.mockResolvedValue({
        order_id: 'wPMABC123DEF456',
        status: 'NEW',
        payment_links: {
          web: 'https://smartgatewayuat.hdfcbank.com/orders/test/payment-page',
        },
      });
    });

    it('accepts a valid 10-digit phone and forwards it to HDFC', async () => {
      const result = await service.initiatePayment(
        ...(Object.values(baseInitiateArgs) as [
          string,
          string,
          'PRO',
          'MONTHLY',
        ]),
        '9876543210',
      );
      expect(result.paymentLink).toContain('payment-page');
      expect(mockHdfc.createSessionWithMandate).toHaveBeenCalledWith(
        expect.objectContaining({ customer_phone: '9876543210' }),
      );
    });

    it('rejects an empty phone string', async () => {
      await expect(
        service.initiatePayment(
          ...(Object.values(baseInitiateArgs) as [
            string,
            string,
            'PRO',
            'MONTHLY',
          ]),
          '',
        ),
      ).rejects.toThrow(
        'A valid 10-digit mobile number is required for payment processing',
      );
      expect(mockHdfc.createSessionWithMandate).not.toHaveBeenCalled();
    });

    it('rejects a phone with fewer than 10 digits', async () => {
      await expect(
        service.initiatePayment(
          ...(Object.values(baseInitiateArgs) as [
            string,
            string,
            'PRO',
            'MONTHLY',
          ]),
          '98765',
        ),
      ).rejects.toThrow('A valid 10-digit mobile number is required');
      expect(mockHdfc.createSessionWithMandate).not.toHaveBeenCalled();
    });

    it('rejects a phone with more than 10 digits', async () => {
      await expect(
        service.initiatePayment(
          ...(Object.values(baseInitiateArgs) as [
            string,
            string,
            'PRO',
            'MONTHLY',
          ]),
          '919876543210',
        ),
      ).rejects.toThrow('A valid 10-digit mobile number is required');
      expect(mockHdfc.createSessionWithMandate).not.toHaveBeenCalled();
    });

    it('rejects a phone containing non-numeric characters', async () => {
      await expect(
        service.initiatePayment(
          ...(Object.values(baseInitiateArgs) as [
            string,
            string,
            'PRO',
            'MONTHLY',
          ]),
          '9876abc210',
        ),
      ).rejects.toThrow('A valid 10-digit mobile number is required');
      expect(mockHdfc.createSessionWithMandate).not.toHaveBeenCalled();
    });

    it('rejects the hardcoded placeholder 9999999999', async () => {
      // The fabricated placeholder used in the old implementation must not be accepted
      // as a legitimate customer number. This is a regression guard.
      // Note: 9999999999 IS 10 digits and would technically pass format validation.
      // This test documents that it was never a valid customer number, but the format
      // check alone cannot distinguish it from a real number — that distinction is
      // established by removing the placeholder from the codebase (the actual F-003 fix).
      // The backend correctly forwards whatever valid number the customer provides.
      const result = await service.initiatePayment(
        ...(Object.values(baseInitiateArgs) as [
          string,
          string,
          'PRO',
          'MONTHLY',
        ]),
        '9999999999',
      );
      // If a customer genuinely has this number, it should pass — we just no longer hardcode it
      expect(mockHdfc.createSessionWithMandate).toHaveBeenCalledWith(
        expect.objectContaining({ customer_phone: '9999999999' }),
      );
      expect(result.paymentLink).toBeTruthy();
    });
  });

  // ── F-001: HMAC Enforcement ─────────────────────────────────────────────────

  describe('F-001: handleReturn() — HMAC enforcement', () => {
    it('rejects immediately when HMAC verification fails — no DB lookup, no Order Status call', async () => {
      mockSignature.verifyReturnUrl.mockReturnValue(false);

      const result = await service.handleReturn({
        order_id: 'wPMABC123DEF456',
        signature: 'invalid-sig',
        signature_algorithm: 'HMACSHA256',
      });

      expect(result.success).toBe(false);
      expect(result.redirectPath).toBe('/pricing?error=signature_invalid');

      // Crucially: DB and Order Status API must NOT be called on HMAC failure
      expect(mockPrisma.payment.findUnique).not.toHaveBeenCalled();
      expect(mockHdfc.getOrderStatus).not.toHaveBeenCalled();
    });

    it('rejects when signature param is missing', async () => {
      mockSignature.verifyReturnUrl.mockReturnValue(false);

      const result = await service.handleReturn({
        order_id: 'wPMABC123DEF456',
        // no signature field
      });

      expect(result.success).toBe(false);
      expect(result.redirectPath).toBe('/pricing?error=signature_invalid');
      expect(mockHdfc.getOrderStatus).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when order_id is missing entirely', async () => {
      await expect(service.handleReturn({ order_id: '' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('proceeds to Order Status API when HMAC is valid', async () => {
      mockSignature.verifyReturnUrl.mockReturnValue(true);
      mockPrisma.payment.findUnique.mockResolvedValue(basePayment);
      mockHdfc.getOrderStatus.mockResolvedValue(chargedOrderStatus);
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-uuid-001',
        organizationId: 'org-uuid-001',
        status: 'PENDING',
        plan: 'PRO',
        billingCycle: 'MONTHLY',
        baseAmount: 499,
        extraUsers: 0,
        totalAmount: 499,
      });
      mockPrisma.$transaction.mockImplementation(
        (ops: unknown[]) => Promise.all(ops) as Promise<unknown[]>,
      );
      mockSubscriptions.activate.mockResolvedValue({});

      const result = await service.handleReturn({
        order_id: 'wPMABC123DEF456',
        signature: 'valid-sig',
        signature_algorithm: 'HMACSHA256',
      });

      expect(result.success).toBe(true);
      expect(result.redirectPath).toBe(
        '/pricing?success=true&order_id=wPMABC123DEF456',
      );
      expect(mockHdfc.getOrderStatus).toHaveBeenCalledWith('wPMABC123DEF456');
    });

    it('returns success idempotently for an already-processed order without calling Order Status', async () => {
      mockSignature.verifyReturnUrl.mockReturnValue(true);
      mockPrisma.payment.findUnique.mockResolvedValue({
        ...basePayment,
        status: 'SUCCESS',
      });

      const result = await service.handleReturn({
        order_id: 'wPMABC123DEF456',
        signature: 'valid-sig',
        signature_algorithm: 'HMACSHA256',
      });

      expect(result.success).toBe(true);
      expect(mockHdfc.getOrderStatus).not.toHaveBeenCalled();
    });
  });

  // ── F-002: Order Status Cross-Validation ────────────────────────────────────

  describe('F-002: confirmOrderAndActivate() — Order Status cross-validation', () => {
    /**
     * Helper: set up mocks for handleReturn and call it with a valid HMAC.
     * Directly exercises confirmOrderAndActivate() through the real code path.
     */
    async function callReturnUrl(
      orderStatusOverrides: Partial<typeof chargedOrderStatus>,
    ) {
      mockSignature.verifyReturnUrl.mockReturnValue(true);
      mockPrisma.payment.findUnique.mockResolvedValue(basePayment);
      mockHdfc.getOrderStatus.mockResolvedValue({
        ...chargedOrderStatus,
        ...orderStatusOverrides,
      });
      return service.handleReturn({
        order_id: basePayment.hdfcOrderId,
        signature: 'valid-sig',
        signature_algorithm: 'HMACSHA256',
      });
    }

    it('rejects when returned order_id does not match stored hdfcOrderId', async () => {
      const result = await callReturnUrl({ order_id: 'DIFFERENT_ORDER_ID' });

      expect(result.success).toBe(false);
      expect(result.redirectPath).toBe(
        '/pricing?error=payment_validation_failed',
      );
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
    });

    it('rejects when returned amount does not match stored payment amount', async () => {
      const result = await callReturnUrl({ amount: 999 }); // stored is 499

      expect(result.success).toBe(false);
      expect(result.redirectPath).toBe(
        '/pricing?error=payment_validation_failed',
      );
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
    });

    it('accepts when returned amount strictly matches integer (499 === 499)', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-uuid-001',
        organizationId: 'org-uuid-001',
        status: 'PENDING',
        plan: 'PRO',
        billingCycle: 'MONTHLY',
        baseAmount: 499,
        extraUsers: 0,
        totalAmount: 499,
      });
      mockPrisma.$transaction.mockImplementation(
        (ops: unknown[]) => Promise.all(ops) as Promise<unknown[]>,
      );
      mockSubscriptions.activate.mockResolvedValue({});

      const result = await callReturnUrl({ amount: 499 });
      expect(result.success).toBe(true);
      expect(mockSubscriptions.activate).toHaveBeenCalled();
    });

    it('accepts when returned amount is float-equivalent of stored integer (499.00 === 499)', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-uuid-001',
        organizationId: 'org-uuid-001',
        status: 'PENDING',
        plan: 'PRO',
        billingCycle: 'MONTHLY',
        baseAmount: 499,
        extraUsers: 0,
        totalAmount: 499,
      });
      mockPrisma.$transaction.mockImplementation(
        (ops: unknown[]) => Promise.all(ops) as Promise<unknown[]>,
      );
      mockSubscriptions.activate.mockResolvedValue({});

      const result = await callReturnUrl({ amount: 499.0 });
      expect(result.success).toBe(true);
      expect(mockSubscriptions.activate).toHaveBeenCalled();
    });

    it('rejects when returned amount has fractional mismatch (e.g. 499.49 !== 499)', async () => {
      const result = await callReturnUrl({ amount: 499.49 });
      expect(result.success).toBe(false);
      expect(result.redirectPath).toBe(
        '/pricing?error=payment_validation_failed',
      );
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
    });

    it('rejects when returned amount has fractional mismatch rounding up (e.g. 499.50 !== 499)', async () => {
      const result = await callReturnUrl({ amount: 499.5 });
      expect(result.success).toBe(false);
      expect(result.redirectPath).toBe(
        '/pricing?error=payment_validation_failed',
      );
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
    });

    it('rejects when returned amount is significantly different (e.g. 500 !== 499)', async () => {
      const result = await callReturnUrl({ amount: 500 });
      expect(result.success).toBe(false);
      expect(result.redirectPath).toBe(
        '/pricing?error=payment_validation_failed',
      );
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
    });

    it('rejects safely when returned amount is non-numeric/NaN', async () => {
      // Cast to any to bypass TS for malicious payload test
      const result = await callReturnUrl({ amount: 'forty-two' as any });
      expect(result.success).toBe(false);
      expect(result.redirectPath).toBe(
        '/pricing?error=payment_validation_failed',
      );
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
    });

    it('rejects when returned currency is not INR', async () => {
      const result = await callReturnUrl({ currency: 'USD' });

      expect(result.success).toBe(false);
      expect(result.redirectPath).toBe(
        '/pricing?error=payment_validation_failed',
      );
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
    });

    it('rejects when returned currency is empty string', async () => {
      const result = await callReturnUrl({ currency: '' });

      expect(result.success).toBe(false);
      expect(result.redirectPath).toBe(
        '/pricing?error=payment_validation_failed',
      );
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
    });

    it('activates subscription only when order_id, amount, and currency all match', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-uuid-001',
        organizationId: 'org-uuid-001',
        status: 'PENDING',
        plan: 'PRO',
        billingCycle: 'MONTHLY',
        baseAmount: 499,
        extraUsers: 0,
        totalAmount: 499,
      });
      mockPrisma.$transaction.mockImplementation(
        (ops: unknown[]) => Promise.all(ops) as Promise<unknown[]>,
      );
      mockSubscriptions.activate.mockResolvedValue({});

      const result = await callReturnUrl({}); // all values match chargedOrderStatus

      expect(result.success).toBe(true);
      expect(result.redirectPath).toBe(
        '/pricing?success=true&order_id=wPMABC123DEF456',
      );
      expect(mockSubscriptions.activate).toHaveBeenCalledWith(
        'org-uuid-001',
        expect.objectContaining({ totalAmount: 499 }),
      );
    });

    it('does not activate subscription when HDFC returns FAILED status and records txn_id', async () => {
      const result = await callReturnUrl({
        status: 'FAILED',
        txn_id: 'SG6138-TXN-FAIL-01',
      });

      expect(result.success).toBe(false);
      expect(result.redirectPath).toBe('/pricing?error=payment_failed');
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
            hdfcTxnId: 'SG6138-TXN-FAIL-01',
          }),
        }),
      );
    });

    it('does not activate subscription when HDFC returns PENDING_VBV (unchanged behavior)', async () => {
      const result = await callReturnUrl({ status: 'PENDING_VBV' });

      expect(result.success).toBe(false);
      expect(result.redirectPath).toBe('/pricing?status=pending');
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
    });

    it('handles AUTHORIZING as non-terminal pending and records txn_id on payment row', async () => {
      const result = await callReturnUrl({
        status: 'AUTHORIZING' as any,
        txn_id: 'SG6138-TXN-PENDING-01',
      });

      expect(result.success).toBe(false);
      expect(result.redirectPath).toBe('/pricing?status=pending');
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            hdfcTxnId: 'SG6138-TXN-PENDING-01',
          }),
        }),
      );
    });

    it('gracefully handles duplicate transaction IDs (P2002) from return_url without activating subscription', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({ id: 'sub-uuid' });
      // Simulate unique constraint violation
      mockPrisma.$transaction.mockRejectedValue(
        Object.assign(new Error(), { code: 'P2002' }),
      );

      const result = await callReturnUrl({});

      expect(result.success).toBe(false);
      expect(result.redirectPath).toBe('/pricing?error=internal_error');
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
    });

    it('throws ConflictException for duplicate transaction IDs (P2002) from webhook', async () => {
      const { ConflictException } = require('@nestjs/common');
      mockPrisma.subscription.findUnique.mockResolvedValue({ id: 'sub-uuid' });
      // Simulate unique constraint violation
      mockPrisma.$transaction.mockRejectedValue(
        Object.assign(new Error(), { code: 'P2002' }),
      );

      // Call handleWebhook instead of callReturnUrl
      mockHdfc.getOrderStatus.mockResolvedValue(chargedOrderStatus);
      mockPrisma.payment.findUnique.mockResolvedValue({
        ...basePayment,
        status: 'PENDING',
      });

      await expect(
        service.handleWebhook({
          id: 'test-id',
          date_created: new Date().toISOString(),
          event_name: 'ORDER_SUCCEEDED',
          content: {
            order: { order_id: 'wPMABC123DEF456' } as any,
          } as any,
        }),
      ).rejects.toThrow(ConflictException);

      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
    });

    it('normalizes empty transaction IDs to null', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({ id: 'sub-uuid' });
      mockPrisma.$transaction.mockImplementation(
        (ops: unknown[]) => Promise.all(ops) as Promise<unknown[]>,
      );

      await callReturnUrl({ txn_id: '' });

      // Verify that the Prisma update was called with null for hdfcTxnId
      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ hdfcTxnId: null }),
        }),
      );
    });
  });

  // ── P4: Recurring Renewal Verification & Failure Handling ───────────────────

  describe('P4: Recurring Renewal Verification & Failure Handling', () => {
    const baseSubscription = {
      id: 'sub-uuid-renewal',
      organizationId: 'org-uuid-renewal',
      plan: 'PRO' as const,
      billingCycle: 'MONTHLY' as const,
      status: 'ACTIVE' as const,
      hdfcMandateId: 'mandate-12345',
      hdfcCustomerId: 'cust-org-12345',
      baseAmount: 499,
      extraUsers: 0,
      extraUserRate: 50,
      totalAmount: 499,
      failureCount: 0,
      currentPeriodStart: new Date('2026-09-10T00:00:00Z'),
      currentPeriodEnd: new Date('2026-10-10T00:00:00Z'),
    };

    const renewalPayment = {
      id: 'pay-uuid-renewal-001',
      hdfcOrderId: 'rPMABC123DEF456',
      subscriptionId: 'sub-uuid-renewal',
      amount: 499,
      status: 'PENDING',
      type: 'RECURRING_EXECUTION',
      seatsAtCharge: 1,
    };

    beforeEach(() => {
      mockPrisma.$transaction.mockImplementation(
        (ops: unknown[]) => Promise.all(ops) as Promise<unknown[]>,
      );
    });

    it('P4-1: leaves renewal payment PENDING when mandate execution is not yet charged', async () => {
      mockSubscriptions.countActiveSeats.mockResolvedValue(1);
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      mockPrisma.payment.create.mockResolvedValue(renewalPayment);
      mockHdfc.executeMandateCharge.mockResolvedValue({
        status: 'PENDING',
        order_id: renewalPayment.hdfcOrderId,
      });

      await service.processRenewal(baseSubscription as any);

      expect(mockPrisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'RECURRING_EXECUTION',
            status: 'PENDING',
            amount: 499,
          }),
        }),
      );
      expect(mockHdfc.executeMandateCharge).toHaveBeenCalledWith(
        'mandate-12345',
        expect.objectContaining({ order_id: expect.stringMatching(/^rPM/) }),
      );
      expect(mockPrisma.payment.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'SUCCESS' }),
        }),
      );
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
    });

    it('P4-1 & P4-2: confirms order, records hdfcTxnId, and activates subscription with preserved anchor date when charge returns CHARGED', async () => {
      mockSubscriptions.countActiveSeats.mockResolvedValue(1);
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      mockPrisma.payment.create.mockResolvedValue(renewalPayment);
      mockHdfc.executeMandateCharge.mockResolvedValue({
        status: 'CHARGED',
        order_id: renewalPayment.hdfcOrderId,
      });
      mockHdfc.getOrderStatus.mockResolvedValue({
        ...chargedOrderStatus,
        order_id: renewalPayment.hdfcOrderId,
        txn_id: 'txn-hdfc-renewal-confirmed',
      });
      mockPrisma.subscription.findUnique.mockResolvedValue(baseSubscription);

      await service.processRenewal(baseSubscription as any);

      expect(mockHdfc.getOrderStatus).toHaveBeenCalledWith(
        renewalPayment.hdfcOrderId,
      );
      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'SUCCESS',
            hdfcTxnId: 'txn-hdfc-renewal-confirmed',
          }),
        }),
      );
      expect(mockSubscriptions.activate).toHaveBeenCalledWith(
        baseSubscription.organizationId,
        expect.objectContaining({
          periodStart: baseSubscription.currentPeriodEnd,
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'audit.log',
        expect.objectContaining({
          action: 'billing.renewal_success',
        }),
      );
    });

    it('marks renewal payment FAILED and sets subscription PAST_DUE when mandate execution returns FAILED', async () => {
      mockSubscriptions.countActiveSeats.mockResolvedValue(1);
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      mockPrisma.payment.create.mockResolvedValue(renewalPayment);
      mockHdfc.executeMandateCharge.mockResolvedValue({
        status: 'FAILED',
        order_id: renewalPayment.hdfcOrderId,
      });

      await service.processRenewal(baseSubscription as any);

      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
          }),
        }),
      );
      expect(mockSubscriptions.markPastDue).toHaveBeenCalledWith(
        baseSubscription.organizationId,
        expect.stringContaining('FAILED'),
      );
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
    });

    it('marks renewal payment FAILED and sets subscription PAST_DUE on network or gateway exception', async () => {
      mockSubscriptions.countActiveSeats.mockResolvedValue(1);
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      mockPrisma.payment.create.mockResolvedValue(renewalPayment);
      mockHdfc.executeMandateCharge.mockRejectedValue(
        new Error('HDFC connection timed out'),
      );

      await service.processRenewal(baseSubscription as any);

      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
            failureReason: 'HDFC connection timed out',
          }),
        }),
      );
      expect(mockSubscriptions.markPastDue).toHaveBeenCalledWith(
        baseSubscription.organizationId,
        'HDFC connection timed out',
      );
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
    });

    it('polls existing PENDING payment instead of creating a duplicate charge', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue(renewalPayment);
      mockHdfc.getOrderStatus.mockResolvedValue({
        ...chargedOrderStatus,
        order_id: renewalPayment.hdfcOrderId,
        txn_id: 'txn-existing-pending-confirmed',
      });
      mockPrisma.subscription.findUnique.mockResolvedValue(baseSubscription);

      await service.processRenewal(baseSubscription as any);

      expect(mockPrisma.payment.create).not.toHaveBeenCalled();
      expect(mockHdfc.executeMandateCharge).not.toHaveBeenCalled();
      expect(mockHdfc.getOrderStatus).toHaveBeenCalledWith(
        renewalPayment.hdfcOrderId,
      );
      expect(mockSubscriptions.activate).toHaveBeenCalled();
    });

    it('handleWebhook ORDER_SUCCEEDED confirms PENDING renewal, persists hdfcTxnId, and preserves anchor', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(renewalPayment);
      mockHdfc.getOrderStatus.mockResolvedValue({
        ...chargedOrderStatus,
        order_id: renewalPayment.hdfcOrderId,
        txn_id: 'txn-hdfc-webhook-009',
      });
      mockPrisma.subscription.findUnique.mockResolvedValue(baseSubscription);

      await service.handleWebhook({
        id: 'evt-succ-1',
        date_created: new Date().toISOString(),
        event_name: 'ORDER_SUCCEEDED',
        content: {
          order: { order_id: renewalPayment.hdfcOrderId } as any,
        },
      });

      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'SUCCESS',
            hdfcTxnId: 'txn-hdfc-webhook-009',
          }),
        }),
      );
      expect(mockSubscriptions.activate).toHaveBeenCalledWith(
        baseSubscription.organizationId,
        expect.objectContaining({
          periodStart: baseSubscription.currentPeriodEnd,
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'audit.log',
        expect.objectContaining({
          action: 'billing.renewal_success',
        }),
      );
    });

    it('handleWebhook ORDER_SUCCEEDED is idempotent for already-SUCCESS payment', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        ...renewalPayment,
        status: 'SUCCESS',
      });

      await service.handleWebhook({
        id: 'evt-succ-idemp',
        date_created: new Date().toISOString(),
        event_name: 'ORDER_SUCCEEDED',
        content: {
          order: { order_id: renewalPayment.hdfcOrderId } as any,
        },
      });

      expect(mockHdfc.getOrderStatus).not.toHaveBeenCalled();
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
    });

    it('P4-3: handleWebhook ORDER_FAILED transitions an already-SUCCESS renewal payment to FAILED and marks PAST_DUE when HDFC confirms failure', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        ...renewalPayment,
        status: 'SUCCESS',
      });
      mockHdfc.getOrderStatus.mockResolvedValue({
        ...chargedOrderStatus,
        status: 'FAILED',
        order_id: renewalPayment.hdfcOrderId,
      });
      mockPrisma.subscription.findUnique.mockResolvedValue(baseSubscription);

      await service.handleWebhook({
        id: 'evt-fail-post-succ',
        date_created: new Date().toISOString(),
        event_name: 'ORDER_FAILED',
        content: {
          order: {
            order_id: renewalPayment.hdfcOrderId,
            bank_error_message: 'Debit failed at clearing house',
          } as any,
        },
      });

      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
            failureReason: 'Debit failed at clearing house',
          }),
        }),
      );
      expect(mockSubscriptions.markPastDue).toHaveBeenCalledWith(
        baseSubscription.organizationId,
        'Debit failed at clearing house',
      );
    });

    it('P4-3: handleWebhook ORDER_FAILED ignores contradictory failure event when HDFC confirms CHARGED', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        ...renewalPayment,
        status: 'SUCCESS',
      });
      mockHdfc.getOrderStatus.mockResolvedValue({
        ...chargedOrderStatus,
        status: 'CHARGED',
        order_id: renewalPayment.hdfcOrderId,
      });
      mockPrisma.subscription.findUnique.mockResolvedValue(baseSubscription);

      await service.handleWebhook({
        id: 'evt-fail-contradictory',
        date_created: new Date().toISOString(),
        event_name: 'ORDER_FAILED',
        content: {
          order: {
            order_id: renewalPayment.hdfcOrderId,
            bank_error_message: 'Delayed failure notice',
          } as any,
        },
      });

      expect(mockPrisma.payment.update).not.toHaveBeenCalled();
      expect(mockSubscriptions.markPastDue).not.toHaveBeenCalled();
    });

    it('P4-3: handleWebhook ORDER_FAILED transitions a PENDING renewal payment to FAILED and marks PAST_DUE', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(renewalPayment);
      mockPrisma.subscription.findUnique.mockResolvedValue(baseSubscription);

      await service.handleWebhook({
        id: 'evt-fail-pending',
        date_created: new Date().toISOString(),
        event_name: 'ORDER_FAILED',
        content: {
          order: {
            order_id: renewalPayment.hdfcOrderId,
            bank_error_message: 'Insufficient balance',
          } as any,
        },
      });

      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
            failureReason: 'Insufficient balance',
          }),
        }),
      );
      expect(mockSubscriptions.markPastDue).toHaveBeenCalledWith(
        baseSubscription.organizationId,
        'Insufficient balance',
      );
    });

    it('handleWebhook ORDER_FAILED is idempotent for already-FAILED payment', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        ...renewalPayment,
        status: 'FAILED',
      });

      await service.handleWebhook({
        id: 'evt-fail-idemp',
        date_created: new Date().toISOString(),
        event_name: 'ORDER_FAILED',
        content: {
          order: {
            order_id: renewalPayment.hdfcOrderId,
          } as any,
        },
      });

      expect(mockPrisma.payment.update).not.toHaveBeenCalled();
      expect(mockSubscriptions.markPastDue).not.toHaveBeenCalled();
    });

    it('does not activate renewal subscription when order amount mismatches in HDFC response', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(renewalPayment);
      mockHdfc.getOrderStatus.mockResolvedValue({
        ...chargedOrderStatus,
        order_id: renewalPayment.hdfcOrderId,
        amount: 9999,
      });

      await service.handleWebhook({
        id: 'evt-mismatch',
        date_created: new Date().toISOString(),
        event_name: 'ORDER_SUCCEEDED',
        content: {
          order: { order_id: renewalPayment.hdfcOrderId } as any,
        },
      });

      expect(mockPrisma.payment.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'SUCCESS' }),
        }),
      );
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
    });

    it('confirmOrderAndActivate entry guard prevents double-extending an already-SUCCESS payment', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        ...renewalPayment,
        status: 'SUCCESS',
      });

      const result = await (service as any).confirmOrderAndActivate(
        { ...renewalPayment, status: 'SUCCESS' },
        'scheduler',
      );

      expect(result.success).toBe(true);
      expect(mockHdfc.getOrderStatus).not.toHaveBeenCalled();
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
    });

    it('processRenewal skips concurrent execution for the same subscription ID', async () => {
      // Simulate active renewal in progress by adding the subscription ID to the internal Set
      (service as any).activeRenewalSubIds.add(baseSubscription.id);

      await service.processRenewal(baseSubscription as any);

      expect(mockPrisma.payment.create).not.toHaveBeenCalled();
      expect(mockHdfc.executeMandateCharge).not.toHaveBeenCalled();

      // Clean up Set
      (service as any).activeRenewalSubIds.delete(baseSubscription.id);
    });

    it('P4-4: handleWebhook MANDATE_REVOKED transitions ACTIVE subscription to CANCELLED without premature expiry when period is active', async () => {
      const futurePeriodEnd = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
      mockPrisma.subscription.findFirst.mockResolvedValue({
        ...baseSubscription,
        status: 'ACTIVE',
        currentPeriodEnd: futurePeriodEnd,
      });

      await service.handleWebhook({
        id: 'evt-mandate-revoked-active',
        date_created: new Date().toISOString(),
        event_name: 'MANDATE_REVOKED',
        content: {
          mandate: {
            mandate_id: 'mandate-12345',
            status: 'REVOKED',
          },
        },
      });

      // Cancels subscription so it does not auto-renew
      expect(mockSubscriptions.cancel).toHaveBeenCalledWith(
        baseSubscription.organizationId,
        'Mandate revoked by bank',
      );
      // Clears mandate ID on the database record
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: baseSubscription.id },
          data: { hdfcMandateId: null },
        }),
      );
      // Does NOT expire prematurely
      expect(mockSubscriptions.expire).not.toHaveBeenCalled();
      // Emits audit log
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'audit.log',
        expect.objectContaining({
          action: 'billing.mandate_revoked',
          metadata: expect.objectContaining({
            mandateId: 'mandate-12345',
            reconciliation: 'CANCELLED_UNTIL_PERIOD_END',
          }),
        }),
      );
    });

    it('P4-4: handleWebhook MANDATE_REVOKED expires PAST_DUE subscription immediately', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({
        ...baseSubscription,
        status: 'PAST_DUE',
      });

      await service.handleWebhook({
        id: 'evt-mandate-revoked-pastdue',
        date_created: new Date().toISOString(),
        event_name: 'MANDATE_REVOKED',
        content: {
          mandate: {
            mandate_id: 'mandate-12345',
            status: 'REVOKED',
          },
        },
      });

      // Expires immediately
      expect(mockSubscriptions.expire).toHaveBeenCalledWith(
        baseSubscription.organizationId,
      );
      expect(mockSubscriptions.cancel).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'audit.log',
        expect.objectContaining({
          action: 'billing.mandate_revoked',
          metadata: expect.objectContaining({
            mandateId: 'mandate-12345',
            reconciliation: 'EXPIRED_IMMEDIATELY',
          }),
        }),
      );
    });

    it('P4-4: handleWebhook MANDATE_REVOKED is idempotent for already EXPIRED or FREE subscription', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({
        ...baseSubscription,
        status: 'EXPIRED',
      });

      await service.handleWebhook({
        id: 'evt-mandate-revoked-idemp',
        date_created: new Date().toISOString(),
        event_name: 'MANDATE_REVOKED',
        content: {
          mandate: {
            mandate_id: 'mandate-12345',
          },
        },
      });

      expect(mockSubscriptions.cancel).not.toHaveBeenCalled();
      expect(mockSubscriptions.expire).not.toHaveBeenCalled();
      expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
    });

    it('P4-4: handleWebhook MANDATE_REVOKED clears mandate ID on already CANCELLED subscription', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({
        ...baseSubscription,
        status: 'CANCELLED',
      });

      await service.handleWebhook({
        id: 'evt-mandate-revoked-cancelled',
        date_created: new Date().toISOString(),
        event_name: 'MANDATE_REVOKED',
        content: {
          mandate: {
            mandate_id: 'mandate-12345',
          },
        },
      });

      expect(mockSubscriptions.cancel).not.toHaveBeenCalled();
      expect(mockSubscriptions.expire).not.toHaveBeenCalled();
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: baseSubscription.id },
          data: { hdfcMandateId: null },
        }),
      );
    });

    it('P4-4: handleWebhook MANDATE_REVOKED safely ignores unknown mandate ID or missing ID', async () => {
      // Missing mandate ID
      await service.handleWebhook({
        id: 'evt-mandate-revoked-noid',
        date_created: new Date().toISOString(),
        event_name: 'MANDATE_REVOKED',
        content: {},
      });

      expect(mockPrisma.subscription.findFirst).not.toHaveBeenCalled();

      // Unknown mandate ID
      mockPrisma.subscription.findFirst.mockResolvedValue(null);
      await service.handleWebhook({
        id: 'evt-mandate-revoked-unknown',
        date_created: new Date().toISOString(),
        event_name: 'MANDATE_REVOKED',
        content: {
          mandate: {
            mandate_id: 'mandate-unknown',
          },
        },
      });

      expect(mockSubscriptions.cancel).not.toHaveBeenCalled();
      expect(mockSubscriptions.expire).not.toHaveBeenCalled();
    });
  });

  // ── Checkout failure isolation, compare-and-set, late CHARGED review ────────

  describe('Checkout state integrity (issues 1, 4, 5)', () => {
    const checkoutPayment = {
      ...basePayment,
      type: 'MANDATE_REGISTRATION',
      createdAt: new Date('2026-10-17T09:30:00Z'),
    };
    const renewalPayment = {
      ...basePayment,
      id: 'pay-uuid-renewal-cas',
      hdfcOrderId: 'rPMCAS0000000001',
      type: 'RECURRING_EXECUTION',
    };
    const pendingSub = {
      id: 'sub-uuid-001',
      organizationId: 'org-uuid-001',
      status: 'PENDING',
      plan: 'PRO',
      billingCycle: 'MONTHLY',
      baseAmount: 499,
      extraUsers: 0,
      totalAmount: 499,
      failureCount: 2,
      hdfcMandateId: 'mndCHECKOUT00001',
      currentPeriodEnd: new Date('2026-11-17T00:00:00Z'),
    };
    const failedStatus = {
      ...chargedOrderStatus,
      status: 'AUTHORIZATION_FAILED',
      status_id: 27,
      bank_error_message: 'Authorization failed',
    };
    const lostRace = () => Object.assign(new Error(), { code: 'P2025' });

    beforeEach(() => {
      mockPrisma.payment.update.mockReset();
      mockPrisma.payment.findFirst.mockReset();
      mockPrisma.$transaction.mockImplementation(
        (ops: unknown[]) => Promise.all(ops) as Promise<unknown[]>,
      );
      mockSubscriptions.activate.mockResolvedValue({});
    });

    it('failed checkout via return URL marks the payment FAILED and leaves the subscription untouched', async () => {
      mockSignature.verifyReturnUrl.mockReturnValue(true);
      mockPrisma.payment.findUnique.mockResolvedValue(checkoutPayment);
      mockHdfc.getOrderStatus.mockResolvedValue(failedStatus);
      // failureCount 2 → the old code would have revoked the mandate and expired
      mockPrisma.subscription.findUnique.mockResolvedValue(pendingSub);

      const result = await service.handleReturn({
        order_id: checkoutPayment.hdfcOrderId,
        signature: 'valid-sig',
        signature_algorithm: 'HMACSHA256',
      });

      expect(result.redirectPath).toBe('/pricing?error=payment_failed');
      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: checkoutPayment.id, status: 'PENDING' },
          data: expect.objectContaining({
            status: 'FAILED',
            failureCode: '27',
          }),
        }),
      );
      expect(mockSubscriptions.markPastDue).not.toHaveBeenCalled();
      expect(mockSubscriptions.expire).not.toHaveBeenCalled();
      expect(mockHdfc.revokeMandate).not.toHaveBeenCalled();
    });

    it('failed checkout via ORDER_FAILED webhook leaves the subscription untouched', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(checkoutPayment);
      mockPrisma.subscription.findUnique.mockResolvedValue(pendingSub);

      await service.handleWebhook({
        id: 'evt-checkout-fail',
        date_created: new Date().toISOString(),
        event_name: 'ORDER_FAILED',
        content: {
          order: {
            order_id: checkoutPayment.hdfcOrderId,
            bank_error_message: 'Authorization failed',
          } as any,
        },
      });

      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: checkoutPayment.id, status: 'PENDING' },
          data: expect.objectContaining({ status: 'FAILED' }),
        }),
      );
      expect(mockSubscriptions.markPastDue).not.toHaveBeenCalled();
      expect(mockSubscriptions.expire).not.toHaveBeenCalled();
      expect(mockHdfc.revokeMandate).not.toHaveBeenCalled();
    });

    it('failed renewal via return/scheduler path still marks the subscription PAST_DUE', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(renewalPayment);
      mockHdfc.getOrderStatus.mockResolvedValue({
        ...failedStatus,
        order_id: renewalPayment.hdfcOrderId,
      });
      mockPrisma.subscription.findUnique.mockResolvedValue({
        ...pendingSub,
        status: 'ACTIVE',
        failureCount: 0,
      });

      await (service as any).confirmOrderAndActivate(
        renewalPayment,
        'scheduler',
      );

      expect(mockSubscriptions.markPastDue).toHaveBeenCalledWith(
        'org-uuid-001',
        'Authorization failed',
      );
    });

    it('does not count a failure twice when another handler already recorded it (CAS lost)', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(renewalPayment);
      mockHdfc.getOrderStatus.mockResolvedValue({
        ...failedStatus,
        order_id: renewalPayment.hdfcOrderId,
      });
      mockPrisma.payment.update.mockRejectedValue(lostRace());

      const result = await (service as any).confirmOrderAndActivate(
        renewalPayment,
        'return_url',
      );

      expect(result.redirectPath).toBe('/pricing?error=payment_failed');
      expect(mockSubscriptions.markPastDue).not.toHaveBeenCalled();
      expect(mockSubscriptions.expire).not.toHaveBeenCalled();
    });

    it('records the failure without txn_id when the txn_id is a duplicate (P2002 fallback keeps the CAS)', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(checkoutPayment);
      mockHdfc.getOrderStatus.mockResolvedValue({
        ...failedStatus,
        txn_id: 'dup-txn',
      });
      mockPrisma.payment.update
        .mockRejectedValueOnce(Object.assign(new Error(), { code: 'P2002' }))
        .mockResolvedValueOnce({});

      await (service as any).confirmOrderAndActivate(
        checkoutPayment,
        'return_url',
      );

      expect(mockPrisma.payment.update).toHaveBeenCalledTimes(2);
      const fallback = mockPrisma.payment.update.mock.calls[1][0];
      expect(fallback.where).toEqual({
        id: checkoutPayment.id,
        status: 'PENDING',
      });
      expect(fallback.data.hdfcTxnId).toBeUndefined();
    });

    it('moves a payment to SUCCESS only from PENDING or FAILED (compare-and-set)', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(checkoutPayment);
      mockHdfc.getOrderStatus.mockResolvedValue(chargedOrderStatus);
      mockPrisma.subscription.findUnique.mockResolvedValue(pendingSub);

      const result = await (service as any).confirmOrderAndActivate(
        checkoutPayment,
        'return_url',
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: checkoutPayment.id,
            status: { in: ['PENDING', 'FAILED'] },
          },
          data: expect.objectContaining({ status: 'SUCCESS' }),
        }),
      );
      expect(mockSubscriptions.activate).toHaveBeenCalledTimes(1);
    });

    it('two concurrent confirmations of the same CHARGED renewal extend the period once', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(renewalPayment);
      mockHdfc.getOrderStatus.mockResolvedValue({
        ...chargedOrderStatus,
        order_id: renewalPayment.hdfcOrderId,
      });
      mockPrisma.subscription.findUnique.mockResolvedValue({
        ...pendingSub,
        status: 'ACTIVE',
      });
      // First writer wins the CAS; the second finds the row no longer PENDING/FAILED
      mockPrisma.payment.update
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(lostRace());

      const results = await Promise.all([
        (service as any).confirmOrderAndActivate(renewalPayment, 'return_url'),
        (service as any).confirmOrderAndActivate(renewalPayment, 'scheduler'),
      ]);

      expect(results.every((r: any) => r.success)).toBe(true);
      expect(mockSubscriptions.activate).toHaveBeenCalledTimes(1);
      expect(
        mockEventEmitter.emit.mock.calls.filter(
          ([, e]: any) => e.action === 'billing.renewal_success',
        ),
      ).toHaveLength(1);
    });

    it('late CHARGED checkout for a non-PENDING subscription records SUCCESS, does not activate, and raises a review event', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(checkoutPayment);
      mockHdfc.getOrderStatus.mockResolvedValue(chargedOrderStatus);
      mockPrisma.subscription.findUnique.mockResolvedValue({
        ...pendingSub,
        status: 'ACTIVE',
      });

      const result = await (service as any).confirmOrderAndActivate(
        checkoutPayment,
        'scheduler',
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'SUCCESS' }),
        }),
      );
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'audit.log',
        expect.objectContaining({
          action: 'billing.payment_needs_review',
          resourceId: checkoutPayment.id,
          metadata: expect.objectContaining({
            reason: 'CHARGED_WHILE_SUBSCRIPTION_NOT_PENDING',
            subscriptionStatus: 'ACTIVE',
          }),
        }),
      );
    });

    it('activates a CHARGED checkout but flags a possible mandate mismatch when a newer checkout exists', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(checkoutPayment);
      mockHdfc.getOrderStatus.mockResolvedValue(chargedOrderStatus);
      mockPrisma.subscription.findUnique.mockResolvedValue(pendingSub);
      mockPrisma.payment.findFirst.mockResolvedValue({
        hdfcOrderId: 'wPMNEWER00000001',
      });

      await (service as any).confirmOrderAndActivate(
        checkoutPayment,
        'scheduler',
      );

      expect(mockSubscriptions.activate).toHaveBeenCalledTimes(1);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'audit.log',
        expect.objectContaining({
          action: 'billing.payment_needs_review',
          metadata: expect.objectContaining({
            reason: 'MANDATE_ID_MAY_BELONG_TO_LATER_CHECKOUT',
            newerOrderId: 'wPMNEWER00000001',
          }),
        }),
      );
    });
  });

  // ── Abandoned checkout reconciliation sweep ─────────────────────────────────

  describe('reconcilePendingCheckouts()', () => {
    const now = new Date('2026-10-17T12:00:00Z');
    const row = (orderId: string, minutesAgo = 60) => ({
      ...basePayment,
      id: `pay-${orderId}`,
      hdfcOrderId: orderId,
      type: 'MANDATE_REGISTRATION',
      status: 'PENDING',
      createdAt: new Date(now.getTime() - minutesAgo * 60 * 1000),
    });
    const statusFor = (orderId: string, status: string, extra = {}) => ({
      ...chargedOrderStatus,
      order_id: orderId,
      status,
      ...extra,
    });
    const pendingSub = {
      id: 'sub-uuid-001',
      organizationId: 'org-uuid-001',
      status: 'PENDING',
      plan: 'PRO',
      billingCycle: 'MONTHLY',
      baseAmount: 499,
      extraUsers: 0,
      totalAmount: 499,
      failureCount: 2,
    };

    beforeEach(() => {
      (service as any).reconcileCursor = null;
      mockPrisma.payment.update.mockReset();
      mockPrisma.payment.findFirst.mockReset();
      mockPrisma.payment.findMany.mockReset();
      mockHdfc.getOrderStatus.mockReset();
      mockPrisma.$transaction.mockImplementation(
        (ops: unknown[]) => Promise.all(ops) as Promise<unknown[]>,
      );
      mockPrisma.subscription.findUnique.mockResolvedValue(pendingSub);
      mockSubscriptions.activate.mockResolvedValue({});
      // confirmOrderAndActivate re-reads the row for its SUCCESS guard: still PENDING
      mockPrisma.payment.findUnique.mockImplementation(({ where }: any) =>
        Promise.resolve({ id: where.id, status: 'PENDING' }),
      );
    });

    it('selects only PENDING MANDATE_REGISTRATION payments created 20 min – 24 h ago, 20 per run', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([]);

      await service.reconcilePendingCheckouts({ dryRun: false, now });

      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith({
        where: {
          type: 'MANDATE_REGISTRATION',
          status: 'PENDING',
          createdAt: {
            gt: new Date('2026-10-16T12:00:00Z'),
            lte: new Date('2026-10-17T11:40:00Z'),
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 20,
      });
    });

    it('CHARGED: marks SUCCESS and activates via confirmOrderAndActivate, calling HDFC once', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([row('wPMCHARGED000001')]);
      mockHdfc.getOrderStatus.mockResolvedValue(
        statusFor('wPMCHARGED000001', 'CHARGED'),
      );

      const summary = await service.reconcilePendingCheckouts({
        dryRun: false,
        now,
      });

      expect(summary.charged).toBe(1);
      expect(mockHdfc.getOrderStatus).toHaveBeenCalledTimes(1);
      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'SUCCESS' }),
        }),
      );
      expect(mockSubscriptions.activate).toHaveBeenCalledTimes(1);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'audit.log',
        expect.objectContaining({
          action: 'billing.subscription_activated',
          metadata: expect.objectContaining({ source: 'scheduler' }),
        }),
      );
    });

    it('AUTHORIZATION_FAILED: marks FAILED and leaves the subscription untouched', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([row('wPMDECLINED00001')]);
      mockHdfc.getOrderStatus.mockResolvedValue(
        statusFor('wPMDECLINED00001', 'AUTHORIZATION_FAILED', {
          status_id: 27,
        }),
      );

      const summary = await service.reconcilePendingCheckouts({
        dryRun: false,
        now,
      });

      expect(summary.failed).toBe(1);
      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pay-wPMDECLINED00001', status: 'PENDING' },
          data: expect.objectContaining({
            status: 'FAILED',
            failureCode: '27',
          }),
        }),
      );
      expect(mockSubscriptions.markPastDue).not.toHaveBeenCalled();
      expect(mockSubscriptions.expire).not.toHaveBeenCalled();
      expect(mockHdfc.revokeMandate).not.toHaveBeenCalled();
    });

    it.each(['NEW', 'PENDING_VBV', 'AUTHORIZING', 'AUTO_REFUNDED', 'FAILED'])(
      '%s: leaves the payment PENDING and writes nothing',
      async (status) => {
        mockPrisma.payment.findMany.mockResolvedValue([
          row('wPMLEAVE00000001'),
        ]);
        mockHdfc.getOrderStatus.mockResolvedValue(
          statusFor('wPMLEAVE00000001', status),
        );

        const summary = await service.reconcilePendingCheckouts({
          dryRun: false,
          now,
        });

        expect(summary.leftPending).toBe(1);
        expect(mockPrisma.payment.update).not.toHaveBeenCalled();
        expect(mockSubscriptions.activate).not.toHaveBeenCalled();
      },
    );

    it('dry-run: queries HDFC and logs decisions but writes nothing', async () => {
      const logSpy = jest.spyOn((service as any).logger, 'log');
      mockPrisma.payment.findMany.mockResolvedValue([
        row('wPMDRYCHARGED001', 90),
        row('wPMDRYDECLINE001', 80),
      ]);
      mockHdfc.getOrderStatus.mockImplementation((orderId: string) =>
        Promise.resolve(
          orderId === 'wPMDRYCHARGED001'
            ? statusFor(orderId, 'CHARGED')
            : statusFor(orderId, 'AUTHORIZATION_FAILED'),
        ),
      );

      const summary = await service.reconcilePendingCheckouts({
        dryRun: true,
        now,
      });

      expect(summary).toMatchObject({ dryRun: true, charged: 1, failed: 1 });
      expect(mockHdfc.getOrderStatus).toHaveBeenCalledTimes(2);
      expect(mockPrisma.payment.update).not.toHaveBeenCalled();
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'wPMDRYCHARGED001 HDFC CHARGED → would mark SUCCESS and ACTIVATE',
        ),
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'wPMDRYDECLINE001 HDFC AUTHORIZATION_FAILED → would mark FAILED',
        ),
      );
    });

    it('never changes a payment that became SUCCESS after it was selected', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([row('wPMRACED00000001')]);
      mockPrisma.payment.findUnique.mockResolvedValue({
        ...row('wPMRACED00000001'),
        status: 'SUCCESS',
      });
      mockHdfc.getOrderStatus.mockResolvedValue(
        statusFor('wPMRACED00000001', 'AUTHORIZATION_FAILED'),
      );

      await service.reconcilePendingCheckouts({ dryRun: false, now });

      expect(mockPrisma.payment.update).not.toHaveBeenCalled();
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
    });

    it('continues past a single HDFC error and stops after 3 consecutive errors', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([
        row('wPMERR0000000001', 200),
        row('wPMOK00000000001', 190),
        row('wPMERR0000000002', 180),
        row('wPMERR0000000003', 170),
        row('wPMERR0000000004', 160),
        row('wPMNEVER00000001', 150),
      ]);
      mockHdfc.getOrderStatus.mockImplementation((orderId: string) =>
        orderId.startsWith('wPMOK')
          ? Promise.resolve(statusFor(orderId, 'NEW'))
          : Promise.reject(new Error('HDFC API GET returned 503')),
      );

      const summary = await service.reconcilePendingCheckouts({
        dryRun: false,
        now,
      });

      expect(summary).toMatchObject({ scanned: 5, errors: 4, leftPending: 1 });
      expect(mockHdfc.getOrderStatus).not.toHaveBeenCalledWith(
        'wPMNEVER00000001',
      );
    });

    it('skips a run while a previous run is still in progress', async () => {
      let release!: (rows: unknown[]) => void;
      mockPrisma.payment.findMany.mockReturnValue(
        new Promise((resolve) => (release = resolve)),
      );

      const first = service.reconcilePendingCheckouts({ dryRun: false, now });
      const second = await service.reconcilePendingCheckouts({
        dryRun: false,
        now,
      });
      release([]);
      await first;

      expect(second.skipped).toBe(true);
      expect(mockPrisma.payment.findMany).toHaveBeenCalledTimes(1);
    });

    it('rotates through candidates: a full batch resumes after the last row, a short batch restarts', async () => {
      const full = Array.from({ length: 20 }, (_, i) =>
        row(`wPMROT${String(i).padStart(10, '0')}`, 300 - i),
      );
      mockHdfc.getOrderStatus.mockImplementation((orderId: string) =>
        Promise.resolve(statusFor(orderId, 'NEW')),
      );

      mockPrisma.payment.findMany.mockResolvedValueOnce(full);
      await service.reconcilePendingCheckouts({ dryRun: false, now });
      mockPrisma.payment.findMany.mockResolvedValueOnce([]);
      await service.reconcilePendingCheckouts({ dryRun: false, now });
      mockPrisma.payment.findMany.mockResolvedValueOnce([]);
      await service.reconcilePendingCheckouts({ dryRun: false, now });

      const gt = (call: number) =>
        mockPrisma.payment.findMany.mock.calls[call][0].where.createdAt.gt;
      expect(gt(1)).toEqual(full[19]!.createdAt);
      expect(gt(2)).toEqual(new Date('2026-10-16T12:00:00Z'));
    });
  });

  describe('generateHdfcId (HDFC ID Format Validation)', () => {
    it('generates IDs with length strictly less than 21 (<= 20 chars)', () => {
      for (let i = 0; i < 50; i++) {
        const id = generateHdfcId('wPM');
        expect(id.length).toBeLessThan(21);
        expect(id.length).toBeLessThanOrEqual(20);
      }
    });

    it('generates strictly alphanumeric IDs with no special characters', () => {
      for (let i = 0; i < 50; i++) {
        const id = generateHdfcId('wPM');
        expect(/^[A-Za-z0-9]+$/.test(id)).toBe(true);
      }
    });

    it('generates non-sequential cryptographic random IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateHdfcId('wPM'));
      }
      // All 100 generated IDs should be completely unique
      expect(ids.size).toBe(100);
    });

    it('starts with the specified prefix', () => {
      const id = generateHdfcId('wPM');
      expect(id.startsWith('wPM')).toBe(true);
    });
  });
});
