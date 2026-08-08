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

  afterFill() {
    /**
     * GoDaddy Show/Hide Password — Capture-Phase Interception Guard
     *
     * After autofill, prevent the delegate from using GoDaddy's "Show password"
     * toggle to reveal the autofilled credential via the UI control.
     *
     * Mechanism: capture-phase event listeners at document level.
     * These fire BEFORE React 17/18's root-delegated event handlers receive the
     * event, so React state is never mutated and no re-render is triggered.
     * The password input type stays "password". The button stays visible but is
     * non-functional.
     *
     * Architecture compliance:
     *   - Only registry.ts is modified (this file).
     *   - autofill.ts, types.ts, platform-registry.ts are NOT touched.
     *   - No MutationObserver. No input.type override. No generic new capability.
     *   - Isolated entirely to GoDaddyProvider.afterFill().
     *
     * Fail-open: if GoDaddy renames the button's aria-label or structure, the
     * isShowPasswordButton() check silently returns false and the button works
     * normally — the delegate can reveal the password. This is correct: we never
     * accidentally lock out the user on a selector mismatch.
     *
     * Security note: this blocks the UI "Show" action only.
     * A technically capable delegate can still view the value via browser
     * DevTools (document.querySelector('#password').value). This is a UI-level
     * deterrent for casual disclosure, NOT a cryptographic security boundary.
     *
     * Self-cleanup: listeners are removed after 30 seconds — by which time
     * GoDaddy has either logged the user in or the session has timed out.
     */
    const isShowPasswordButton = (el: Element | null): boolean => {
      if (!el || el.tagName !== 'BUTTON') return false;
      if ((el as HTMLButtonElement).type !== 'button') return false;

      // The button must be inside a container that also holds the password input.
      // This guards against accidentally matching any other button on the page.
      const container = el.closest('div, span, label, fieldset');
      if (!container?.querySelector('input[type="password"], input[name="password"]')) return false;

      // Aria-label check — most stable, required for accessibility compliance.
      const label = (el.getAttribute('aria-label') ?? '').trim();
      if (/show|hide/i.test(label)) return true;

      // Text content check — fallback for buttons with visible "Show" / "Hide" text.
      const text = (el.textContent ?? '').trim();
      if (/^show$|^hide$/i.test(text)) return true;

      return false;
    };

    const blockClick = (e: Event): void => {
      if (isShowPasswordButton(e.target as Element)) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };

    const blockKeyboard = (e: KeyboardEvent): void => {
      // Buttons activate on Space and Enter — both fire a synthetic click,
      // but intercepting at keydown prevents the click from being synthesised.
      if ((e.key === ' ' || e.key === 'Enter') && isShowPasswordButton(document.activeElement)) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };

    // Register in the capture phase — fires before React's root-delegated handlers.
    document.addEventListener('click', blockClick, true);
    document.addEventListener('keydown', blockKeyboard, true);

    // Self-cleanup after 30 seconds. By this point the form has auto-submitted
    // and GoDaddy's login flow is complete. No permanent listeners left behind.
    setTimeout(() => {
      document.removeEventListener('click', blockClick, true);
      document.removeEventListener('keydown', blockKeyboard, true);
    }, 30_000);
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
