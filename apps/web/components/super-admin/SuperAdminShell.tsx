'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { AuthSession } from '../../lib/auth/session';
import { useAuth } from '../../lib/auth/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  Puzzle,
  CreditCard,
  BarChart3,
  Shield,
  Ticket,
  HeartPulse,
  Bell,
  Crown,
  Settings,
  LogOut,
  Menu,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  ChevronRight,
  Vault,
  MonitorCheck,
  Search,
  HelpCircle,
  ArrowUpRight,
  Activity,
  Plug2,
  TrendingDown,
  Zap,
  Repeat,
  Target,
  FileText,
  LogIn,
  ShieldAlert,
  Database,
  Server,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from 'next-themes';

const CustomAsterisk = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 128 128" fill="none" className={className}>
    <rect x="2" y="2" width="124" height="124" rx="26" fill="#09090b" stroke="#27272a" strokeWidth="4" />
    <g stroke="#ffffff" strokeWidth="10" strokeLinecap="round">
      <line x1="64" y1="28" x2="64" y2="100" />
      <line x1="28" y1="64" x2="100" y2="64" />
      <line x1="44" y1="44" x2="84" y2="84" />
      <line x1="44" y1="84" x2="84" y2="44" />
    </g>
  </svg>
);

type NavChild = { name: string; href: string; icon: React.ElementType; badge?: string };
type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: string;
  children?: NavChild[];
};
type NavGroup = {
  category: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    category: 'Overview',
    items: [
      {
        name: 'Dashboard',
        href: '/superadmin',
        icon: LayoutDashboard,
        exact: true,
      },
      {
        name: 'Organisations',
        href: '/superadmin/organizations',
        icon: Building2,
      },
      {
        name: 'Users',
        href: '/superadmin/users',
        icon: Users,
        children: [
          { name: 'All Users', href: '/superadmin/users', icon: Users },
          { name: 'Activity', href: '/superadmin/users?tab=activity', icon: Activity },
        ],
      },
      {
        name: 'WITHUS Platforms',
        href: '/superadmin/platforms',
        icon: Puzzle,
        children: [
          { name: 'Platform Ecosystem', href: '/superadmin/platforms', icon: Puzzle },
          { name: 'Integration Connections', href: '/superadmin/platforms?tab=connections', icon: Plug2 },
        ],
      },
    ],
  },
  {
    category: 'Vault & Subscriptions',
    items: [
      {
        name: 'Vault Analytics',
        href: '/superadmin/vaults',
        icon: Vault,
      },
      {
        name: 'Sessions',
        href: '/superadmin/sessions',
        icon: MonitorCheck,
      },
      {
        name: 'Subscriptions',
        href: '/superadmin/subscriptions',
        icon: CreditCard,
        children: [
          { name: 'Plans', href: '/superadmin/subscriptions', icon: CreditCard },
          { name: 'Customers', href: '/superadmin/subscriptions?tab=customers', icon: Building2 },
          { name: 'Revenue', href: '/superadmin/subscriptions?tab=revenue', icon: BarChart3 },
          { name: 'Churn', href: '/superadmin/subscriptions?tab=churn', icon: TrendingDown },
        ],
      },
    ],
  },
  {
    category: 'Governance & Health',
    items: [
      {
        name: 'Analytics',
        href: '/superadmin/analytics',
        icon: BarChart3,
        children: [
          { name: 'Product Usage', href: '/superadmin/analytics', icon: BarChart3 },
          { name: 'Activation', href: '/superadmin/analytics?tab=activation', icon: Zap },
          { name: 'Retention', href: '/superadmin/analytics?tab=retention', icon: Repeat },
          { name: 'Conversion', href: '/superadmin/analytics?tab=conversion', icon: Target },
        ],
      },
      {
        name: 'Security',
        href: '/superadmin/audit',
        icon: Shield,
        children: [
          { name: 'Audit Logs', href: '/superadmin/audit', icon: FileText },
          { name: 'Login Activity', href: '/superadmin/audit?tab=login', icon: LogIn },
          { name: 'Security Events', href: '/superadmin/audit?tab=security', icon: ShieldAlert },
        ],
      },
      {
        name: 'System Health',
        href: '/superadmin/health',
        icon: HeartPulse,
        children: [
          { name: 'API & Database', href: '/superadmin/health', icon: Database },
          { name: 'Integration Status', href: '/superadmin/health?tab=integrations', icon: HeartPulse },
          { name: 'Server', href: '/superadmin/health?tab=server', icon: Server },
          { name: 'Errors', href: '/superadmin/health?tab=errors', icon: AlertTriangle },
        ],
      },
      {
        name: 'Notifications',
        href: '/superadmin/notifications',
        icon: Bell,
      },
    ],
  },
  {
    category: 'Admin & System',
    items: [
      {
        name: 'Support',
        href: '/superadmin/support',
        icon: Ticket,
      },
      {
        name: 'Admin Management',
        href: '/superadmin/admin',
        icon: Crown,
      },
      {
        name: 'Settings',
        href: '/superadmin/settings',
        icon: Settings,
      },
    ],
  },
];

