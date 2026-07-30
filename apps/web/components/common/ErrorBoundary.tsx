'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Optional heading shown above the error message */
  heading?: string;
  /** If true, renders a compact inline fallback instead of the full-page variant */
  inline?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — catches any render-time exception in its children subtree.
 *
 * Usage (page-level):
 *   <ErrorBoundary>
 *     <DashboardShell>...</DashboardShell>
 *   </ErrorBoundary>
 *
 * Usage (inline / section-level):
 *   <ErrorBoundary inline heading="Sessions">
 *     <SessionsTable />
 *   </ErrorBoundary>
 *
 * Architectural contract: This component must never be refactored to a
 * function component. React error boundaries require class components.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console in development; in production Sentry will pick this up
    // via the global error handler configured in instrumentation.ts
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.inline) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{this.props.heading ?? 'Section'} failed to load.</span>
          <button
            onClick={this.handleReset}
            className="ml-auto flex items-center gap-1 text-xs font-semibold underline underline-offset-2 hover:no-underline"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
          {this.props.heading ?? 'Something went wrong'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
          An unexpected error occurred in this section. Your data is safe — this is a display
          error only.
        </p>
        {process.env.NODE_ENV === 'development' && this.state.error && (
          <pre className="text-left text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-lg w-full overflow-auto mb-6">
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
        )}
        <div className="flex gap-3">
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
