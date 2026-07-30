import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  className?: string;
}

export function Loading({ message = 'Loading...', className = '' }: LoadingProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-slate-500 dark:text-slate-400 space-y-3.5 ${className}`}>
      <Loader2 className="w-6 h-6 animate-spin text-slate-900 dark:text-slate-100" />
      <p className="text-xs font-semibold">{message}</p>
    </div>
  );
}
