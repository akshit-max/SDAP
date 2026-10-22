'use client';

import React, { useEffect, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

import { usePathname } from 'next/navigation';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = React.createContext<ToastContextType>({ toast: () => {} });

// Standard dashboard toast theme (preserved for dashboard light & dark modes)
const dashboardConfig = {
  success: {
    icon: CheckCircle2,
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    icon_color: 'text-emerald-600 dark:text-emerald-400',
    badge_bg: 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/25',
    label: 'Success',
  },
  error: {
    icon: AlertCircle,
    bar: 'bg-rose-500',
    dot: 'bg-rose-500',
    icon_color: 'text-rose-600 dark:text-rose-400',
    badge_bg: 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/25',
    label: 'Error',
  },
  warning: {
    icon: AlertTriangle,
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
    icon_color: 'text-amber-600 dark:text-amber-400',
    badge_bg: 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/25',
    label: 'Warning',
  },
  info: {
    icon: Info,
    bar: 'bg-sky-500',
    dot: 'bg-sky-500',
    icon_color: 'text-sky-600 dark:text-sky-400',
    badge_bg: 'bg-sky-500/10 dark:bg-sky-500/15 border-sky-500/25',
    label: 'Info',
  },
};

// Outer page toast theme: frosted glass matching the auth card, status shown only via icon + bar
const outerConfig = {
  success: {
    icon: CheckCircle2,
    bar: 'bg-emerald-300',
    iconColor: 'text-emerald-300',
    label: 'Success',
  },
  error: {
    icon: AlertCircle,
    bar: 'bg-rose-300',
    iconColor: 'text-rose-300',
    label: 'Something went wrong',
  },
  warning: {
    icon: AlertTriangle,
    bar: 'bg-amber-300',
    iconColor: 'text-amber-300',
    label: 'Warning',
  },
  info: {
    icon: Info,
    bar: 'bg-sky-300',
    iconColor: 'text-sky-300',
    label: 'Notice',
  },
};

const OUTER_PAGE_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/invite',
  '/auth',
  '/privacy',
  '/terms',
  '/security',
  '/cookie-policy',
  '/refund-policy',
  '/withus',
];

function isOuterPage(pathname: string | null): boolean {
  if (!pathname) return false;
  return OUTER_PAGE_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(prefix + '/'));
}

interface ToastProps extends ToastItem {
  onDismiss: (id: string) => void;
}

/**
 * Toast rendered on all outer pages (Login, Register, Forgot Password, Invite, Legal).
 * Frosted glass notification matching the auth card surface — no glow or pulsing effects.
 */
function OuterToast({ id, type, message, onDismiss }: ToastProps) {
  const c = outerConfig[type];
  const Icon = c.icon;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 4500);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <div
      className="pointer-events-auto relative flex items-start gap-3 w-[22.5rem] max-w-[calc(100vw-2rem)] pl-4 pr-3 py-3.5 rounded-[22px] bg-white/[0.10] backdrop-blur-2xl border border-white/25 shadow-[0_28px_60px_-12px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.35)] text-white font-geist overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200 select-none"
      role="alert"
    >
      {/* Icon badge matching outer feature icon container */}
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/[0.12] border border-white/20 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] mt-0.5">
        <Icon className={`w-[18px] h-[18px] ${c.iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-px">
        <p className="text-[13px] font-semibold text-white tracking-tight leading-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
          {c.label}
        </p>
        <p className="text-[13px] text-white/80 leading-snug break-words">
          {message}
        </p>
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 overflow-hidden">
        <div className={`h-full ${c.bar} opacity-90 animate-[shrink_4.5s_linear_forwards]`} />
      </div>
    </div>
  );
}

/**
 * Standard Dashboard Toast.
 * Preserves the exact light & dark dashboard theme with zero regression.
 */
function DashboardToast({ id, type, message, onDismiss }: ToastProps) {
  const c = dashboardConfig[type];
  const Icon = c.icon;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 4500);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <div
      className="pointer-events-auto relative flex items-start gap-3 w-80 sm:w-88 p-3.5 rounded-2xl shadow-[0_16px_40px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.12)] bg-white/85 dark:bg-[#11131a]/90 backdrop-blur-2xl border border-zinc-200/80 dark:border-white/15 overflow-hidden animate-in slide-in-from-right-5 fade-in duration-300 transition-all select-none"
      role="alert"
    >
      {/* Icon badge */}
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-xl border ${c.badge_bg} flex items-center justify-center shadow-sm`}>
          <Icon className={`w-4 h-4 ${c.icon_color}`} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />
          <p className={`text-[10px] font-extrabold uppercase tracking-widest ${c.icon_color}`}>
            {c.label}
          </p>
        </div>
        <p className="text-xs font-semibold leading-snug text-zinc-900 dark:text-white break-words">
          {message}
        </p>
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 p-1 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-zinc-100/50 dark:bg-white/[0.04] overflow-hidden">
        <div className={`h-full ${c.bar} opacity-60 animate-[shrink_4.5s_linear_forwards]`} />
      </div>
    </div>
  );
}

function Toast(props: ToastProps) {
  const pathname = usePathname();
  const isOuter = isOuterPage(pathname);
  return isOuter ? <OuterToast {...props} /> : <DashboardToast {...props} />;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOuter = isOuterPage(pathname);
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
        className={
          isOuter
            ? "fixed bottom-8 right-6 sm:bottom-10 sm:right-8 z-[200] flex flex-col gap-3 items-end pointer-events-none"
            : "fixed bottom-5 right-5 z-[200] flex flex-col gap-3 items-end"
        }
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
