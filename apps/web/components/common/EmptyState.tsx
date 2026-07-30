import { FileQuestion, Plus } from 'lucide-react';
import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, className = '', icon }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 ${className}`}>
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 mb-3.5">
        {icon || <FileQuestion className="w-5 h-5" />}
      </div>
      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs font-medium leading-normal">{description}</p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 flex items-center justify-center px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-lg font-semibold transition-colors text-xs shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
