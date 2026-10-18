'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { AuthSession } from '../../lib/auth/session';
import { useAuth } from '../../lib/auth/AuthContext';
import { usePendingApprovals, useMyRequests } from '../../hooks/useApprovals';
import {
  Shield,
  LayoutDashboard,
  Key,
  LogOut,
  Users,
  CheckSquare,
  FileText,
  Settings,
  Plug2,
  Puzzle,
  Activity,
  Sun,
  Moon,
  Monitor,
  CreditCard,
  Search,
  Menu,
  HelpCircle,
  ArrowUpRight,
} from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from 'next-themes';
import { hasPermission } from '../../lib/auth/permissions';

const WithUsBrandMark = ({ className = "h-6 w-auto" }: { className?: string }) => (
  <div className="relative flex items-center select-none flex-shrink-0">
    <img
      src="/withus_black_full.png"
      alt="WithUs"
      className={clsx(className, "object-contain dark:hidden")}
    />
    <img
      src="/withus_white_full.png"
      alt="WithUs"
      className={clsx(className, "object-contain hidden dark:block")}
    />
  </div>
);

const WithUsEmblem = ({ className = "w-6 h-6" }: { className?: string }) => (
  <div className="relative flex items-center justify-center select-none flex-shrink-0">
    <img
      src="/withus_black_emblem.png"
      alt="WithUs"
      className={clsx(className, "object-contain dark:hidden")}
    />
    <img
      src="/withus_white_emblem.png"
      alt="WithUs"
      className={clsx(className, "object-contain hidden dark:block")}
    />
  </div>
);

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { refreshContext, organization, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDisplacedModal, setShowDisplacedModal] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // ── Session Displacement Polling ──────────────────────────────────────────
  // Poll /auth/session-status every 30s to detect real-time session displacement.
  // If another device logs in, this session becomes displaced and the modal shows.
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const { apiClient } = await import('../../lib/api/client');
        const res = await apiClient.get('/auth/session-status');
        if (!cancelled && res.data?.displaced) {
          setShowDisplacedModal(true);
        }
      } catch {
        // Ignore network/auth errors — handled by global interceptor
      }
    };
    // Initial check after a short delay, then every 30s
    const initialDelay = setTimeout(poll, 5000);
    const interval = setInterval(poll, 30000);
    return () => {
      cancelled = true;
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  // ── Inactivity Auto-Logout ───────────────────────────────────────────────────
  // 10 min total: 9 min silent, last 1 min shows countdown modal.
  const INACTIVITY_MS = 10 * 60 * 1000;   // 10 minutes
  const WARNING_MS = 60 * 1000;   //  1 minute warning before logout
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(60); // seconds remaining
  const idleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const clearIdleTimers = React.useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearInterval(warningTimerRef.current);
  }, []);

  const startWarningCountdown = React.useCallback(() => {
    setShowIdleWarning(true);
    setIdleCountdown(60);
    warningTimerRef.current = setInterval(() => {
      setIdleCountdown(prev => {
        if (prev <= 1) {
          clearInterval(warningTimerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const resetIdleTimer = React.useCallback(() => {
    // If warning is already showing, a user interaction dismisses it
    if (showIdleWarning) return;
    clearIdleTimers();
    idleTimerRef.current = setTimeout(() => {
      startWarningCountdown();
      // After the 1-minute countdown, force logout
      setTimeout(() => {
        handleLogout();
      }, WARNING_MS);
    }, INACTIVITY_MS - WARNING_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showIdleWarning, clearIdleTimers, startWarningCountdown]);

  // Attach/detach activity event listeners
  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const;
    const handler = () => resetIdleTimer();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetIdleTimer(); // kick off timer on mount
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      clearIdleTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showIdleWarning]);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === 'true') setIsCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar_collapsed', String(nextState));
  };

  const handleMenuClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobileOpen((prev) => !prev);
    } else {
      toggleSidebar();
    }
  };

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const orgId = organization?.id || '';
  const { data: pendingApprovals } = usePendingApprovals(orgId);
  const { data: myRequests } = useMyRequests(orgId);

  const role = organization?.role as string | undefined;
  const canViewAdminPages = hasPermission(role, 'AUDIT_READ'); // OWNER + ADMIN
  let approvalBadgeCount = 0;
  if (canViewAdminPages) {
    approvalBadgeCount = pendingApprovals?.filter((r: any) => r.requesterId !== user?.id)?.length || 0;
  } else {
    approvalBadgeCount = myRequests?.filter((r: any) => r.status === 'PENDING')?.length || 0;
  }

  const handleLogout = async () => {
    try {
      const { apiClient } = await import('../../lib/api/client');
      await apiClient.post('/auth/logout', {});
    } catch {
      // Ignore errors if backend fails
    } finally {
      AuthSession.clear();
      refreshContext();
      router.push('/login');
    }
  };

  const allNavGroups = [
    {
      category: 'Workspace',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: null },
        { name: 'Vaults', href: '/vaults', icon: Key, permission: null },
        { name: 'Sessions', href: '/sessions', icon: Users, permission: null },
        { name: 'Activity', href: '/activity', icon: Activity, permission: 'PRESENCE_READ' },
        { name: 'Approvals', href: '/approvals', icon: CheckSquare, permission: null },
      ],
    },
    {
      category: 'Platform & Security',
      items: [
        { name: 'Browser Extension', href: '/extension', icon: Puzzle, permission: null },
        { name: 'Integrations', href: '/settings/integrations', icon: Plug2, permission: null },
        { name: 'Audit Log', href: '/audit', icon: FileText, permission: 'AUDIT_READ' },
      ],
    },
    {
      category: 'Organization',
      items: [
        { name: 'Team', href: '/settings/members', icon: Users, permission: null },
        { name: 'Permission Matrix', href: '/permissions', icon: Shield, permission: null },
        { name: 'Billing', href: '/pricing', icon: CreditCard, permission: 'ORGANIZATION_UPDATE' },
        { name: 'Settings', href: '/settings', icon: Settings, permission: null },
      ],
    },
  ];

  const navGroups = useMemo(() => {
    return allNavGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => !item.permission || hasPermission(role, item.permission),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [role]);

  const navItems = useMemo(() => {
    return navGroups.flatMap((group) => group.items);
  }, [navGroups]);

  const activeItem = navItems.find((item) =>
    item.href === '/settings' ? pathname === '/settings' : pathname.startsWith(item.href),
  );

  return (
    <div className="flex h-[100dvh] bg-[#f8f9fa] dark:bg-[#07080b] font-sans overflow-hidden relative selection:bg-zinc-950 selection:text-white dark:selection:bg-white dark:selection:text-zinc-950">
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ── Session Displaced Modal ───────────────────────────────────────── */}
      {showDisplacedModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">New login detected</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
              Your WITHUS account is now active on another device. Sign in again to continue here.
            </p>
            <button
              onClick={async () => {
                try {
                  const { apiClient } = await import('../../lib/api/client');
                  await apiClient.post('/auth/logout', {});
                } catch {
                  // Ignore
                } finally {
                  AuthSession.clear();
                  window.location.href = '/login?reason=displaced';
                }
              }}
              className="w-full premium-button-primary py-2.5 text-sm font-semibold rounded-xl"
            >
              Sign in again
            </button>
          </div>
        </div>
      )}

      {/* ── Single Compact Premium SaaS User Portal Sidebar ─────────────────── */}
      <aside
        className={clsx(
          'flex flex-col transition-all duration-200 select-none overflow-hidden border-r border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0c0e14]/80 backdrop-blur-2xl',
          'fixed inset-y-0 left-0 z-50 md:static md:z-auto',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          isCollapsed ? 'md:w-[68px]' : 'w-[250px] md:w-[240px]',
        )}
      >
        {/* Sidebar Top Header (Brand Logo + Collapse Toggle) */}
        <div className={clsx(
          "h-16 flex items-center border-b border-zinc-200/80 dark:border-white/10 flex-shrink-0",
          isCollapsed && !isMobileOpen ? "justify-center px-2" : "justify-between px-4"
        )}>
          <Link
            href="/dashboard"
            className="flex items-center min-w-0 hover:opacity-90 transition-opacity"
            onClick={() => setIsMobileOpen(false)}
            title="WithUs Dashboard"
          >
            {isCollapsed && !isMobileOpen ? (
              <WithUsEmblem className="w-7 h-7" />
            ) : (
              <WithUsBrandMark className="h-7 w-auto" />
            )}
          </Link>

          {(!isCollapsed || isMobileOpen) && (
            <button
              onClick={handleMenuClick}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
              title="Collapse sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dedicated Workspace Identity Card */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="px-3 pt-3 pb-1 flex-shrink-0">
            <div className="px-3 py-2 rounded-2xl bg-zinc-100/70 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/10 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                {organization?.name?.[0]?.toUpperCase() || 'W'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-zinc-900 dark:text-white truncate leading-tight">
                  {organization?.name || 'Workspace'}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="capitalize">{role?.toLowerCase() || 'Member'}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Categorized Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin">
          {navGroups.map((group, groupIdx) => (
            <div key={group.category} className="space-y-1">
              {/* Category Header Label */}
              {(!isCollapsed || isMobileOpen) ? (
                <div className="pt-2 pb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 select-none">
                  {group.category}
                </div>
              ) : (
                groupIdx > 0 && <div className="h-px bg-zinc-200 dark:border-white/10 my-2" />
              )}

              {/* Group Items */}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = item.href === '/settings' ? pathname === '/settings' : pathname.startsWith(item.href);
                  const IconComponent = item.icon;

                  if (isCollapsed && !isMobileOpen) {
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        title={item.name}
                        className={clsx(
                          'relative w-full h-10 rounded-xl flex items-center justify-center transition-all group',
                          isActive
                            ? 'bg-zinc-900 text-white font-bold shadow-sm dark:bg-white/[0.14] dark:text-white dark:border dark:border-white/20 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-white/[0.06]',
                        )}
                      >
                        <IconComponent className="w-4 h-4 flex-shrink-0" />

                        {/* Badge overlay when collapsed */}
                        {item.name === 'Approvals' && approvalBadgeCount > 0 && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-500" />
                        )}
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={clsx(
                        'group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all select-none',
                        isActive
                          ? 'bg-zinc-900 text-white font-bold shadow-sm dark:bg-white/[0.14] dark:text-white dark:border dark:border-white/20 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]'
                          : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-white/[0.06]',
                      )}
                    >
                      <div className="flex items-center min-w-0">
                        <IconComponent
                          className={clsx(
                            'w-4 h-4 mr-2.5 flex-shrink-0 transition-colors',
                            isActive
                              ? 'text-white'
                              : 'text-zinc-400 dark:text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white',
                          )}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>

                      {/* Pending Approvals Count Badge */}
                      {item.name === 'Approvals' && approvalBadgeCount > 0 && (
                        <span className={clsx(
                          "ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold font-number flex-shrink-0",
                          isActive
                            ? "bg-white text-zinc-900 dark:bg-sky-400 dark:text-zinc-950"
                            : "bg-zinc-900 text-white dark:bg-sky-400 dark:text-zinc-950"
                        )}>
                          {approvalBadgeCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Logout Row */}
        <div className="p-3 border-t border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02] flex-shrink-0">
          <button
            onClick={() => {
              setIsMobileOpen(false);
              setShowLogoutConfirm(true);
            }}
            className={clsx(
              'w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors',
              isCollapsed && !isMobileOpen && 'px-0',
            )}
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white/80 dark:bg-[#0c0e14]/80 backdrop-blur-2xl border-b border-zinc-200/80 dark:border-white/10 flex items-center px-4 sm:px-6 md:px-8 shadow-none gap-4 justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={handleMenuClick}
              className={clsx(
                "p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors rounded-xl",
                !isCollapsed && "md:hidden"
              )}
              title="Toggle sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                {organization?.name || 'Workspace'}
              </span>
              <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">/</span>
              <h1 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
                {activeItem?.name || 'Dashboard'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {mounted && (
              <button
                onClick={cycleTheme}
                className="px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-white/15 bg-white/70 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.12] transition-all flex items-center gap-2 text-xs font-semibold backdrop-blur-md shadow-sm"
                title={`Active Theme: ${theme || 'system'} (Click to cycle)`}
              >
                {theme === 'light' && <Sun className="w-3.5 h-3.5 text-amber-500" />}
                {theme === 'dark' && <Moon className="w-3.5 h-3.5 text-sky-400" />}
                {theme === 'system' && <Monitor className="w-3.5 h-3.5 text-zinc-400" />}
                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline-block">
                  {theme || 'system'}
                </span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#f8f9fa] dark:bg-[#07080b] relative">
          {/* Subtle ambient lighting accent */}
          <div className="pointer-events-none absolute -top-32 right-0 w-[500px] h-[500px] bg-sky-500/5 dark:bg-sky-500/[0.04] rounded-full blur-3xl -z-10" />
          <div className="pointer-events-none absolute top-1/2 left-0 w-[400px] h-[400px] bg-amber-500/5 dark:bg-amber-500/[0.03] rounded-full blur-3xl -z-10" />
          {children}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 max-w-sm w-full rounded-lg shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Confirm Logout
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
              Are you sure you want to end your secure session? Any active delegated browser sessions will remain active but you will need to log in again to manage them.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  handleLogout();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Inactivity Warning Modal ─────────────────────────────────────────── */}
      {showIdleWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-extrabold text-amber-500">{idleCountdown}</span>
            </div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">Still there?</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
              You&apos;ve been inactive. For your security, you&apos;ll be logged out in{' '}
              <span className="font-bold text-amber-500">{idleCountdown} second{idleCountdown !== 1 ? 's' : ''}</span>.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setShowIdleWarning(false); clearIdleTimers(); resetIdleTimer(); }}
                className="px-5 py-2 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Stay Logged In
              </button>
              <button
                onClick={() => { setShowIdleWarning(false); clearIdleTimers(); handleLogout(); }}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Log Out Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
