'use client';

import React, { useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem { id: string; type: ToastType; message: string; }
interface ToastContextType { toast: (type: ToastType, message: string) => void; }

const ToastContext = React.createContext<ToastContextType>({ toast: () => {} });

const config = {
  success: {
    icon: CheckCircle,
    bar: 'bg-emerald-500',
    icon_color: 'text-emerald-500',
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-slate-200/80 dark:border-slate-800',
    text: 'text-slate-900 dark:text-slate-100',
    sub: 'text-slate-500 dark:text-slate-400',
    label: 'Success',
  },
  error: {
    icon: AlertCircle,
    bar: 'bg-red-500',
    icon_color: 'text-red-500',
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-slate-200/80 dark:border-slate-800',
    text: 'text-slate-900 dark:text-slate-100',
    sub: 'text-slate-500 dark:text-slate-400',
    label: 'Error',
  },
  warning: {
    icon: AlertTriangle,
    bar: 'bg-amber-500',
    icon_color: 'text-amber-500',
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-slate-200/80 dark:border-slate-800',
    text: 'text-slate-900 dark:text-slate-100',
    sub: 'text-slate-500 dark:text-slate-400',
    label: 'Warning',
  },
  info: {
    icon: Info,
    bar: 'bg-blue-500',
    icon_color: 'text-blue-500',
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-slate-200/80 dark:border-slate-800',
    text: 'text-slate-900 dark:text-slate-100',
    sub: 'text-slate-500 dark:text-slate-400',
    label: 'Info',
  },
};

interface ToastProps extends ToastItem {
  onDismiss: (id: string) => void;
}

function Toast({ id, type, message, onDismiss }: ToastProps) {
  const c = config[type];
  const Icon = c.icon;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 4500);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <div
      className={`
        relative flex items-start gap-3.5 w-80 rounded-xl shadow-xl border overflow-hidden
        ${c.bg} ${c.border}
        animate-in slide-in-from-right-5 fade-in duration-300
      `}
      role="alert"
    >
      {/* Left colour bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.bar} rounded-l-xl`} />

      {/* Icon */}
      <div className="flex-shrink-0 pl-5 pt-4">
        <Icon className={`w-5 h-5 ${c.icon_color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 py-4 pr-2 min-w-0">
        <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${c.icon_color}`}>{c.label}</p>
        <p className={`text-sm font-medium leading-snug ${c.text}`}>{message}</p>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 mt-3.5 mr-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Auto-dismiss progress bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${c.bar} opacity-30 animate-[shrink_4.5s_linear_forwards]`} />
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-5 right-5 z-[200] flex flex-col gap-3 items-end"
      >
        {toasts.map(t => (
          <Toast key={t.id} {...t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}
