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
 * LinkedIn — Deferred (known issue)
 *
 * Password autofill works. Email field exhibits platform-specific React
 * controlled-input DOM behaviour that causes the value to be cleared on blur.
 * Deferred indefinitely — not blocking the client's primary objectives.
 */
platformRegistry.register({
  id: 'LINKEDIN',
  name: 'LinkedIn',
  domains: ['linkedin.com', 'www.linkedin.com'],
  login: {
    url: 'https://www.linkedin.com/flagship-web/login/',
    usernameSelector: 'input[name="session_key"], #session_key, input[autocomplete="username"], input[autocomplete="email"], input[type="email"], #username, input[type="text"]',
    passwordSelector: 'input[name="session_password"], #session_password, input[autocomplete="current-password"], input[type="password"], #password',
    submitSelector: 'button[type="submit"], button[aria-label="Sign in"], .login__form_action_container button',
  }
});

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
  otp: {
    type: 'EMAIL',
    inputSelector: 'input[name="otp"], input[autocomplete="one-time-code"], input[name="verification_code"]',
    submitSelector: 'button[type="submit"]',
  },
});

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
    submitSelector: 'button[type="submit"], button#btn-login, #btn-login, button.btn-primary, button[data-testid="btn-submit"]',
  },
  otp: {
    type: 'EMAIL',
    inputSelector: 'input[name="otp"], input[autocomplete="one-time-code"], input[inputmode="numeric"][maxlength="1"], input[type="number"][maxlength="1"]',
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
 *   User ID → Password → CAPTCHA (manual) → OTP (manual)
 *
 * What we automate:
 *   ✅ Fill User ID (CIN/LLPIN/FCRN for companies, or email for individuals)
 *   ✅ Fill password
 *   ⏸  Pause — toast asks user to complete CAPTCHA
 *   ✋  User solves CAPTCHA and submits manually
 *
 * CAPTCHA: alphanumeric image CAPTCHA — intentionally not automated.
 * OTP: sent to registered mobile — outside Gmail OTP pipeline.
 *
 * Selector notes (confirmed from portal DOM at foportal/fologin.html):
 *   User ID field is input[type="text"], NOT input[type="email"]
 *   Password field is input[type="password"]
 */
platformRegistry.register({
  id: 'MCA',
  name: 'MCA Portal',
  domains: ['www.mca.gov.in', 'mca.gov.in'],
  login: {
    url: 'https://www.mca.gov.in/content/mca/global/en/foportal/fologin.html',
    // User ID: accepts CIN/LLPIN/FCRN for companies or email for other users.
    // Confirmed type=text (not type=email) from actual portal DOM.
    // Order: specific name/id first, broad type=text fallback last.
    usernameSelector: [
      'input[name="userId"]',
      'input[id="userId"]',
      'input[name="username"]',
      'input[id="username"]',
      'input[name="loginid"]',
      'input[id="loginid"]',
      'input[name="userid"]',
      'input[type="text"]',    // confirmed: MCA User ID is type=text
    ].join(', '),
    passwordSelector: [
      'input[type="password"]',
      'input[name="password"]',
      'input[id="password"]',
    ].join(', '),
    // No submitSelector — manualStepMessage prevents auto-submit
  },
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
 *
 * Selector notes (confirmed from portal DOM at services.gst.gov.in/services/login):
 *   Username: <input name="user_name" id="user_name" type="text">
 *   Password: <input name="user_pass" id="user_pass" type="password">
 *   CAPTCHA:  another input[type="text"] — must NOT match username selector
 *   → input[type="text"] intentionally excluded from usernameSelector
 */
platformRegistry.register({
  id: 'GST',
  name: 'GST Portal',
  domains: ['gst.gov.in', 'services.gst.gov.in'],
  login: {
    url: 'https://services.gst.gov.in/services/login',
    // Specific name/id selectors only — intentionally exclude input[type="text"]
    // to prevent matching the CAPTCHA field which is also type=text on this page.
    usernameSelector: [
      'input[name="user_name"]',
      'input[id="user_name"]',
      'input[name="username"]',
      'input[id="username"]',
    ].join(', '),
    passwordSelector: [
      'input[name="user_pass"]',   // GST-specific: confirmed from portal DOM
      'input[id="user_pass"]',
      'input[type="password"]',    // standard fallback
      'input[name="password"]',
    ].join(', '),
    // No submitSelector — manualStepMessage prevents auto-submit
  },
  manualStepMessage: 'Credentials filled. Please complete the CAPTCHA and OTP verification to continue.',
});

/**
 * Udyam Portal — Partial Support
 *
 * Authentication flow:
 *   Udyam Registration Number → Mobile Number → "Validate & Generate OTP" → SMS OTP → Login
 *
 * This is NOT a username + password flow. It is OTP-based with no password field.
 *
 * What we automate:
 *   ✅ Fill Udyam Registration Number (19-digit, e.g. UDYAM-MH-10-0000001)
 *   ⏸  Pause — toast instructs user to fill mobile number and request OTP
 *   ✋  User enters mobile number, clicks "Validate & Generate OTP", enters SMS OTP
 *
 * Why we don't fill the mobile number:
 *   - Architecture Preservation Directive: do not use passwordSelector for non-password fields
 *   - Mobile number is easy to type; Registration Number (19 chars) is the hard credential
 *   - SMS OTP infrastructure is outside our Gmail OTP pipeline
 *
 * Vault credential format:
 *   Store the Udyam Registration Number as the sole credential.
 *   Example: "UDYAM-MH-10-0000001"
 */
platformRegistry.register({
  id: 'UDYAM',
  name: 'Udyam Portal',
  domains: ['udyamregistration.gov.in'],
  login: {
    url: 'https://udyamregistration.gov.in',
    usernameSelector: [
      'input[name="udyam_no"]',
      'input[id="udyam_no"]',
      'input[name="Udyam_No"]',
      'input[name="udyamNo"]',
      'input[placeholder*="Udyam" i]',
      'input[placeholder*="Registration Number" i]',
      'input[maxlength="19"]',   // Registration numbers are exactly 19 chars
    ].join(', '),
    // No passwordSelector — mobile number is NOT represented here.
    // Architecture Preservation Directive: do not overload passwordSelector semantics.
  },
  manualStepMessage: 'Udyam Registration Number filled. Please enter your mobile number and click "Validate & Generate OTP" to receive your OTP.',
});
