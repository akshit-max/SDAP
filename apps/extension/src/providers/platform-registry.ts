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
