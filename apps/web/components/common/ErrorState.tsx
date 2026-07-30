import { AlertCircle } from 'lucide-react';
import React from 'react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, className = '' }: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center space-y-3.5 rounded-xl border border-red-200/50 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 text-red-900 ${className}`}>
      <AlertCircle className="w-8 h-8 text-red-500" />
      <div>
        <h3 className="text-xs font-bold text-red-900 dark:text-red-400 uppercase tracking-wider">{title}</h3>
        <p className="text-xs mt-1 text-red-700/80 dark:text-red-300/80 font-medium">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 bg-red-100 hover:bg-red-200/80 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-800 dark:text-red-300 rounded-lg font-semibold transition-colors text-xs shadow-sm"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
