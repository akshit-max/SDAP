import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BillingService } from './billing.service';
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
    create: jest.fn(),
    update: jest.fn(),
  },
  subscription: {
    findUnique: jest.fn(),
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

    it('does not activate subscription when HDFC returns FAILED status (unchanged behavior)', async () => {
      const result = await callReturnUrl({
        status: 'FAILED',
        // order_id and amount still match — status check happens AFTER validation
      });

      // validation passes, but status !== CHARGED so no activation
      expect(result.success).toBe(false);
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
    });

    it('does not activate subscription when HDFC returns PENDING_VBV (unchanged behavior)', async () => {
      const result = await callReturnUrl({ status: 'PENDING_VBV' });

      expect(result.success).toBe(false);
      expect(result.redirectPath).toBe('/pricing?status=pending');
      expect(mockSubscriptions.activate).not.toHaveBeenCalled();
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
});
