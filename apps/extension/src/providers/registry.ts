import type { ProviderAdapter } from '../lib/types';

/**
 * Finds the matching provider adapter for the current hostname.
 * Domain matching: checks if hostname ends with any registered domain.
 *
 * Adding a new provider = creating a new ProviderAdapter and adding it to the registry below.
 * No other code changes required.
 */
export function getProviderForHost(hostname: string): ProviderAdapter | null {
  for (const adapter of PROVIDER_REGISTRY) {
    for (const domain of adapter.domains) {
      if (hostname === domain || hostname.endsWith(`.${domain}`)) {
        return adapter;
      }
    }
  }
  return null;
}

// ─── Provider Implementations ────────────────────────────────────────────────

const GoDaddyProvider: ProviderAdapter = {
  name: 'GoDaddy',
  domains: ['godaddy.com', 'sso.godaddy.com'],
  getCredentialFields() {
    // GoDaddy SSO login page
    const username = document.querySelector('#username, input[name="username"], input[type="email"]');
    const password = document.querySelector('#password, input[name="password"], input[type="password"]');
    if (!username || !password) return null;
    return {
      usernameSelector: '#username, input[name="username"], input[type="email"]',
      passwordSelector: '#password, input[name="password"], input[type="password"]',
      submitSelector: 'button#submitBtn, button[type="submit"], input[type="submit"]',
    };
  },
};

const HostingerProvider: ProviderAdapter = {
  name: 'Hostinger',
  domains: ['hostinger.com', 'hpanel.hostinger.com'],
  getCredentialFields() {
    const username = document.querySelector('input[name="email"], input[type="email"]');
    const password = document.querySelector('input[name="password"], input[type="password"]');
    if (!username || !password) return null;
    return {
      usernameSelector: 'input[name="email"], input[type="email"]',
      passwordSelector: 'input[name="password"], input[type="password"]',
      submitSelector: 'button[type="submit"]',
    };
  },
};

const CPanelProvider: ProviderAdapter = {
  name: 'cPanel',
  domains: ['cpanel.net', 'cpanelhosting.net'],
  getCredentialFields() {
    // cPanel uses :2083 port typically; login form
    const username = document.querySelector('#login_form input[name="user"], input#username, input[name="username"]');
    const password = document.querySelector('#login_form input[name="pass"], input#password, input[name="password"]');
    if (!username || !password) return null;
    return {
      usernameSelector: '#login_form input[name="user"], input#username',
      passwordSelector: '#login_form input[name="pass"], input#password',
      submitSelector: '#login_btn, input[type="submit"]',
    };
  },
};

const SiteGroundProvider: ProviderAdapter = {
  name: 'SiteGround',
  domains: ['siteground.com', 'my.siteground.com'],
  getCredentialFields() {
    const username = document.querySelector('input[name="email"], input[type="email"]');
    const password = document.querySelector('input[name="password"], input[type="password"]');
    if (!username || !password) return null;
    return {
      usernameSelector: 'input[name="email"], input[type="email"]',
      passwordSelector: 'input[name="password"], input[type="password"]',
      submitSelector: 'button[type="submit"]',
    };
  },
};

const GitHubProvider: ProviderAdapter = {
  name: 'GitHub',
  domains: ['github.com'],
  getCredentialFields() {
    const username = document.querySelector('input[name="login"], input#login_field');
    const password = document.querySelector('input[name="password"], input#password');
    if (!username || !password) return null;
    return {
      usernameSelector: 'input[name="login"], input#login_field',
      passwordSelector: 'input[name="password"], input#password',
      submitSelector: 'input[name="commit"], input[type="submit"], button[type="submit"]',
    };
  },
};

const VercelProvider: ProviderAdapter = {
  name: 'Vercel',
  domains: ['vercel.com'],
  getCredentialFields() {
    const username = document.querySelector('input[type="email"], input[name="email"]');
    if (!username) return null;
    return {
      usernameSelector: 'input[type="email"], input[name="email"]',
      passwordSelector: 'input[type="password"], input[name="password"]',
      submitSelector: 'button[type="submit"]',
    };
  },
};

// ─── Registry ────────────────────────────────────────────────────────────────
// Add new providers here. No other files need to change.

export const PROVIDER_REGISTRY: ProviderAdapter[] = [
  GoDaddyProvider,
  HostingerProvider,
  CPanelProvider,
  SiteGroundProvider,
  GitHubProvider,
  VercelProvider,
];
