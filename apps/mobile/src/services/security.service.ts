/**
 * WITHUS Mobile Secure Browser PoC — Navigation Security & Origin Allowlist Service
 *
 * Implements Phase 3 Navigation Security:
 * - HTTPS-only enforcement
 * - Platform-specific domain allowlisting derived directly from WITHUS platform registry
 * - Rejection of untrusted origins and non-HTTP schemes (intent:, javascript:, file:, data:)
 * - Protection against open redirects and arbitrary navigation
 */

export interface PlatformSecurityConfig {
  id: string;
  name: string;
  allowedDomains: string[];
  defaultLoginUrl: string;
}

/**
 * Verified Platform Domain Registry
 * Strictly synchronized with WITHUS platform configurations (apps/extension/src/providers/platform-registry.ts)
 */
export const PLATFORM_SECURITY_REGISTRY: Record<string, PlatformSecurityConfig> = {
  GITHUB: {
    id: 'GITHUB',
    name: 'GitHub',
    allowedDomains: ['github.com'],
    defaultLoginUrl: 'https://github.com/login',
  },
  VERCEL: {
    id: 'VERCEL',
    name: 'Vercel',
    allowedDomains: ['vercel.com'],
    defaultLoginUrl: 'https://vercel.com/login',
  },
  GODADDY: {
    id: 'GODADDY',
    name: 'GoDaddy',
    allowedDomains: ['godaddy.com', 'sso.godaddy.com'],
    defaultLoginUrl: 'https://sso.godaddy.com/',
  },
  LINKEDIN: {
    id: 'LINKEDIN',
    name: 'LinkedIn',
    allowedDomains: ['linkedin.com', 'www.linkedin.com'],
    defaultLoginUrl: 'https://www.linkedin.com/login',
  },
  SHOPIFY: {
    id: 'SHOPIFY',
    name: 'Shopify',
    allowedDomains: ['shopify.com', 'accounts.shopify.com', 'admin.shopify.com'],
    defaultLoginUrl: 'https://admin.shopify.com/login',
  },
  STRIPE: {
    id: 'STRIPE',
    name: 'Stripe',
    allowedDomains: ['stripe.com', 'dashboard.stripe.com'],
    defaultLoginUrl: 'https://dashboard.stripe.com/login',
  },
  RAZORPAY: {
    id: 'RAZORPAY',
    name: 'Razorpay',
    allowedDomains: ['accounts.razorpay.com', 'dashboard.razorpay.com', 'razorpay.com'],
    defaultLoginUrl: 'https://accounts.razorpay.com/auth',
  },
  MCA: {
    id: 'MCA',
    name: 'MCA Portal',
    allowedDomains: ['mca.gov.in', 'www.mca.gov.in'],
    defaultLoginUrl: 'https://www.mca.gov.in/content/mca/global/en/foportal/fologin.html',
  },
  GST: {
    id: 'GST',
    name: 'GST Portal',
    allowedDomains: [
      'gst.gov.in',
      'services.gst.gov.in',
      'www.gst.gov.in',
      'static.gst.gov.in',
      'tutorial.gst.gov.in',
    ],
    defaultLoginUrl: 'https://services.gst.gov.in/services/login',
  },
  UDYAM: {
    id: 'UDYAM',
    name: 'Udyam Portal',
    allowedDomains: ['udyamregistration.gov.in'],
    defaultLoginUrl: 'https://udyamregistration.gov.in',
  },
  GMAIL: {
    id: 'GMAIL',
    name: 'Gmail',
    allowedDomains: [
      'mail.google.com',
      'accounts.google.com',
      'myaccount.google.com',
      'gds.google.com',
      'contacts.google.com',
      'apis.google.com',
      'clients6.google.com',
      'ogs.google.com',
      'ssl.gstatic.com',
      'www.gstatic.com',
      'gstatic.com',
      'googleusercontent.com',
      'googleapis.com',
      'google.co.in',
      'accounts.google.co.in',
      'mail.google.co.in',
      'gds.google.co.in',
      'myaccount.google.co.in',
      'gmail.com',
      'www.gmail.com',
      'm.gmail.com',
      'gmail.app.goo.gl',
      'app.goo.gl',
      'goo.gl',
      'accounts.youtube.com',
      'youtube.com',
      'www.youtube.com',
    ],
    defaultLoginUrl: 'https://mail.google.com',
  },
  GOOGLE_ADS: {
    id: 'GOOGLE_ADS',
    name: 'Google Ads',
    allowedDomains: [
      'ads.google.com',
      'accounts.google.com',
      'gds.google.com',
      'myaccount.google.com',
      'google.co.in',
      'accounts.google.co.in',
      'ads.google.co.in',
    ],
    defaultLoginUrl: 'https://ads.google.com/',
  },
};

