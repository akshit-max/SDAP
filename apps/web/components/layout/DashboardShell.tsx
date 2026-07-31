'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { AuthSession } from '../../lib/auth/session';
import { useAuth } from '../../lib/auth/AuthContext';
import { Shield, LayoutDashboard, Key, LogOut, Users, CheckSquare, FileText, Settings, Plug2, KeyRound } from 'lucide-react';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { refreshContext } = useAuth();
  
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
    { name: 'Approvals', href: '/approvals', icon: CheckSquare },
    { name: 'Integrations', href: '/settings/integrations', icon: Plug2 },
    { name: 'API Keys', href: '/settings/api-keys', icon: KeyRound },
    { name: 'Audit Log', href: '/audit', icon: FileText },
    { name: 'Team', href: '/settings/members', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <div 
        className={clsx(
          "bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col transition-all duration-300",
          isCollapsed ? "w-16" : "w-60"
        )}
      >
        <div className={clsx(
          "h-14 flex items-center border-b border-slate-200/80 dark:border-slate-800",
          isCollapsed ? "justify-center px-0" : "px-5"
        )}>
          <Shield className={clsx("w-5 h-5 text-slate-900 dark:text-slate-100 flex-shrink-0", !isCollapsed && "mr-2")} />
          {!isCollapsed && (
            <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-slate-100 truncate">WITHUS Vault</span>
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
                    'flex items-center py-2 text-xs font-semibold rounded-lg transition-all duration-150',
                    isCollapsed ? 'justify-center px-0' : 'px-3',
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <item.icon
                    className={clsx(
                      'w-4 h-4 flex-shrink-0 transition-colors',
                      !isCollapsed && 'mr-3',
                      isActive ? 'text-white dark:text-slate-950' : 'text-slate-400 dark:text-slate-500'
                    )}
                  />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-col gap-1">
          <button
            onClick={toggleSidebar}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={clsx(
              "flex items-center py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
              isCollapsed ? "justify-center px-0" : "px-3"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-3 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                <span className="truncate">Collapse</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Logout" : undefined}
            className={clsx(
              "flex items-center py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
              isCollapsed ? "justify-center px-0" : "px-3"
            )}
          >
            <LogOut className={clsx("w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0", !isCollapsed && "mr-3")} />
            {!isCollapsed && <span className="truncate">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-3">
            {isCollapsed && (
              <button onClick={toggleSidebar} className="lg:hidden p-1 -ml-3 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {navItems.find((item) => {
                return item.href === '/settings' ? pathname === '/settings' : pathname.startsWith(item.href);
              })?.name || 'Vaults'}
            </h1>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
