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

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Phase 2 Migrations Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

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
  hideElementsCSS: [
    'button[aria-label="Show password" i]',
    'button[aria-label="Hide password" i]',
    '#password',
    'div:has(> input#password)'
  ],
  principalType: 'EMAIL',
  supportsDelegation: true,
});

/**
 * LinkedIn Ã¢â‚¬â€ Deferred (known issue)
 *
 * Password autofill works. Email field exhibits platform-specific React
 * controlled-input DOM behaviour that causes the value to be cleared on blur.
 * Deferred indefinitely Ã¢â‚¬â€ not blocking the client's primary objectives.
 */
platformRegistry.register({
  id: 'LINKEDIN',
  name: 'LinkedIn',
  domains: ['linkedin.com', 'www.linkedin.com'],
  login: {
    url: 'https://www.linkedin.com/checkpoint/lg/login?trk=hb_signin',
    usernameSelector: 'input[name="session_key"], #session_key, input[autocomplete="username"], input[autocomplete="email"], input[type="email"], #username',
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
  },
  hideElementsCSS: [
    'button.js-password-button',
    'button[aria-controls="account_password"]',
    '#account_password',
    '.password-wrapper:has(#account_password)'
  ]
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
  hideElementsCSS: [
    'input[data-testid="login-password-input"]',
    '#old-password',
    'div:has(> input[data-testid="login-password-input"])',
    'div:has(> input#old-password)'
  ],
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
  hideElementsCSS: [
    'button[aria-label="Show password" i]',
    'button[data-blade-component="icon-button"] svg'
  ],
  otp: {
    type: 'EMAIL',
    inputSelector: 'input[name="otp"], input[autocomplete="one-time-code"], input[inputmode="numeric"][maxlength="1"], input[type="number"][maxlength="1"]',
    // Specific selectors first. button[type="submit"] is the safe fallback since
    // after all 6 digits are filled, the only submit-type button on this page is Verify.
    // We deliberately removed button:not([disabled]) as it matched Resend/Back first.
    submitSelector: 'button[data-testid="btn-verify"], button[data-testid="verify-btn"], button[type="submit"]',
  }
});

platformRegistry.register({
  id: 'LINKEDIN',
  name: 'LinkedIn',
  domains: ['linkedin.com'],
  login: {
    url: 'https://www.linkedin.com/login',
    usernameSelector: 'input[name="session_key"], input#username, input[type="text"], input[type="email"]',
    passwordSelector: 'input[name="session_password"], input#password, input[type="password"]',
    submitSelector: 'button[type="submit"], input[type="submit"], button[data-litms-control-urn="login-submit"]',
  },
  hideElementsCSS: [
    'input[type="password"][autocomplete="current-password"]',
    'button[aria-label="Show password" i]',
    'button:has(svg#visibility-small)',
    'div:has(> input[type="password"][autocomplete="current-password"])'
  ]
});

// ─── Phase 3: Government Portals ──────────────────────────────────────────────────────────────
//
// Architecture Preservation Directive:
//   These portals require CAPTCHA and/or SMS OTP which cannot be automated
//   without external infrastructure the client has not requested.
//
//   Strategy: fill username + password ➔ pause ➔ toast ➔ user completes manually.
//   This is implemented via the generic `manualStepMessage` field.
//   No platform-specific logic. No captchaSelector. No new framework code.

/**
 * MCA Portal (Ministry of Corporate Affairs) Ã¢â‚¬â€ Partial Support
 *
 * Authentication flow:
 *   User ID Ã¢â€ â€™ Password Ã¢â€ â€™ CAPTCHA (manual) Ã¢â€ â€™ OTP (manual)
 *
 * What we automate:
 *   Ã¢Å“â€¦ Fill User ID (CIN/LLPIN/FCRN for companies, or email for individuals)
 *   Ã¢Å“â€¦ Fill password
 *   Ã¢ÂÂ¸  Pause Ã¢â‚¬â€ toast asks user to complete CAPTCHA
 *   Ã¢Å“â€¹  User solves CAPTCHA and submits manually
 *
 * CAPTCHA: alphanumeric image CAPTCHA Ã¢â‚¬â€ intentionally not automated.
 * OTP: sent to registered mobile Ã¢â‚¬â€ outside Gmail OTP pipeline.
 *
 * Selector notes (confirmed from portal DOM at foportal/fologin.html):
 *   User ID field is input[type="text"], NOT input[type="email"]
 *   Password field is input[type="password"]
 */