const navItems: NavItem[] = navGroups.flatMap((group) => group.items);

export function SuperAdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { refreshContext } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [navSearch, setNavSearch] = useState('');

  const queryString = searchParams?.toString() ? `?${searchParams.toString()}` : '';
  const fullPath = pathname + queryString;

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('sa_sidebar_collapsed');
    if (saved === 'true') setIsCollapsed(true);

    const active = navItems.find((item) =>
      item.exact ? pathname === item.href : pathname.startsWith(item.href),
    );
    if (active?.children) {
      setExpandedSections(new Set([active.name]));
    }
  }, [pathname]);

  const toggleSidebar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sa_sidebar_collapsed', String(next));
  };

  const toggleSection = (name: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const handleLogout = async () => {
    try {
      const { apiClient } = await import('../../lib/api/client');
      await apiClient.post('/auth/logout', {});
    } catch {
      // Ignore
    } finally {
      AuthSession.clear();
      refreshContext();
      router.push('/login');
    }
  };

  const activeItem = navItems.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href),
  );

  const filteredNavItems = useMemo(() => {
    if (!navSearch.trim()) return navItems;
    const query = navSearch.toLowerCase();
    return navItems.filter((item) => {
      const matchParent = item.name.toLowerCase().includes(query);
      const matchChildren = item.children?.some((c) => c.name.toLowerCase().includes(query));
      return matchParent || matchChildren;
    });
  }, [navSearch]);

  return (
    <div className="flex h-screen bg-premium-bg font-premium overflow-hidden">
      {/* ── Single Compact Premium SaaS Sidebar ─────────────────────────── */}
      <aside
        className={clsx(
          'flex flex-col transition-all duration-200 select-none overflow-hidden border-r border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#121214]',
          isCollapsed ? 'w-[60px]' : 'w-[230px]',
        )}
      >
        {/* Sidebar Top Header (Logo + Brand Title + Collapse Button) */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 flex-shrink-0">
          <Link
            href="/superadmin"
            className="flex items-center gap-2.5 min-w-0 hover:opacity-85 transition-opacity"
          >
            <CustomAsterisk className="w-6 h-6 flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                WithUs Admin
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
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  const hasChildren = !!item.children?.length;
                  const isExpanded = expandedSections.has(item.name);
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
                      </Link>
                    );
                  }

                  return (
                    <div key={item.name} className="space-y-0.5">
                      {/* Nav Item Container */}
                      <div
                        onClick={() => {
                          if (hasChildren) {
                            toggleSection(item.name);
                          }
                        }}
                        className={clsx(
                          'group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer select-none',
                          isActive
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-sm'
                            : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60',
                        )}
                      >
                        <Link
                          href={item.href}
                          className="flex-1 flex items-center min-w-0"
                        >
                          <IconComponent
                            className={clsx(
                              'w-4 h-4 mr-2.5 flex-shrink-0 transition-colors',
                              isActive
                                ? 'text-white dark:text-zinc-900'
                                : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white',
                            )}
                          />
                          <span className="truncate">{item.name}</span>
                        </Link>

                        {/* Chevron button for sub-items */}
                        {hasChildren && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleSection(item.name);
                            }}
                            className="p-0.5 ml-2 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-shrink-0"
                            title={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            <ChevronDown
                              className={clsx(
                                'w-3.5 h-3.5 transition-transform duration-200',
                                isExpanded
                                  ? 'rotate-0'
                                  : '-rotate-90',
                                isActive
                                  ? 'text-white/80 dark:text-zinc-900/80'
                                  : 'text-zinc-400 dark:text-zinc-500',
                              )}
                            />
                          </button>
                        )}
                      </div>

                      {/* Indented Child Sub-Navigation */}
                      {hasChildren && isExpanded && (
                        <div className="ml-5 pl-2 mt-1 mb-1 space-y-0.5 border-l border-zinc-200/80 dark:border-zinc-800">
                          {item.children?.map((child) => {
                            const isChildActive = fullPath === child.href;
                            const ChildIcon = child.icon;

                            return (
                              <Link
                                key={child.name}
                                href={child.href}
                                className={clsx(
                                  'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors group',
                                  isChildActive
                                    ? 'bg-zinc-200/90 text-zinc-950 dark:bg-zinc-800 dark:text-white font-bold'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40',
                                )}
                              >
                                <ChildIcon
                                  className={clsx(
                                    'w-3.5 h-3.5 flex-shrink-0 transition-colors',
                                    isChildActive
                                      ? 'text-zinc-950 dark:text-white'
                                      : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white',
                                  )}
                                />
                                <span className="truncate">{child.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
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

      {/* ── Main Content Container ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-premium-bg border-b border-zinc-200 dark:border-zinc-800 flex items-center px-6 gap-4 justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors rounded"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Menu className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {activeItem?.name || 'Platform Admin'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border border-zinc-700 dark:border-zinc-300">
              Platform Super Admin
            </span>
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
          </div>
        </header>

        {/* Page Main Content Area */}
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
              You are about to end your WITHUS Platform Admin session.
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
