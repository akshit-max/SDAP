'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth/AuthContext';
import { useVaults } from '../../hooks/useVaults';
import { usePendingApprovals } from '../../hooks/useApprovals';
import { useIncomingSessions, useOutgoingSessions } from '../../hooks/useSessions';
import { Shield, Key, CheckSquare, Users, ArrowRight, Plus, Puzzle, Activity, Lock } from 'lucide-react';
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
      value: vaults?.items?.length ?? '—',
      icon: Key,
      href: '/vaults',
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-500/15 border border-sky-200/60 dark:border-sky-400/30',
      badge: 'Protected',
    },
    {
      label: 'Pending Approvals',
      value: pendingApprovals?.length ?? '—',
      icon: CheckSquare,
      href: '/approvals',
      color: pendingApprovals && pendingApprovals.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-400',
      bg: pendingApprovals && pendingApprovals.length > 0 ? 'bg-amber-50 dark:bg-amber-500/15 border border-amber-200/60 dark:border-amber-400/30' : 'bg-zinc-100 dark:bg-white/[0.08] border border-zinc-200/60 dark:border-white/10',
      badge: pendingApprovals && pendingApprovals.length > 0 ? 'Action required' : 'Up to date',
    },
    {
      label: 'Active Sessions',
      value: activeSessionsCount,
      icon: Users,
      href: '/sessions',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/60 dark:border-emerald-400/30',
      badge: activeSessionsCount > 0 ? 'Live handoff' : 'Idle',
      isLive: activeSessionsCount > 0,
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-[1.5px] bg-sky-500" />
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
              {organization?.name || 'Workspace'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {greeting}, {user?.fullName?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-xl font-normal leading-relaxed">
            Manage your credentials, vaults, and live delegated access sessions with zero raw exposure.
          </p>
        </div>

        <div className="flex gap-2.5 flex-wrap sm:flex-nowrap">
          <Link
            href="/extension"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-zinc-300 dark:border-white/20 bg-white/80 dark:bg-white/[0.08] hover:bg-white dark:hover:bg-white/[0.15] text-xs font-semibold text-zinc-900 dark:text-white backdrop-blur-md transition-all shadow-sm active:scale-[0.99]"
          >
            <Puzzle className="w-3.5 h-3.5 text-sky-500" />
            <span>Browser Extension</span>
          </Link>
          <Link
            href="/vaults"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold transition-all shadow-sm active:scale-[0.99]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Vault</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-[28px] p-6 bg-white/80 dark:bg-white/[0.06] backdrop-blur-xl border border-zinc-200/80 dark:border-white/15 shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] hover:border-zinc-300 dark:hover:border-white/30 hover:scale-[1.01] transition-all duration-200 block"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 ${stat.bg} rounded-2xl flex items-center justify-center shadow-sm`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-white/10">
                  {stat.isLive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  {stat.badge}
                </span>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>

            <p className="font-number text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {stat.value}
            </p>
            <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest mt-2">
              {stat.label}
            </p>
          </Link>
        ))}
      </div>

      {/* Recent Vaults Table */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-zinc-400" />
            <h2 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
              Recent Vaults
            </h2>
          </div>
          <Link
            href="/vaults"
            className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="rounded-[28px] bg-white/80 dark:bg-white/[0.06] backdrop-blur-xl border border-zinc-200/80 dark:border-white/15 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)]">
          {!vaults || vaults.items.length === 0 ? (
            <div className="p-12 text-center">
              <Key className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
              <p className="text-sm font-bold text-zinc-900 dark:text-white">No vaults configured yet.</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                Create a vault to start delegating scoped credentials to team members without raw password exposure.
              </p>
              <Link
                href="/vaults"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Vault</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-white/10 bg-zinc-50/60 dark:bg-white/[0.03]">
                    <th className="px-6 py-3.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">Vault Name</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">Description</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">Created Date</th>
                    <th className="px-6 py-3.5 text-right text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                  {vaults.items.slice(0, 5).map((vault) => (
                    <tr 
                      key={vault.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-white/[0.04] transition-colors duration-150 group"
                    >
                      <td className="px-6 py-4 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        <Link href={`/vaults/${vault.id}`} className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-zinc-100 dark:bg-white/[0.08] border border-zinc-200/80 dark:border-white/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                            <Key className="w-3.5 h-3.5 text-sky-500" />
                          </div>
                          <span className="truncate max-w-[180px] font-bold text-zinc-900 dark:text-white group-hover:underline">
                            {vault.name}
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-600 dark:text-zinc-400">
                        <span className="line-clamp-1 max-w-[280px]">{vault.description || 'No description provided'}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        {formatDate(vault.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/vaults/${vault.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
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

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3 px-1">
          Quick Workspaces
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Manage Vaults', href: '/vaults', icon: Key, desc: 'Store & rotate credentials', accent: 'text-sky-500' },
            { label: 'Active Sessions', href: '/sessions', icon: Users, desc: 'View live delegate logins', accent: 'text-emerald-500' },
            { label: 'Approvals', href: '/approvals', icon: CheckSquare, desc: 'Review delegated requests', accent: 'text-amber-500' },
            { label: 'Organization Team', href: '/settings/members', icon: Shield, desc: 'Manage role assignments', accent: 'text-purple-500' },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-4 p-5 rounded-[24px] bg-white/80 dark:bg-white/[0.06] backdrop-blur-xl border border-zinc-200/80 dark:border-white/15 hover:border-zinc-300 dark:hover:border-white/30 hover:scale-[1.01] transition-all duration-200 group shadow-sm"
            >
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-white/[0.08] border border-zinc-200/80 dark:border-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <action.icon className={`w-4 h-4 ${action.accent}`} />
              </div>
              <div className="text-left min-w-0">
                <span className="block text-xs font-bold text-zinc-900 dark:text-white truncate">{action.label}</span>
                <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight truncate">{action.desc}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Support / Help Block */}
      <div className="pt-2">
        <SupportCard />
      </div>
    </div>
  );
}
