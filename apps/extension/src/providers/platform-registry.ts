import type { PlatformConfig } from '../lib/types';

/**
 * V2 Platform Registry
 * Manages all supported platforms declaratively.
 */
export class PlatformRegistry {
  private configs: Map<string, PlatformConfig> = new Map();

  register(config: PlatformConfig) {
    this.configs.set(config.id, config);
  }

  getForHost(hostname: string): PlatformConfig | null {
    for (const config of this.configs.values()) {
      for (const domain of config.domains) {
        if (hostname === domain || hostname.endsWith(`.${domain}`)) {
          return config;
        }
      }
    }
    return null;
  }

  getAll(): PlatformConfig[] {
    return Array.from(this.configs.values());
  }
}

export const platformRegistry = new PlatformRegistry();

// ─── Phase 2 Migrations ──────────────────────────────────────────────────────

platformRegistry.register({
  id: 'GITHUB',
  name: 'GitHub',
  domains: ['github.com'],
  login: {
    url: 'https://github.com/login',
    usernameSelector: 'input[name="login"], input#login_field',
    passwordSelector: 'input[name="password"], input#password',
    submitSelector: 'input[name="commit"], input[type="submit"], button[type="submit"]',
  },
  principalType: 'GITHUB_USERNAME',
  supportsDelegation: true,
});

platformRegistry.register({
  id: 'VERCEL',
  name: 'Vercel',
  domains: ['vercel.com'],
  login: {
    url: 'https://vercel.com/login',
    usernameSelector: 'input[type="email"], input[name="email"]',
    passwordSelector: 'input[type="password"], input[name="password"]',
    submitSelector: 'button[type="submit"]',
  },
  otp: {
    type: 'EMAIL',
    inputSelector: 'input[autocomplete="one-time-code"], input[inputmode="numeric"], input[type="number"]',
  },
  principalType: 'EMAIL',
  supportsDelegation: true,
});

platformRegistry.register({
  id: 'GODADDY',
  name: 'GoDaddy',
  domains: ['godaddy.com', 'sso.godaddy.com'],
  login: {
    url: 'https://sso.godaddy.com/',
    usernameSelector: '#username, input[name="username"], input[type="email"]',
    passwordSelector: '#password, input[name="password"], input[type="password"]',
    submitSelector: 'button#submitBtn, button[type="submit"], input[type="submit"]',
    requirePasswordOnDOM: true,
  },
  principalType: 'EMAIL',
  supportsDelegation: true,
});

/**
 * LinkedIn Verification:
 * 1. Fully supported via Vault Secret model? Yes.
 * 2. Requires only Email/Password/Submit? Yes.
 * 3. New runtime behavior? LinkedIn may prompt for OTP/2FA or CAPTCHA on anomalous logins.
 * 4. Stable selectors? Yes, relying on standard `autocomplete` and `type` attributes since classes are obfuscated.
 * 
 * Supported:
 * - Email / Phone
 * - Password
 * - Auto-submit (via generic selectors)
 * 
 * Deferred to Phase 6/7:
 * - Email/App OTP
 * - CAPTCHA challenges
 */
platformRegistry.register({
  id: 'LINKEDIN',
  name: 'LinkedIn',
  domains: ['linkedin.com', 'www.linkedin.com'],
  login: {
    url: 'https://www.linkedin.com/login',
    usernameSelector: 'input[name="session_key"], input[autocomplete="username"], input[type="email"], #username',
    passwordSelector: 'input[name="session_password"], input[autocomplete="current-password"], input[type="password"], #password',
    submitSelector: 'button[type="submit"], button[aria-label="Sign in"], .login__form_action_container button, form button',
  }
});

/**
 * Shopify Verification:
 * 1. Fully supported via Vault Secret model? Yes.
 * 2. Requires only Email/Password/Submit? The initial auth does, but it often requires Workspace selection.
 * 3. New runtime behavior? Yes, store/workspace picker after auth.
 * 4. Stable selectors? Yes, standard HTML5 attributes.
 * 
 * Supported:
 * - Email / Password auth
 * 
 * Deferred to Phase 6/7:
 * - Workspace / Store Selection (e.g. if user is part of multiple Shopify stores)
 * - Multi-step login variants (passkey/SSO)
 * - OTP (often sent to email)
 */
platformRegistry.register({
  id: 'SHOPIFY',
  name: 'Shopify',
  domains: ['shopify.com', 'accounts.shopify.com', 'admin.shopify.com'],
  login: {
    url: 'https://admin.shopify.com/login',
    usernameSelector: 'input[type="email"], input[autocomplete="username"], #account_email',
    passwordSelector: 'input[type="password"], input[autocomplete="current-password"], #account_password',
    submitSelector: 'button[type="submit"], button[name="commit"]',
  }
});

/**
 * Stripe Verification:
 * 1. Fully supported via Vault Secret model? Yes.
 * 2. Requires only Email/Password/Submit? The initial auth does. 
 * 3. New runtime behavior? Yes, Stripe heavily enforces MFA for all logins, and may prompt for Account Selection.
 * 4. Stable selectors? Yes, standard HTML5 attributes.
 * 
 * Supported:
 * - Email / Password auth
 * 
 * Deferred to Phase 6/7:
 * - App-based / SMS MFA (mandatory on Stripe)
 * - Account Selection picker
 */
platformRegistry.register({
  id: 'STRIPE',
  name: 'Stripe',
  domains: ['stripe.com', 'dashboard.stripe.com'],
  login: {
    url: 'https://dashboard.stripe.com/login',
    usernameSelector: 'input[type="email"], input[name="email"], input[autocomplete="username"]',
    passwordSelector: 'input[type="password"], input[name="password"], input[autocomplete="current-password"]',
    submitSelector: 'button[type="submit"], input[type="submit"], button[data-testid="login-button"]',
  },
  /**
   * OTP Config (Phase 7A)
   *
   * Supported: Email verification code (enforced on every login)
   *
   * Deferred to Phase 7B+:
   * - Authenticator app TOTP
   * - SMS OTP
   */
  otp: {
    type: 'EMAIL',
    inputSelector: 'input[name="otp"], input[autocomplete="one-time-code"], input[name="verification_code"]',
    submitSelector: 'button[type="submit"]',
  },
});

/**
 * Razorpay Verification:
 * 1. Fully supported via Vault Secret model? Yes.
 * 2. Requires only Email/Password/Submit? Yes.
 * 3. New runtime behavior? Razorpay uses OTP verification heavily and has merchant/organization switching.
 * 4. Stable selectors? Yes, standard HTML5 attributes.
 * 
 * Supported:
 * - Email / Password auth
 * 
 * Deferred to Phase 6/7:
 * - OTP Verification (Email/Phone)
 * - Merchant/Organization Selection
 */
platformRegistry.register({
  id: 'RAZORPAY',
  name: 'Razorpay',
  domains: ['razorpay.com', 'dashboard.razorpay.com'],
  login: {
    url: 'https://dashboard.razorpay.com/signin',
    usernameSelector: 'input[type="email"], input[type="text"], input[type="tel"], input[autocomplete="username"]',
    passwordSelector: 'input[type="password"], input[autocomplete="current-password"]',
    submitSelector: 'button[type="submit"]',
  },
  otp: {
    type: 'EMAIL',
    inputSelector: 'input[name="otp"], input[autocomplete="one-time-code"]',
  }
});
