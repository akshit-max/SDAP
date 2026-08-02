'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth/AuthContext';
import { useVaults } from '../../hooks/useVaults';
import { usePendingApprovals } from '../../hooks/useApprovals';
import { useIncomingSessions, useOutgoingSessions } from '../../hooks/useSessions';
import { Shield, Key, CheckSquare, Users, ArrowRight, Plus } from 'lucide-react';

export function DashboardSummary() {
  const { user, organization } = useAuth();
  const orgId = organization?.id || '';

  const { data: vaults } = useVaults(orgId);
  const { data: pendingApprovals } = usePendingApprovals(orgId);
  const { data: incomingSessions } = useIncomingSessions(orgId);
  const { data: outgoingSessions } = useOutgoingSessions(orgId);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const stats = [
    {
      label: 'Vaults',
      value: vaults?.items?.length ?? '—',
      icon: Key,
      href: '/vaults',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      label: 'Pending Approvals',
      value: pendingApprovals?.length ?? '—',
      icon: CheckSquare,
      href: '/approvals',
      color: pendingApprovals && pendingApprovals.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400',
      bg: pendingApprovals && pendingApprovals.length > 0 ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-slate-100 dark:bg-slate-800',
    },
    {
      label: 'Active Sessions',
      value: 
        (incomingSessions?.filter(s => s.status === 'ACTIVE').length ?? 0) + 
        (outgoingSessions?.filter(s => s.status === 'ACTIVE').length ?? 0),
      icon: Users,
      href: '/sessions',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-premium-muted uppercase tracking-wider">{organization?.name}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-premium-main">
            {greeting}, {user?.fullName?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-xs text-premium-muted mt-1">
            Secure Delegated Access Platform — Manage repositories, credentials, and temporary access securely.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/downloads/WITHUS-Extension.zip"
            download
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-zinc-50 border border-zinc-800 hover:bg-zinc-800/80 hover:text-white transition-all duration-200 inline-flex items-center justify-center dark:bg-zinc-800/40 dark:text-zinc-50 dark:border-zinc-700/60 dark:hover:bg-zinc-800/80 shadow-sm"
          >
            Download Extension
          </a>
          <Link
            href="/vaults"
            className="premium-button-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Vault
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group premium-card p-5 hover:border-premium shadow-none transition-all duration-150"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-premium-main transition-colors" />
            </div>
            <p className="text-xl font-bold text-premium-main">{stat.value}</p>
            <p className="text-[10px] font-bold text-premium-muted uppercase tracking-wider mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Vaults */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-bold text-premium-muted uppercase tracking-wider">Recent Vaults</h2>
          <Link href="/vaults" className="text-[10px] font-bold text-premium-muted hover:text-premium-main transition-colors uppercase tracking-wider">
            View all →
          </Link>
        </div>
        <div className="premium-card overflow-hidden shadow-none">
          {!vaults || vaults.items.length === 0 ? (
            <div className="p-8 text-center bg-premium-surface">
              <Key className="w-6 h-6 text-premium-muted mx-auto mb-2" />
              <p className="text-xs text-premium-muted">No vaults yet.</p>
              <Link href="/vaults" className="text-xs text-premium-main font-semibold hover:underline mt-1.5 inline-block">
                Create your first vault
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-premium bg-slate-50/20 dark:bg-zinc-900/10">
                    <th className="px-5 py-2.5 text-[10px] font-bold text-premium-muted uppercase tracking-wider">Vault Name</th>
                    <th className="px-5 py-2.5 text-[10px] font-bold text-premium-muted uppercase tracking-wider">Description</th>
                    <th className="px-5 py-2.5 text-[10px] font-bold text-premium-muted uppercase tracking-wider">Created</th>
                    <th className="px-5 py-2.5 text-right text-[10px] font-bold text-premium-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 bg-premium-surface">
                  {vaults.items.slice(0, 5).map((vault) => (
                    <tr 
                      key={vault.id}
                      className="hover:bg-slate-50/30 dark:hover:bg-zinc-900/10 transition-colors duration-150 group"
                    >
                      <td className="px-5 py-3 text-xs font-bold text-premium-main">
                        <Link href={`/vaults/${vault.id}`} className="flex items-center gap-2.5 hover:underline">
                          <div className="w-5 h-5 bg-slate-100 dark:bg-zinc-800 rounded flex items-center justify-center flex-shrink-0">
                            <Key className="w-2.5 h-2.5 text-premium-muted" />
                          </div>
                          <span className="truncate max-w-[150px]">{vault.name}</span>
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-xs text-premium-muted">
                        <span className="line-clamp-1 max-w-[250px]">{vault.description || 'No description'}</span>
                      </td>
                      <td className="px-5 py-3 text-[10px] text-premium-muted font-bold uppercase tracking-wider">
                        {new Date(vault.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link 
                          href={`/vaults/${vault.id}`}
                          className="inline-flex items-center text-[10px] font-bold text-premium-muted group-hover:text-premium-main transition-colors uppercase tracking-wider"
                        >
                          Open <ArrowRight className="w-3 h-3 ml-1" />
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

      {/* Quick Actions */}
      <div>
        <h2 className="text-[10px] font-bold text-premium-muted uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Manage Vaults', href: '/vaults', icon: Key },
            { label: 'Sessions', href: '/sessions', icon: Users },
            { label: 'Approvals', href: '/approvals', icon: CheckSquare },
            { label: 'Team', href: '/settings/members', icon: Shield },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center justify-center gap-2 p-4 premium-card hover:border-premium hover:bg-slate-50/50 dark:hover:bg-zinc-900/20 transition-all duration-150 text-center group shadow-none"
            >
              <action.icon className="w-4 h-4 text-premium-muted group-hover:text-premium-main transition-colors" />
              <span className="text-[11px] font-semibold text-premium-muted group-hover:text-premium-main transition-colors">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
