'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth/AuthContext';
import { useVaults } from '../../hooks/useVaults';
import { usePendingApprovals } from '../../hooks/useApprovals';
import { useIncomingSessions, useOutgoingSessions } from '../../hooks/useSessions';
import { Shield, Key, CheckSquare, Users, ArrowRight, Plus, Puzzle, Lock } from 'lucide-react';
import { formatDate } from '../../lib/formatters';
import { SupportCard } from '../common/SupportCard';

export function DashboardSummary() {
  const { user, organization } = useAuth();
  const orgId = organization?.id || '';

  const { data: vaults } = useVaults(orgId);
  const { data: pendingApprovals } = usePendingApprovals(orgId);
  const { data: incomingSessions } = useIncomingSessions(orgId);
  const { data: outgoingSessions } = useOutgoingSessions(orgId);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const activeSessionsCount = 
    (incomingSessions?.filter(s => s.status === 'ACTIVE').length ?? 0) + 
    (outgoingSessions?.filter(s => s.status === 'ACTIVE').length ?? 0);

  const stats = [
    {
      label: 'Vault Credentials',
      value: vaults?.items?.length ?? 0,
      subtext: `Across ${vaults?.items?.length ?? 0} vaults`,
      icon: Key,
      href: '/vaults',
      color: 'text-[#0071E3]',
      bg: 'bg-[#0071E3]/10',
      badge: 'PROTECTED',
      badgeStyle: 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20',
      isLive: false,
    },
    {
      label: 'Pending Approvals',
      value: pendingApprovals?.length ?? 0,
      subtext: (pendingApprovals && pendingApprovals.length > 0) ? 'Requires your attention' : 'All requests resolved',
      icon: CheckSquare,
      href: '/approvals',
      color: 'text-[#FF9500]',
      bg: 'bg-[#FF9500]/10',
      badge: pendingApprovals && pendingApprovals.length > 0 ? 'ATTENTION' : 'UP TO DATE',
      badgeStyle: pendingApprovals && pendingApprovals.length > 0 
        ? 'bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/20' 
        : 'bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#86868B] dark:text-[#8E8E93] border-[#E5E5EA] dark:border-[#38383A]',
      isLive: false,
    },
    {
      label: 'Active Sessions',
      value: activeSessionsCount,
      subtext: activeSessionsCount > 0 ? `${activeSessionsCount} platform connected` : 'No active sessions',
      icon: Users,
      href: '/sessions',
      color: 'text-[#34C759]',
      bg: 'bg-[#34C759]/10',
      badge: activeSessionsCount > 0 ? 'LIVE' : 'IDLE',
      badgeStyle: activeSessionsCount > 0 
        ? 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20' 
        : 'bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#86868B] dark:text-[#8E8E93] border-[#E5E5EA] dark:border-[#38383A]',
      isLive: activeSessionsCount > 0,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Apple Header Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93] uppercase tracking-wider mb-0.5">
            WORKSPACE: {user?.email || organization?.name || 'Workspace'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
            {greeting}, {user?.fullName || user?.email?.split('@')[0] || 'there'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#86868B] dark:text-[#8E8E93] mt-0.5 font-normal">
            Manage your credentials, vaults, and live delegated access sessions with zero raw exposure.
          </p>
        </div>

        {/* Apple Action Buttons */}
        <div className="flex gap-2.5 items-center flex-shrink-0">
          <Link
            href="/extension"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#D2D2D7] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] shadow-sm transition-colors"
          >
            <Puzzle className="w-3.5 h-3.5 text-[#0071E3]" />
            <span>Browser Extension</span>
          </Link>
          <Link
            href="/vaults"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Vault</span>
          </Link>
        </div>
      </div>

      {/* Apple Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-[#D2D2D7] dark:hover:border-[#38383A] transition-all block group"
          >
            <div className="flex items-center justify-between mb-3">
              {/* Apple System Icon + Label */}
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {stat.label}
                </span>
              </div>
              
              {/* Status Badge */}
              <div className="flex items-center gap-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium tracking-wide border ${stat.badgeStyle}`}>
                  {stat.isLive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                  )}
                  {stat.badge}
                </span>
                <ArrowRight className="w-3 h-3 text-[#AEAEB2] group-hover:text-[#1D1D1F] dark:group-hover:text-white transition-colors" />
              </div>
            </div>

            <p className="font-number text-3xl sm:text-4xl font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight leading-tight">
              {stat.value}
            </p>
            <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-1 font-normal">
              {stat.subtext}
            </p>
          </Link>
        ))}
      </div>

      {/* Recent Vaults Section */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#86868B]" />
            <h2 className="text-xs sm:text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              Recent Vaults
            </h2>
          </div>
          <Link
            href="/vaults"
            className="text-xs font-medium text-[#0071E3] hover:underline flex items-center gap-0.5"
          >
            <span>View all</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          {!vaults || vaults.items.length === 0 ? (
            <div className="py-12 px-6 text-center">
              {/* Clean Apple Neutral Empty State */}
              <div className="w-12 h-12 rounded-xl bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#86868B] dark:text-[#8E8E93] border border-[#E5E5EA] dark:border-[#38383A] flex items-center justify-center mx-auto mb-3">
                <Key className="w-5 h-5 text-[#86868B] dark:text-[#8E8E93]" />
              </div>

              <p className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                No vaults configured yet.
              </p>
              <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-1 max-w-sm mx-auto leading-relaxed">
                Create your first secure vault to organize credentials and grant controlled access to your team.
              </p>
              <div className="mt-4">
                <Link
                  href="/vaults"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Your First Vault</span>
                </Link>
              </div>
              <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[#86868B] dark:text-[#8E8E93]">
                <Lock className="w-3 h-3" />
                <span>Your credentials remain protected while collaborators receive scoped access.</span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E5EA] dark:border-[#2C2C2E] bg-[#F5F5F7]/60 dark:bg-[#2C2C2E]/40">
                    <th className="px-5 py-3 text-[10px] font-semibold text-[#86868B] uppercase tracking-wider">Vault Name</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-[#86868B] uppercase tracking-wider">Description</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-[#86868B] uppercase tracking-wider">Created Date</th>
                    <th className="px-5 py-3 text-right text-[10px] font-semibold text-[#86868B] uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5EA]/60 dark:divide-[#2C2C2E]/60">
                  {vaults.items.slice(0, 5).map((vault) => (
                    <tr 
                      key={vault.id}
                      className="hover:bg-[#F5F5F7]/50 dark:hover:bg-[#2C2C2E]/50 transition-colors group"
                    >
                      <td className="px-5 py-3.5 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                        <Link href={`/vaults/${vault.id}`} className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center flex-shrink-0">
                            <Key className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate max-w-[200px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-[#0071E3] transition-colors">
                            {vault.name}
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#86868B] dark:text-[#8E8E93]">
                        <span className="line-clamp-1 max-w-[280px]">{vault.description || 'No description provided'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#86868B] dark:text-[#8E8E93]">
                        {formatDate(vault.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link 
                          href={`/vaults/${vault.id}`}
                          className="text-xs font-medium text-[#0071E3] hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Apple Settings Style Quick Workspaces */}
      <div>
        <h2 className="text-xs sm:text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-2.5 px-0.5">
          Quick Workspaces
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            { 
              label: 'Manage Vaults', 
              href: '/vaults', 
              icon: Key, 
              desc: 'Store & rotate credentials', 
              color: 'text-[#0071E3]',
              bg: 'bg-[#0071E3]/10',
            },
            { 
              label: 'Active Sessions', 
              href: '/sessions', 
              icon: Users, 
              desc: 'View live delegate logins', 
              color: 'text-[#34C759]',
              bg: 'bg-[#34C759]/10',
            },
            { 
              label: 'Approvals', 
              href: '/approvals', 
              icon: CheckSquare, 
              desc: 'Review delegated requests', 
              color: 'text-[#FF9500]',
              bg: 'bg-[#FF9500]/10',
            },
            { 
              label: 'Organization Team', 
              href: '/settings/members', 
              icon: Shield, 
              desc: 'Manage role assignments', 
              color: 'text-[#AF52DE]',
              bg: 'bg-[#AF52DE]/10',
            },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-[#D2D2D7] dark:hover:border-[#38383A] transition-colors group"
            >
              <div className={`w-8 h-8 rounded-lg ${action.bg} ${action.color} flex items-center justify-center flex-shrink-0`}>
                <action.icon className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <span className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] truncate group-hover:text-[#0071E3] transition-colors">{action.label}</span>
                <span className="block text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-0.5 leading-tight truncate">{action.desc}</span>
              </div>
              <ArrowRight className="w-3 h-3 text-[#AEAEB2] group-hover:text-[#1D1D1F] dark:group-hover:text-white transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Support / Help Block */}
      <div>
        <SupportCard />
      </div>
    </div>
  );
}