platformRegistry.register({
  id: 'MCA',
  name: 'MCA Portal',
  domains: ['www.mca.gov.in', 'mca.gov.in', 'localhost', '127.0.0.1'],
  login: {
    url: 'https://www.mca.gov.in/content/mca/global/en/foportal/fologin.html',
    // User ID: accepts CIN/LLPIN/FCRN for companies or email for other users.
    // NOTE: input[type="text"] or form-based fallbacks are BANNED here.
    // The MCA header contains a search bar form that appears before the login
    // form in the DOM, so generic fallbacks will match the search bar.
    usernameSelector: [
      'input[name="userID" i]',    // exact match from DOM (case-insensitive)
      'input[name="userId" i]',
      'input[name="loginid" i]',
      '.userID input',             // wrapper class from DOM
      '.user-id-input input',      // wrapper class from DOM
    ].join(', '),
    passwordSelector: [
      'input[type="password"]',
      'input[name="password"]',
      'input[id="password"]',
    ].join(', '),
    // No submitSelector — manualStepMessage prevents auto-submit
  },
  manualStepMessage: 'Credentials filled. Please complete the CAPTCHA to continue.',
  capabilityRestrictions: {
    'mca.master_data': { hideElementsCSS: ['li.level-2:has(> a[href$="/mca/master-data.html"])'] },
    'mca.llp_efiling': { hideElementsCSS: ['li.level-2:has(> a[href$="/mca/llp-e-filling.html"])'] },
    'mca.fo_services': { hideElementsCSS: ['li.level-2:has(> a[href$="/mca/fo-llp-services.html"])'] },
    'mca.dsc_services': { hideElementsCSS: ['li.level-2:has(> a[href$="/mca/dsc-services-v3.html"])'] },
    'mca.company_efiling': { hideElementsCSS: ['li.level-2:has(> a[href$="/mca/e-filing.html"])'] },
    'mca.complaints': { hideElementsCSS: ['li.level-2:has(> a[href$="/mca/complaints.html"])'] },
    'mca.document_related_services': { hideElementsCSS: ['li.level-2:has(> a[href$="/mca/document-related-services.html"])'] },
    'mca.payment_services': { hideElementsCSS: ['li.level-2:has(> a[href$="/mca/fee-and-payment-services.html"])'] },
    'mca.id_databank': { hideElementsCSS: ['li.level-2:has(> a[href$="/mca/id-databank-services.html"])'] },
  },
});

/**
 * GST Portal — Partial Support
 *
 * Authentication flow:
 *   Username (GSTIN) Ã¢â€ â€™ Password Ã¢â€ â€™ CAPTCHA (manual) Ã¢â€ â€™ 2FA OTP (manual, mobile)
 *
 * What we automate:
 *   Ã¢Å“â€¦ Fill username (GSTIN or registered user ID)
 *   Ã¢Å“â€¦ Fill password
 *   Ã¢ÂÂ¸  Pause Ã¢â‚¬â€ toast asks user to complete CAPTCHA + OTP
 *   Ã¢Å“â€¹  User solves CAPTCHA and enters OTP manually
 *
 * CAPTCHA: alphanumeric visual CAPTCHA Ã¢â‚¬â€ intentionally not automated.
 * 2FA OTP: mandatory since April 2023, sent to mobile Ã¢â‚¬â€ outside Gmail pipeline.
 *
 * Selector notes (confirmed from portal DOM at services.gst.gov.in/services/login):
 *   Username: <input name="user_name" id="user_name" type="text">
 *   Password: <input name="user_pass" id="user_pass" type="password">
 *   CAPTCHA:  another input[type="text"] Ã¢â‚¬â€ must NOT match username selector
 *   Ã¢â€ â€™ input[type="text"] intentionally excluded from usernameSelector
 */
platformRegistry.register({
  id: 'GST',
  name: 'GST Portal',
  domains: ['gst.gov.in', 'services.gst.gov.in'],
  login: {
    url: 'https://services.gst.gov.in/services/login',
    // Specific name/id selectors only Ã¢â‚¬â€ intentionally exclude input[type="text"]
    // to prevent matching the CAPTCHA field which is also type=text on this page.
    usernameSelector: [
      '#user_name',
      'input[name="user_name"]',
      'input[id="user_name"]',
      'input[name="username"]',
      'input[id="username"]',
    ].join(', '),
    passwordSelector: [
      '#user_pass',                // Exact ID match based on DOM snippet
      'input[name="user_pass"]',   // GST-specific: confirmed from portal DOM
      'input[id="user_pass"]',
      'input[type="password"]',    // standard fallback
      'input[name="password"]',
    ].join(', '),
    // No submitSelector Ã¢â‚¬â€ manualStepMessage prevents auto-submit
  },
  manualStepMessage: 'Credentials filled. Please complete the CAPTCHA and OTP verification to continue.',
});

/**
 * Udyam Portal Ã¢â‚¬â€ Partial Support
 *
 * Authentication flow:
 *   Udyam Registration Number Ã¢â€ â€™ Mobile Number Ã¢â€ â€™ "Validate & Generate OTP" Ã¢â€ â€™ SMS OTP Ã¢â€ â€™ Login
 *
 * This is NOT a username + password flow. It is OTP-based with no password field.
 *
 * What we automate:
 *   Ã¢Å“â€¦ Fill Udyam Registration Number (19-digit, e.g. UDYAM-MH-10-0000001)
 *   Ã¢ÂÂ¸  Pause Ã¢â‚¬â€ toast instructs user to fill mobile number and request OTP
 *   Ã¢Å“â€¹  User enters mobile number, clicks "Validate & Generate OTP", enters SMS OTP
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

/**
 * Google Ads — Partial Support
 *
 * Authentication flow:
 *   Google accounts use a two-step flow (email -> password) and often enforce passkeys,
 *   risk engine prompts, and account choosers.
 *
 * What we automate:
 *   ✅ Fill email field on the initial login screen.
 *   ⏸  Pause — instruct user to complete remaining steps (password/passkey/etc) manually.
 */
platformRegistry.register({
  id: 'GOOGLE_ADS',
  name: 'Google Ads',
  domains: ['ads.google.com', 'accounts.google.com'],
  login: {
    url: 'https://ads.google.com/',
    usernameSelector: 'input[type="email"], input[name="identifier"], input#identifierId',
    // Deliberately omitting passwordSelector to respect the frozen architecture
    // and prevent breaking on Google's two-step flow and passkey mandates.
  },
  manualStepMessage: 'Email filled. Google requires manual sign-in due to passkey / 2FA / account chooser. Click "Next" and continue manually.',
});