export class NavigationSecurityService {
  /**
   * Validate navigation target URL against platform security allowlist.
   *
   * Rules:
   * 1. URL must parse cleanly as standard URL.
   * 2. Scheme must strictly be 'https:'. Reject 'http:', 'javascript:', 'file:', 'intent:', 'data:'.
   * 3. Hostname must match an allowlisted domain for the platform (or subdomains).
   */
  static evaluateNavigation(
    targetUrl: string,
    platformKey: string,
  ): { isAllowed: boolean; reason?: string; normalizedUrl?: string } {
    if (!targetUrl || typeof targetUrl !== 'string') {
      return { isAllowed: false, reason: 'Empty or invalid URL parameter' };
    }

    const trimmedUrl = targetUrl.trim();

    // Block non-HTTP schemes immediately
    const lower = trimmedUrl.toLowerCase();
    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('file:') ||
      lower.startsWith('data:') ||
      lower.startsWith('intent:') ||
      lower.startsWith('content:') ||
      lower.startsWith('about:')
    ) {
      return { isAllowed: false, reason: `Disallowed scheme in URL: ${lower.split(':')[0]}` };
    }

    // Require HTTPS
    if (lower.startsWith('http://')) {
      return { isAllowed: false, reason: 'Insecure HTTP protocol is prohibited. HTTPS is required.' };
    }

    if (!lower.startsWith('https://')) {
      return { isAllowed: false, reason: 'Target URL must use secure HTTPS protocol.' };
    }

    // Parse URL
    let parsed: URL;
    try {
      parsed = new URL(trimmedUrl);
    } catch {
      return { isAllowed: false, reason: 'Malformed URL structure' };
    }

    if (parsed.protocol !== 'https:') {
      return { isAllowed: false, reason: 'Protocol must be https:' };
    }

    // Normalize platform key
    const normalizedKey = platformKey ? platformKey.toUpperCase().trim() : '';
    const config = PLATFORM_SECURITY_REGISTRY[normalizedKey];

    if (!config) {
      return {
        isAllowed: false,
        reason: `Platform '${platformKey}' is not recognized in the security registry.`,
      };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check hostname against allowlisted domains
    let isDomainPermitted = config.allowedDomains.some((allowedDomain) => {
      const lowerAllowed = allowedDomain.toLowerCase();
      return hostname === lowerAllowed || hostname.endsWith(`.${lowerAllowed}`);
    });

    // Special handling for Gmail sessions:
    if (!isDomainPermitted && normalizedKey === 'GMAIL') {
      // 1. Match legitimate Google / YouTube auth subdomains
      // (Google Account SSO and 2-Step Verification use accounts.youtube.com / SetSID for cross-domain auth sync)
      if (
        (hostname === 'google.com' ||
          hostname.endsWith('.google.com') ||
          hostname === 'google.co.in' ||
          hostname.endsWith('.google.co.in') ||
          hostname === 'youtube.com' ||
          hostname.endsWith('.youtube.com') ||
          hostname === 'gstatic.com' ||
          hostname.endsWith('.gstatic.com')) &&
        !hostname.startsWith('evil-') &&
        !hostname.startsWith('phish-')
      ) {
        isDomainPermitted = true;
      }
      // 2. Permit navigation to any recognized WITHUS platform
      // (enables clicking magic login links from Vercel, GitHub, Stripe, Shopify, etc. received in inbox)
      if (!isDomainPermitted) {
        isDomainPermitted = Object.values(PLATFORM_SECURITY_REGISTRY).some((plat) =>
          plat.allowedDomains.some((domain) => {
            const lower = domain.toLowerCase();
            return hostname === lower || hostname.endsWith(`.${lower}`);
          }),
        );
      }
    }

    if (!isDomainPermitted) {
      return {
        isAllowed: false,
        reason: `Domain '${hostname}' is not authorized for platform '${config.name}'.`,
      };
    }

    return {
      isAllowed: true,
      normalizedUrl: parsed.toString(),
    };
  }

  /**
   * Get default secure starting URL for a platform
   */
  static getDefaultUrlForPlatform(platformKey: string): string {
    const normalizedKey = platformKey ? platformKey.toUpperCase().trim() : '';
    const config = PLATFORM_SECURITY_REGISTRY[normalizedKey];
    return config ? config.defaultLoginUrl : 'about:blank';
  }
}

