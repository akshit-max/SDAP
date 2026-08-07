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
    inputSelector: 'input[autocomplete="one-time-code"], input[inputmode="numeric"], input[type="number"], input[name="code"], input[type="text"][maxlength="1"]',
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
    // LinkedIn moved its login page to /flagship-web/login/ (new SPA).
    // The old /login still works too — both are on www.linkedin.com which is in domains[].
    url: 'https://www.linkedin.com/flagship-web/login/',
    // LinkedIn's email/phone field selectors covering both old /login and new /flagship-web/login:
    // - name="session_key" / #session_key: classic login page
    // - autocomplete="username" or autocomplete="email": both values seen across versions
    // - input[type="text"]: last-resort broad match (SPA may not have name/id attrs)
    usernameSelector: 'input[name="session_key"], #session_key, input[autocomplete="username"], input[autocomplete="email"], input[type="email"], #username, input[type="text"]',
    passwordSelector: 'input[name="session_password"], #session_password, input[autocomplete="current-password"], input[type="password"], #password',
    // The Sign in button on LinkedIn's form
    submitSelector: 'button[type="submit"], button[aria-label="Sign in"], .login__form_action_container button',
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
  // Only accounts.razorpay.com is the login/auth subdomain.
  // dashboard.razorpay.com is the post-login dashboard — removing it prevents
  // the extension from showing the "Logging you in..." toast on the dashboard page.
  domains: ['accounts.razorpay.com'],
  login: {
    url: 'https://accounts.razorpay.com/auth',
    usernameSelector: 'input[type="email"], input[type="text"], input[type="tel"], input[autocomplete="username"], input[autocomplete="email"]',
    passwordSelector: 'input[type="password"], input[autocomplete="current-password"], input[placeholder*="password" i]',
    // Target the Continue / Login button specifically
    submitSelector: 'button[type="submit"], button#btn-login, #btn-login, button.btn-primary, button[data-testid="btn-submit"]',
  },
  otp: {
    type: 'EMAIL',
    // Razorpay OTP screen: 6 individual single-digit input boxes
    inputSelector: 'input[name="otp"], input[autocomplete="one-time-code"], input[inputmode="numeric"][maxlength="1"], input[type="number"][maxlength="1"]',
    // The Verify button that submits the OTP form
    submitSelector: 'button[type="submit"], button.btn-primary, button[data-testid="btn-verify"], button:not([disabled])',
  }
});

// ─── Phase 3: Government Portals ─────────────────────────────────────────────
//
// Architecture Preservation Directive:
//   These portals require CAPTCHA and/or SMS OTP which cannot be automated
//   without external infrastructure the client has not requested.
//
//   Strategy: fill username + password → pause → toast → user completes manually.
//   This is implemented via the generic `manualStepMessage` field.
//   No platform-specific logic. No captchaSelector. No new framework code.

/**
 * MCA Portal (Ministry of Corporate Affairs) — Partial Support
 *
 * Authentication flow:
 *   Username → Password → CAPTCHA (manual) → OTP (manual)
 *
 * What we automate:
 *   ✅ Fill username (email or User ID)
 *   ✅ Fill password
 *   ⏸  Pause — toast asks user to complete CAPTCHA
 *   ✋  User solves CAPTCHA and submits manually
 *
 * CAPTCHA: alphanumeric image CAPTCHA — intentionally not automated.
 * OTP: sent to registered mobile — outside Gmail OTP pipeline.
 */
platformRegistry.register({
  id: 'MCA',
  name: 'MCA Portal',
  domains: ['www.mca.gov.in', 'mca.gov.in'],
  login: {
    url: 'https://www.mca.gov.in/content/mca/global/en/mca/master-data/MDS.html',
    // MCA V3 uses standard email/username + password inputs before the CAPTCHA section
    usernameSelector: [
      'input[name="userId"]',
      'input[id="userId"]',
      'input[type="email"]',
      'input[name="username"]',
      'input[id="username"]',
      'input[name="loginid"]',
      'input[id="loginid"]',
    ].join(', '),
    passwordSelector: [
      'input[type="password"]',
      'input[name="password"]',
      'input[id="password"]',
    ].join(', '),
    // No submitSelector — manualStepMessage prevents auto-submit
  },
  // Generic pause message. User completes CAPTCHA then submits manually.
  manualStepMessage: 'Credentials filled. Please complete the CAPTCHA to continue.',
});

/**
 * GST Portal — Partial Support
 *
 * Authentication flow:
 *   Username (GSTIN) → Password → CAPTCHA (manual) → 2FA OTP (manual, mobile)
 *
 * What we automate:
 *   ✅ Fill username (GSTIN or registered user ID)
 *   ✅ Fill password
 *   ⏸  Pause — toast asks user to complete CAPTCHA + OTP
 *   ✋  User solves CAPTCHA and enters OTP manually
 *
 * CAPTCHA: alphanumeric visual CAPTCHA — intentionally not automated.
 * 2FA OTP: mandatory since April 2023, sent to mobile — outside Gmail pipeline.
 */
platformRegistry.register({
  id: 'GST',
  name: 'GST Portal',
  domains: ['gst.gov.in', 'services.gst.gov.in'],
  login: {
    url: 'https://services.gst.gov.in/services/login',
    // GST portal uses standard form inputs for username and password
    usernameSelector: [
      'input[name="user_name"]',
      'input[id="user_name"]',
      'input[name="username"]',
      'input[id="username"]',
      'input[type="text"]',
    ].join(', '),
    passwordSelector: [
      'input[type="password"]',
      'input[name="user_pass"]',
      'input[id="user_pass"]',
      'input[name="password"]',
    ].join(', '),
    // No submitSelector — manualStepMessage prevents auto-submit
  },
  // Generic pause message. User completes CAPTCHA + 2FA OTP then submits manually.
  manualStepMessage: 'Credentials filled. Please complete the CAPTCHA and OTP verification to continue.',
});

