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
    <div className={`flex flex-col items-center justify-center p-8 text-center space-y-4 rounded-lg border border-red-200 bg-red-50 text-red-900 ${className}`}>
      <AlertCircle className="w-10 h-10 text-red-500" />
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm mt-1 text-red-700">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md font-medium transition-colors text-sm"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
