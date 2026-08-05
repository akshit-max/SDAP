/**
 * OTP Pattern Registry
 *
 * Each pattern targets a specific platform or sender domain.
 * Patterns are evaluated in order:
 *   1. Platform-specific (matched by DelegatedSession.integrationProvider)
 *   2. Sender-domain-matched
 *   3. Generic fallback (first standalone 4–8 digit number near a keyword)
 *
 * OAuth Boundary Rule: This file is only imported by gmail-otp.service.ts.
 * No other module may import or use OTP patterns.
 */

export interface OtpPattern {
  /** Matches DelegatedSession.integrationProvider (optional) */
  platform?: string;
  /** Matches against the sender address (optional) */
  senderDomains?: string[];
  /** Regex with a capture group containing the OTP */
  regex: RegExp;
  /** Index of the capture group holding the OTP code */
  group: number;
}

/**
 * Ordered from most-specific to most-generic.
 * The first match wins.
 */
export const OTP_PATTERNS: OtpPattern[] = [
  // ─── Platform-specific patterns ──────────────────────────────────────────────

  {
    platform: 'GITHUB',
    senderDomains: ['github.com', 'noreply.github.com'],
    // GitHub: "Your one-time password is: 123456"
    regex: /(?:one.time\s+password\s+is[:：]\s*|authentication code[:：]\s*)(\d{6})/i,
    group: 1,
  },
  {
    platform: 'STRIPE',
    senderDomains: ['stripe.com'],
    // Stripe: "Your Stripe verification code is 123456"
    regex: /(?:verification\s+code\s+is\s+)(\d{6})/i,
    group: 1,
  },
  {
    platform: 'SHOPIFY',
    senderDomains: ['shopify.com', 'mail.shopify.com'],
    // Shopify: "Your verification code is 123456" or "Enter: 123456"
    regex: /(?:verification\s+code\s+is\s+|Enter:\s*)(\d{6})/i,
    group: 1,
  },
  {
    platform: 'LINKEDIN',
    senderDomains: ['linkedin.com', 'e.linkedin.com'],
    // LinkedIn: "Use this code: 123456"
    regex: /(?:Use this code[:：]\s*)(\d{6})/i,
    group: 1,
  },
  {
    platform: 'RAZORPAY',
    senderDomains: ['razorpay.com'],
    // Razorpay: "OTP for login is 123456"
    regex: /(?:OTP\s+(?:for\s+login\s+)?is\s+)(\d{4,6})/i,
    group: 1,
  },

  // ─── Sender-domain-matched generic patterns ───────────────────────────────

  {
    senderDomains: ['google.com', 'accounts.google.com'],
    regex: /(?:verification\s+code[:：]\s*|code[:：]\s*)(\d{6})/i,
    group: 1,
  },

  // ─── Generic fallback: first 4–8 digit code near a keyword ───────────────

  {
    // Matches patterns like:
    //   "Your code is 123456"
    //   "OTP: 654321"
    //   "Enter the code 9876 to"
    //   "verification code — 123456"
    regex: /(?:code|otp|passcode|token|verify|verification)[\s\S]{0,80}?(\b\d{4,8}\b)/i,
    group: 1,
  },
];
