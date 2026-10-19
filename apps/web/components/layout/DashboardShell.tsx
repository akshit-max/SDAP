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
    <div className="flex h-[100dvh] bg-[#F5F5F7] dark:bg-[#000000] font-sans overflow-hidden relative selection:bg-[#0071E3] selection:text-white">
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ── Session Displaced Modal ───────────────────────────────────────── */}
      {showDisplacedModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-xl border border-[#E5E5EA] dark:border-[#2C2C2E] p-7 max-w-sm w-full mx-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1.5 tracking-tight">New login detected</h2>
            <p className="text-xs text-[#86868B] dark:text-[#8E8E93] leading-relaxed mb-5 font-normal">
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
              className="w-full py-2 text-xs font-medium rounded-lg bg-[#0071E3] hover:bg-[#0077ED] text-white transition-colors shadow-sm"
            >
              Sign in again
            </button>
          </div>
        </div>
      )}

      {/* ── Authentic Apple macOS Sidebar ─────────────────────────────────── */}
      <aside
        className={clsx(
          'flex flex-col transition-all duration-200 select-none overflow-hidden',
          'border-r border-[#E5E5EA] dark:border-[#2C2C2E] bg-[#F6F6F6] dark:bg-[#1E1E1E]',
          'fixed inset-y-0 left-0 z-50 md:static md:z-auto',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          isCollapsed ? 'md:w-[68px]' : 'w-[250px] md:w-[240px]',
        )}
      >
        {/* Sidebar Header (Brand Logo & Collapse Arrow) */}
        <div className={clsx(
          "h-14 flex items-center border-b border-[#E5E5EA] dark:border-[#2C2C2E] flex-shrink-0",
          isCollapsed && !isMobileOpen ? "justify-center px-2" : "justify-between px-4"
        )}>
          <Link
            href="/dashboard"
            className="flex items-center min-w-0 hover:opacity-85 transition-opacity"
            onClick={() => setIsMobileOpen(false)}
            title="WithUs Dashboard"
          >
            {isCollapsed && !isMobileOpen ? (
              <WithUsEmblem className="w-6 h-6" />
            ) : (
              <WithUsBrandMark className="h-6 w-auto" />
            )}
          </Link>

          {(!isCollapsed || isMobileOpen) && (
            <button
              onClick={handleMenuClick}
              className="w-6 h-6 rounded-md flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
              title="Collapse sidebar"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Apple Style Workspace / User Identity Pill */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="px-3 pt-3 pb-1 flex-shrink-0">
            <div className="px-2.5 py-2 rounded-xl bg-white dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-[#38383A] shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#1D1D1F] text-white dark:bg-white dark:text-[#1D1D1F] font-semibold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                  {user?.fullName?.[0]?.toUpperCase() || organization?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] truncate leading-tight">
                    {user?.email || organization?.name || 'Workspace'}
                  </p>
                  <p className="text-[10px] text-[#86868B] dark:text-[#8E8E93] font-normal flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                    <span className="capitalize">{role?.toLowerCase() || 'Owner'}</span>
                  </p>
                </div>
              </div>
              <svg className="w-3 h-3 text-[#AEAEB2] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}

        {/* Categorized Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-4 scrollbar-thin">
          {navGroups.map((group, groupIdx) => (
            <div key={group.category} className="space-y-0.5">
              {/* Category Header Label */}
              {(!isCollapsed || isMobileOpen) ? (
                <div className="pt-2 pb-1 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#86868B] dark:text-[#8E8E93] select-none">
                  {group.category}
                </div>
              ) : (
                groupIdx > 0 && <div className="h-px bg-[#E5E5EA] dark:bg-[#2C2C2E] my-1.5" />
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
                          'relative w-full h-9 rounded-lg flex items-center justify-center transition-colors group',
                          isActive
                            ? 'bg-[#0071E3] text-white shadow-sm'
                            : 'text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.05] dark:hover:bg-white/[0.08]',
                        )}
                      >
                        <IconComponent className="w-4 h-4 flex-shrink-0" />

                        {/* Badge overlay when collapsed */}
                        {item.name === 'Approvals' && approvalBadgeCount > 0 && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF3B30]" />
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
                        'group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors select-none',
                        isActive
                          ? 'bg-[#0071E3] text-white font-medium shadow-sm'
                          : 'text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] font-normal',
                      )}
                    >
                      <div className="flex items-center min-w-0">
                        <IconComponent
                          className={clsx(
                            'w-4 h-4 mr-2.5 flex-shrink-0 transition-colors',
                            isActive
                              ? 'text-white'
                              : 'text-[#86868B] dark:text-[#8E8E93] group-hover:text-[#1D1D1F] dark:group-hover:text-white',
                          )}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>

                      {/* Pending Approvals Count Badge */}
                      {item.name === 'Approvals' && approvalBadgeCount > 0 && (
                        <span className={clsx(
                          "ml-auto px-1.5 py-0.2 rounded-full text-[10px] font-semibold font-number flex-shrink-0",
                          isActive
                            ? "bg-white text-[#0071E3]"
                            : "bg-[#FF3B30] text-white"
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

        {/* Bottom User Profile & Logout Row */}
        <div className="p-2.5 border-t border-[#E5E5EA] dark:border-[#2C2C2E] bg-[#F6F6F6] dark:bg-[#1E1E1E] flex-shrink-0 flex items-center justify-between gap-2">
          {(!isCollapsed || isMobileOpen) && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#E5E5EA] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] text-xs font-semibold flex items-center justify-center flex-shrink-0">
                {user?.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] truncate max-w-[120px]">
                {user?.fullName || user?.email?.split('@')[0] || 'User'}
              </span>
            </div>
          )}

          <button
            onClick={() => {
              setIsMobileOpen(false);
              setShowLogoutConfirm(true);
            }}
            className={clsx(
              'flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-normal text-[#86868B] hover:text-[#FF3B30] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors',
              isCollapsed && !isMobileOpen && 'w-full justify-center px-0 py-1.5',
            )}
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Apple macOS Toolbar (Clean 56px height, hairline separator) */}
        <header className="h-14 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md border-b border-[#E5E5EA] dark:border-[#2C2C2E] flex items-center px-4 sm:px-6 md:px-8 gap-4 justify-between flex-shrink-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleMenuClick}
              className={clsx(
                "p-1.5 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors rounded-lg",
                !isCollapsed && "md:hidden"
              )}
              title="Toggle sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-xs min-w-0">
              <span className="font-normal text-[#86868B] dark:text-[#8E8E93] truncate hidden sm:inline">
                {user?.email || organization?.name || 'Workspace'}
              </span>
              <span className="text-[#C7C7CC] dark:text-[#48484A] hidden sm:inline">/</span>
              <h1 className="text-xs sm:text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight truncate">
                {activeItem?.name || 'Dashboard'}
              </h1>
            </div>
          </div>

          {/* Apple Spotlight Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B] dark:text-[#8E8E93] pointer-events-none" />
              <input
                type="text"
                placeholder="Search vaults, sessions, or users..."
                className="w-full pl-8 pr-16 py-1.5 rounded-lg text-xs bg-[#F5F5F7] dark:bg-[#2C2C2E]/80 border border-[#E5E5EA] dark:border-[#38383A] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] dark:placeholder-[#8E8E93] focus:outline-none focus:ring-1 focus:ring-[#0071E3] transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <kbd className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-[#86868B] dark:text-[#8E8E93] bg-white dark:bg-[#38383A] border border-[#E5E5EA] dark:border-[#48484A] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
                  Ctrl K
                </kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            {/* Apple Theme Switcher Button */}
            {mounted && (
              <button
                onClick={cycleTheme}
                className="w-8 h-8 rounded-lg border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#38383A] transition-colors flex items-center justify-center text-xs shadow-sm"
                title={`Active Theme: ${theme || 'system'} (Click to cycle)`}
              >
                {theme === 'light' && <Sun className="w-3.5 h-3.5 text-[#FF9500]" />}
                {theme === 'dark' && <Moon className="w-3.5 h-3.5 text-[#0071E3]" />}
                {theme === 'system' && <Monitor className="w-3.5 h-3.5 text-[#86868B]" />}
              </button>
            )}

            {/* Notification Bell */}
            <button
              onClick={() => router.push('/approvals')}
              className="relative w-8 h-8 rounded-lg border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#38383A] transition-colors flex items-center justify-center shadow-sm"
              title="Approvals & Notifications"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {approvalBadgeCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF3B30] ring-2 ring-white dark:ring-[#1C1C1E]" />
              )}
            </button>

            {/* Live System Status Pill */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#34C759]/10 text-[#34C759] text-[11px] font-medium tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
              <span>SYSTEM</span>
            </div>
          </div>
        </header>

        {/* Clean Apple Canvas (Zero AI Glow Blobs) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#F5F5F7] dark:bg-[#000000] relative">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] p-6 max-w-sm w-full rounded-2xl shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              Confirm Logout
            </h3>
            <p className="text-xs text-[#86868B] dark:text-[#8E8E93] leading-relaxed font-normal">
              Are you sure you want to end your secure session? Any active delegated browser sessions will remain active but you will need to log in again to manage them.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] bg-black/[0.05] dark:bg-white/[0.08] rounded-lg hover:bg-black/[0.08] dark:hover:bg-white/[0.12] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  handleLogout();
                }}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#FF3B30] hover:bg-[#D70015] rounded-lg transition-colors shadow-sm"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Inactivity Warning Modal ─────────────────────────────────────────── */}
      {showIdleWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] rounded-2xl shadow-xl p-7 max-w-sm w-full mx-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">{idleCountdown}</span>
            </div>
            <h2 className="text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1.5 tracking-tight">Still there?</h2>
            <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mb-5 font-normal">
              You&apos;ve been inactive. For your security, you&apos;ll be logged out in{' '}
              <span className="font-semibold text-[#FF9500]">{idleCountdown} second{idleCountdown !== 1 ? 's' : ''}</span>.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => { setShowIdleWarning(false); clearIdleTimers(); resetIdleTimer(); }}
                className="px-3.5 py-1.5 text-xs font-medium bg-black/[0.05] dark:bg-white/[0.08] text-[#1D1D1F] dark:text-[#F5F5F7] rounded-lg hover:bg-black/[0.08] dark:hover:bg-white/[0.12] transition-colors"
              >
                Stay Logged In
              </button>
              <button
                onClick={() => { setShowIdleWarning(false); clearIdleTimers(); handleLogout(); }}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#FF3B30] hover:bg-[#D70015] rounded-lg transition-colors shadow-sm"
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
