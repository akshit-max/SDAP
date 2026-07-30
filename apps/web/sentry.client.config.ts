'use client';

import * as Sentry from '@sentry/nextjs';

/**
 * Sentry client-side configuration.
 *
 * Set NEXT_PUBLIC_SENTRY_DSN in your .env file to enable.
 * If DSN is not set, Sentry initializes in no-op mode — safe for development.
 *
 * Architectural contract: All error reporting routes through Sentry.
 * Never add direct console.error() calls in production components.
 * ErrorBoundary.componentDidCatch() and Next.js error.tsx both
 * automatically report to Sentry when this is configured.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',

  // Capture 100% of errors, 10% of performance traces
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.0, // Disable session replay (privacy)
  replaysOnErrorSampleRate: 0.0,

  // Do not report in development (console output is sufficient)
  enabled: process.env.NODE_ENV === 'production',

  beforeSend(event) {
    // Strip PII from error events: do not send user email or org names
    if (event.user) {
      delete event.user.email;
      delete event.user.username;
    }
    return event;
  },
});
