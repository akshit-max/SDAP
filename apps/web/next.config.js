import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/types"],
  output: 'standalone',
};

export default withSentryConfig(nextConfig, {
  // Sentry organization + project for source map upload
  // Set SENTRY_ORG and SENTRY_PROJECT env vars in your CI/CD
  silent: true, // Suppress build output in CI
  disableLogger: true,

  // Only upload source maps in production builds
  widenClientFileUpload: true,

  // Automatically tree-shake Sentry debug code in production
  hideSourceMaps: true,
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.NEXT_PUBLIC_SENTRY_DSN,
});
