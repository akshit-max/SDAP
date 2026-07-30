'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Next.js App Router route-level error boundary.
 * Automatically wraps the page segment it lives next to.
 * Works alongside the <ErrorBoundary> class component for full coverage.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production Sentry captures this automatically.
    console.error('[RouteError]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Something went wrong
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
        An unexpected error occurred. Your data is safe — try refreshing or navigating back.
      </p>
      {process.env.NODE_ENV === 'development' && (
        <pre className="text-left text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-lg w-full overflow-auto mb-6">
          {error.message}
        </pre>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Go back
        </button>
      </div>
    </div>
  );
}
