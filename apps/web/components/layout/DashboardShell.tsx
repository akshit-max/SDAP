'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { AuthSession } from '../../lib/auth/session';
import { useAuth } from '../../lib/auth/AuthContext';
import { usePendingApprovals, useMyRequests } from '../../hooks/useApprovals';
import { Shield, LayoutDashboard, Key, LogOut, Users, CheckSquare, FileText, Settings, Plug2, Puzzle, Activity } from 'lucide-react';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { refreshContext, organization, user } = useAuth();
  
  const orgId = organization?.id || '';
  const { data: pendingApprovals } = usePendingApprovals(orgId);
  const { data: myRequests } = useMyRequests(orgId);

  const isAdmin = organization?.role === 'ADMIN' || organization?.role === 'OWNER';
  let approvalBadgeCount = 0;
  if (isAdmin) {
    approvalBadgeCount = pendingApprovals?.filter((r: any) => r.requesterId !== user?.id)?.length || 0;
  } else {
    approvalBadgeCount = myRequests?.filter((r: any) => r.status === 'PENDING')?.length || 0;
  }
  
  const LogoSVG = () => (
    <div className="w-7 h-7 flex items-center justify-center rounded-xl bg-zinc-950 border border-zinc-800 shadow-sm flex-shrink-0 select-none p-1.5">
      <img src="/logo.png" alt="WithUs" className="w-full h-full object-contain" />
    </div>
  );
  
  // Persist sidebar state in localStorage if possible, or just default to false
  const [isCollapsed, setIsCollapsed] = useState(false);
 
  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === 'true') setIsCollapsed(true);
  }, []);
 
  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar_collapsed', String(nextState));
  };
 
  const handleLogout = async () => {
    try {
      const { apiClient } = await import('../../lib/api/client');
      await apiClient.post('/auth/logout', {});
    } catch {
      // Ignore errors if backend fails or session is already dead
    } finally {
      AuthSession.clear();
      refreshContext();
      router.push('/login');
    }
  };
 
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Vaults', href: '/vaults', icon: Key },
    { name: 'Sessions', href: '/sessions', icon: Users },
    { name: 'Activity', href: '/activity', icon: Activity },
    { name: 'Approvals', href: '/approvals', icon: CheckSquare },
    { name: 'Browser Extension', href: '/extension', icon: Puzzle },
    { name: 'Integrations', href: '/settings/integrations', icon: Plug2 },
    { name: 'Audit Log', href: '/audit', icon: FileText },
    { name: 'Team', href: '/settings/members', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];
 
  return (
    <div className="flex h-screen bg-premium-bg font-premium">
      {/* Sidebar */}
      <div 
        className={clsx(
          "bg-[#f4f4f6] border-r border-premium flex flex-col transition-all duration-150",
          isCollapsed ? "w-16" : "w-60"
        )}
      >
        <div className={clsx(
          "h-14 flex items-center border-b border-premium gap-2.5",
          isCollapsed ? "justify-center px-0" : "px-4"
        )}>
          <LogoSVG />
          {!isCollapsed && (
            <span className="font-bold text-sm tracking-tight text-premium-main">WithUs</span>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 overflow-x-hidden">
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              // Exact match for /settings so it doesn't highlight when on /settings/members
              const isActive = item.href === '/settings' ? pathname === '/settings' : pathname.startsWith(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={clsx(
                    'relative flex items-center py-2.5 text-[11px] font-bold rounded-xl transition-all duration-150',
                    isCollapsed ? 'justify-center px-0' : 'px-3',
                    isActive
                      ? 'bg-[var(--accent-lime)] text-[var(--accent-lime-text)] shadow-sm'
                      : 'text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-900'
                  )}
                >
                  <item.icon
                    className={clsx(
                      'w-4 h-4 flex-shrink-0 transition-colors',
                      !isCollapsed && 'mr-3',
                      isActive ? 'text-[var(--accent-lime-text)]' : 'text-zinc-400'
                    )}
                  />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                  
                  {item.name === 'Approvals' && approvalBadgeCount > 0 && (
                    <span className={clsx(
                      "inline-flex items-center justify-center font-bold text-white bg-red-500 rounded-full",
                      isCollapsed ? "absolute top-1 right-1.5 w-2 h-2" : "ml-auto px-1.5 min-w-[1.25rem] h-4 text-[9px]"
                    )}>
                      {isCollapsed ? '' : approvalBadgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
 
        <div className="p-3 border-t border-premium flex flex-col gap-1">
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Logout" : undefined}
            className={clsx(
              "flex items-center justify-center py-2.5 text-[11px] font-bold rounded-xl transition-all duration-150 text-zinc-500 hover:text-red-600 hover:bg-red-50/50 border border-transparent hover:border-red-100",
              isCollapsed ? "w-10 h-10 mx-auto" : "px-3 w-full"
            )}
          >
            <LogOut className={clsx("w-3.5 h-3.5 flex-shrink-0", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span className="truncate">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-premium-surface border-b border-premium flex items-center px-8 shadow-none gap-4">
          <button 
            onClick={toggleSidebar} 
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-semibold text-premium-main">
            {navItems.find((item) => {
              return item.href === '/settings' ? pathname === '/settings' : pathname.startsWith(item.href);
            })?.name || 'Vaults'}
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-8 bg-premium-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
