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

// Dashboard toast theme — matches dashboard cards (#1C1C1E / #E5E5EA surfaces)
const dashboardConfig = {
  success: { icon: CheckCircle2, bar: 'bg-emerald-500', chip: 'bg-emerald-500/10 dark:bg-emerald-400/10 ring-emerald-500/20', icon_color: 'text-emerald-600 dark:text-emerald-400', label: 'Success' },
  error: { icon: AlertCircle, bar: 'bg-rose-500', chip: 'bg-rose-500/10 dark:bg-rose-400/10 ring-rose-500/20', icon_color: 'text-rose-600 dark:text-rose-400', label: 'Error' },
  warning: { icon: AlertTriangle, bar: 'bg-amber-500', chip: 'bg-amber-500/10 dark:bg-amber-400/10 ring-amber-500/20', icon_color: 'text-amber-600 dark:text-amber-400', label: 'Warning' },
  info: { icon: Info, bar: 'bg-[#0071E3]', chip: 'bg-[#0071E3]/10 dark:bg-[#2997FF]/10 ring-[#0071E3]/20', icon_color: 'text-[#0071E3] dark:text-[#2997FF]', label: 'Info' },
};

// Outer page toast theme: high-contrast deep sapphire frosted glass with sharp status accents
const outerConfig = {
  success: {
    icon: CheckCircle2,
    bar: 'bg-emerald-400',
    badge: 'bg-emerald-500/15 border border-emerald-400/30 text-emerald-400',
    iconColor: 'text-emerald-400',
    label: 'Success',
  },
  error: {
    icon: AlertCircle,
    bar: 'bg-rose-400',
    badge: 'bg-rose-500/15 border border-rose-400/30 text-rose-400',
    iconColor: 'text-rose-400',
    label: 'Something went wrong',
  },
  warning: {
    icon: AlertTriangle,
    bar: 'bg-amber-400',
    badge: 'bg-amber-500/15 border border-amber-400/30 text-amber-400',
    iconColor: 'text-amber-400',
    label: 'Warning',
  },
  info: {
    icon: Info,
    bar: 'bg-sky-400',
    badge: 'bg-sky-500/15 border border-sky-400/30 text-sky-400',
    iconColor: 'text-sky-400',
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
 * High-contrast, sharp, deep sapphire frosted glass notification matching the atmospheric theme.
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
      className="pointer-events-auto relative flex items-start gap-3 w-[22.5rem] max-w-[calc(100vw-2rem)] pl-4 pr-3 py-3.5 rounded-[18px] bg-[#142038]/88 hover:bg-[#142038]/94 backdrop-blur-2xl border border-white/20 shadow-[0_20px_45px_-8px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_0_rgba(255,255,255,0.22)] text-white font-geist overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200 select-none"
      role="alert"
    >
      {/* Icon badge matching outer feature icon container */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${c.badge} flex items-center justify-center shadow-sm mt-0.5`}>
        <Icon className={`w-[18px] h-[18px] ${c.iconColor} stroke-[2.2]`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-px">
        <p className="text-[13px] font-semibold text-white tracking-tight leading-5">
          {c.label}
        </p>
        <p className="text-[13px] text-zinc-200 font-normal leading-snug break-words">
          {message}
        </p>
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.08] overflow-hidden">
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
      className="group pointer-events-auto relative flex items-center gap-3 w-[372px] max-w-[calc(100vw-2rem)] pl-4 pr-3 py-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-8px_rgba(0,0,0,0.14)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_16px_40px_-10px_rgba(0,0,0,0.75)] overflow-hidden animate-in slide-in-from-bottom-3 fade-in duration-300 ease-out select-none"
      role={type === 'error' ? 'alert' : 'status'}
    >
      {/* Status accent */}
      <span className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full ${c.bar}`} aria-hidden />

      <div className={`flex-shrink-0 w-9 h-9 rounded-xl ring-1 ring-inset ${c.chip} flex items-center justify-center`}>
        <Icon className={`w-[18px] h-[18px] ${c.icon_color}`} strokeWidth={2.2} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold leading-5 tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
          {c.label}
        </p>
        <p className="text-[12.5px] leading-snug text-[#6E6E73] dark:text-[#98989D] break-words">
          {message}
        </p>
      </div>

      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 self-start p-1.5 rounded-lg text-zinc-400 opacity-70 group-hover:opacity-100 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-all"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-100 dark:bg-white/[0.04] overflow-hidden">
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
            : "fixed bottom-6 right-6 z-[200] flex flex-col gap-2.5 items-end pointer-events-none"
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
