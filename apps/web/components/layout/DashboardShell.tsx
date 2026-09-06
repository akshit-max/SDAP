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

const CustomAsterisk = ({ className }: { className?: string; strokeWidth?: number }) => (
  <svg
    viewBox="0 0 128 128"
    fill="none"
    className={className}
  >
    <rect x="2" y="2" width="124" height="124" rx="26" fill="#09090b" stroke="#27272a" strokeWidth="4" />
    <g stroke="#ffffff" strokeWidth="10" strokeLinecap="round">
      <line x1="64" y1="28" x2="64" y2="100" />
      <line x1="28" y1="64" x2="100" y2="64" />
      <line x1="44" y1="44" x2="84" y2="84" />
      <line x1="44" y1="84" x2="84" y2="44" />
    </g>
  </svg>
);

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { refreshContext, organization, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

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
        { name: 'Billing', href: '/pricing', icon: CreditCard, permission: null },
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
    <div className="flex h-screen bg-premium-bg font-premium overflow-hidden">
      {/* ── Single Compact Premium SaaS User Portal Sidebar ─────────────────── */}
      <aside
        className={clsx(
          'flex flex-col transition-all duration-200 select-none overflow-hidden border-r border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#121214]',
          isCollapsed ? 'w-[60px]' : 'w-[230px]',
        )}
      >
        {/* Sidebar Top Header (Logo + Org Name + Collapse Toggle) */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 flex-shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 min-w-0 hover:opacity-85 transition-opacity"
          >
            <CustomAsterisk className="w-6 h-6 flex-shrink-0" strokeWidth={10} />
            {!isCollapsed && (
              <span className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                {organization?.name || 'WithUs Vault'}
              </span>
            )}
          </Link>

          {!isCollapsed && (
            <button
              onClick={toggleSidebar}
              className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Collapse sidebar"
            >
              <Menu className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Categorized Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 scrollbar-thin">
          {navGroups.map((group, groupIdx) => (
            <div key={group.category} className="space-y-1">
              {/* Category Header Label */}
              {!isCollapsed ? (
                <div className="pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 select-none">
                  {group.category}
                </div>
              ) : (
                groupIdx > 0 && <div className="h-px bg-zinc-200 dark:bg-zinc-800/80 my-1.5" />
              )}

              {/* Group Items */}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = item.href === '/settings' ? pathname === '/settings' : pathname.startsWith(item.href);
                  const IconComponent = item.icon;

                  if (isCollapsed) {
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        title={item.name}
                        className={clsx(
                          'relative w-full h-9 rounded-lg flex items-center justify-center transition-colors group',
                          isActive
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-sm'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60',
                        )}
                      >
                        <IconComponent className="w-4 h-4 flex-shrink-0" />

                        {/* Badge overlay when collapsed */}
                        {item.name === 'Approvals' && approvalBadgeCount > 0 && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                        )}
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={clsx(
                        'group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors select-none',
                        isActive
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-sm'
                          : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60',
                      )}
                    >
                      <div className="flex items-center min-w-0">
                        <IconComponent
                          className={clsx(
                            'w-4 h-4 mr-2.5 flex-shrink-0 transition-colors',
                            isActive
                              ? 'text-white dark:text-zinc-900'
                              : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white',
                          )}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>

                      {/* Pending Approvals Count Badge */}
                      {item.name === 'Approvals' && approvalBadgeCount > 0 && (
                        <span className={clsx(
                          "ml-auto px-1.5 py-0.2 rounded-full text-[9px] font-bold font-number flex-shrink-0",
                          isActive
                            ? "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white"
                            : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
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
        <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-[#09090b]/50 flex-shrink-0">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={clsx(
              'w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors',
              isCollapsed && 'px-0',
            )}
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            {!isCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-premium-bg border-b border-zinc-200 dark:border-zinc-800 flex items-center px-8 shadow-none gap-4 justify-between pt-1">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors rounded"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Menu className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {activeItem?.name || 'Vaults'}
            </h1>
          </div>

          {mounted && (
            <button
              onClick={cycleTheme}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 rounded"
              title={`Active Theme: ${theme || 'system'} (Click to cycle)`}
            >
              {theme === 'light' && <Sun className="w-4 h-4" />}
              {theme === 'dark' && <Moon className="w-4 h-4" />}
              {theme === 'system' && <Monitor className="w-4 h-4" />}
              <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline-block">
                {theme || 'system'}
              </span>
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-premium-bg">
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
    </div>
  );
}
