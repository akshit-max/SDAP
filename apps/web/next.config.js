import { withSentryConfig } from '@sentry/nextjs';

/**
 * Content Security Policy for the WITHUS web application.
 *
 * Rules:
 * - script-src: self + nonces (handled by middleware) + Sentry CDN
 * - connect-src: self + API + Sentry + WebSocket for HMR in dev
 * - frame-ancestors: none (clickjacking prevention)
 * - upgrade-insecure-requests: enforced in production
 */
const isDev = process.env.NODE_ENV === 'development';

const CSP = [
  "default-src 'self'",
  // Scripts: self + inline needed for Next.js App Router hydration
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Styles: self + inline needed for Tailwind/CSS-in-JS
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts: Google Fonts
  "font-src 'self' https://fonts.gstatic.com",
  // Images: self + data URIs (for inline SVGs)
  "img-src 'self' data: blob:",
  // API + Sentry + WebSocket (dev HMR)
  isDev
    ? "connect-src 'self' http://localhost:4000 ws://localhost:3000 https://sentry.io https://*.sentry.io"
    : `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL.startsWith('http') ? process.env.NEXT_PUBLIC_API_URL : `https://${process.env.NEXT_PUBLIC_API_URL}`).origin : 'https://withus-yy5i.onrender.com'} https://sentry.io https://*.sentry.io`,
  // No iframes
  "frame-src 'none'",
  // No plugins
  "object-src 'none'",
  // Prevent base tag hijacking
  "base-uri 'self'",
  // Only allow form submissions to self
  "form-action 'self'",
  // Prevent embedding
  "frame-ancestors 'none'",
  // Upgrade insecure in production
  ...(isDev ? [] : ['upgrade-insecure-requests']),
]
  .filter(Boolean)
  .join('; ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: CSP,
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=()',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'off',
  },
  // HSTS — applied only in production (CDN/proxy should handle this, belt+suspenders)
  ...(isDev
    ? []
    : [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
      ]),
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  {
    key: 'Cross-Origin-Embedder-Policy',
    value: 'require-corp',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/ui', '@repo/types', '@repo/db', '@repo/config'],
  output: 'standalone',

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  // Disable powered-by header
  poweredByHeader: false,
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.NEXT_PUBLIC_SENTRY_DSN,
});
