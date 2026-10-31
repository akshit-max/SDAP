import { ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { GmailOtpService } from './gmail-otp.service';

/**
 * Fixtures are representative bodies taken from the formats documented in
 * otp-patterns.ts — not captured production emails.
 */
const LOGIN_START = 1_700_000_000_000;

function gmailMessage(
  from: string,
  body: string,
  internalDate = LOGIN_START + 5_000,
) {
  return {
    internalDate: String(internalDate),
    payload: {
      headers: [{ name: 'From', value: from }],
      mimeType: 'text/plain',
      body: { data: Buffer.from(body, 'utf8').toString('base64url') },
    },
  };
}

/** Mocks Gmail REST: list returns the given messages (ids m0..mN), get returns each. */
function mockGmail(messages: ReturnType<typeof gmailMessage>[]) {
  const fetchMock = jest.fn(async (url: string) => {
    const path = url.split('/users/me')[1] ?? '';
    const json = path.startsWith('/messages?')
      ? {
          messages: messages.map((_, i) => ({
            id: `m${i}`,
            threadId: `t${i}`,
          })),
        }
      : messages[Number(path.match(/\/messages\/m(\d+)/)![1])];
    return {
      ok: true,
      status: 200,
      json: async () => json,
      text: async () => '',
    };
  });
  global.fetch = fetchMock as any;
  return fetchMock;
}

describe('GmailOtpService', () => {
  let service: GmailOtpService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    service = new GmailOtpService();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('existing production platforms (regression)', () => {
    it.each([
      [
        'VERCEL',
        'Vercel <system@vercel.com>',
        'Hi navyabhandula-3225, a login request was made from Mumbai, India. 988598 This code expires soon.',
        '988598',
      ],
      [
        'STRIPE',
        'Stripe <notifications@stripe.com>',
        'Your Stripe verification code is 482913.',
        '482913',
      ],
      [
        'RAZORPAY',
        'Razorpay <no-reply@razorpay.com>',
        'Use the following verification code: 542284',
        '542284',
      ],
      [
        'RAZORPAY',
        'Razorpay <no-reply@razorpay.com>',
        'Your OTP for login is 1234',
        '1234',
      ],
      [
        'GITHUB',
        'GitHub <noreply@github.com>',
        'Hey akshit-max-creator!\nDevice: Microsoft Edge on Windows\nVerification code: 213351\nIf you did not attempt...',
        '213351',
      ],
      [
        'LINKEDIN',
        'LinkedIn <security-noreply@linkedin.com>',
        'Hi Navya,\nEnter this code to complete the reset.\n371206\nIf you did not request this pin...',
        '371206',
      ],
      [
        'GODADDY',
        'GoDaddy <donotreply@godaddy.com>',
        'Verify your email.\nHere is your email verification code:\n000900\nJust a heads up, this code will expire...',
        '000900',
      ],
    ])('%s extracts the code', async (platform, from, body, expected) => {
      mockGmail([gmailMessage(from, body)]);
      await expect(
        service.fetchLatestOtp('tok', platform, LOGIN_START),
      ).resolves.toBe(expected);
    });

    it.each([
      ['VERCEL', 'from:vercel.com'],
      ['STRIPE', 'from:stripe.com'],
      ['RAZORPAY', 'from:razorpay.com'],
      ['GITHUB', 'from:(github.com OR noreply.github.com)'],
      ['LINKEDIN', 'from:(linkedin.com OR e.linkedin.com)'],
      ['GODADDY', 'from:godaddy.com'],
    ])('%s searches only its own sender', async (platform, senderFilter) => {
      const fetchMock = mockGmail([
        gmailMessage(
          `x@${senderFilter.slice(5)}`,
          'Your Stripe verification code is 111111 OTP for login is 111111 222222',
        ),
      ]);
      await service.fetchLatestOtp('tok', platform, LOGIN_START);
      const q = new URL(fetchMock.mock.calls[0]![0]).searchParams.get('q');
      expect(q).toBe(`newer_than:5m in:inbox ${senderFilter}`);
    });
  });

  describe('unknown platforms', () => {
    it.each([null, 'UNKNOWN', 'GMAIL', ''])(
      'refuses platform %p without calling Gmail',
      async (platform) => {
        const fetchMock = mockGmail([]);
        await expect(
          service.fetchLatestOtp('tok', platform as any, LOGIN_START),
        ).rejects.toThrow(ForbiddenException);
        expect(fetchMock).not.toHaveBeenCalled();
      },
    );
  });

  describe('Shopify code length', () => {
    it('returns the full 10-digit code instead of its first 6 digits', async () => {
      mockGmail([
        gmailMessage(
          'Shopify <mailer@shopify.com>',
          'Your verification code is 1234567890',
        ),
      ]);
      await expect(
        service.fetchLatestOtp('tok', 'SHOPIFY', LOGIN_START),
      ).resolves.toBe('1234567890');
    });

    it('still returns a 6-digit code', async () => {
      mockGmail([
        gmailMessage(
          'Shopify <mailer@shopify.com>',
          'Enter: 654321 to continue',
        ),
      ]);
      await expect(
        service.fetchLatestOtp('tok', 'SHOPIFY', LOGIN_START),
      ).resolves.toBe('654321');
    });

    it('returns a 6-digit code from real account verification email format', async () => {
      mockGmail([
        gmailMessage(
          'Shopify <mailer@shopify.com>',
          'Your verification code\nWe received a request to verify your account. Use this one time code to continue:\n363241\nThis code expires in 10 minutes.',
        ),
      ]);
      await expect(
        service.fetchLatestOtp('tok', 'SHOPIFY', LOGIN_START),
      ).resolves.toBe('363241');
    });
  });

  describe('freshness', () => {
    it('ignores an email older than loginStartTime - 15s and reports not found', async () => {
      jest.useFakeTimers();
      mockGmail([
        gmailMessage(
          'Stripe <x@stripe.com>',
          'Your Stripe verification code is 111111',
          LOGIN_START - 60_000,
        ),
      ]);
      const result = service.fetchLatestOtp('tok', 'STRIPE', LOGIN_START);
      const assertion = expect(result).rejects.toThrow(NotFoundException);
      await jest.advanceTimersByTimeAsync(20_000);
      await assertion;
    });
  });

  describe('logging', () => {
    it('never logs the OTP or email body text', async () => {
      const spies = (['log', 'debug', 'verbose', 'warn', 'error'] as const).map(
        (m) =>
          jest.spyOn(Logger.prototype, m).mockImplementation(() => undefined),
      );
      mockGmail([
        gmailMessage(
          'Stripe <x@stripe.com>',
          'SECRETBODYMARKER Your Stripe verification code is 739104',
        ),
      ]);

      await expect(
        service.fetchLatestOtp('tok', 'STRIPE', LOGIN_START),
      ).resolves.toBe('739104');

      const logged = spies
        .flatMap((s) => s.mock.calls.flat())
        .map(String)
        .join('\n');
      expect(logged).not.toContain('739104');
      expect(logged).not.toContain('SECRETBODYMARKER');
    });
  });
});
