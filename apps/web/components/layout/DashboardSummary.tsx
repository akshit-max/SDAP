'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth/AuthContext';
import { useVaults } from '../../hooks/useVaults';
import { usePendingApprovals } from '../../hooks/useApprovals';
import { useIncomingSessions, useOutgoingSessions } from '../../hooks/useSessions';
import { Shield, Key, CheckSquare, Users, ArrowRight, Plus } from 'lucide-react';
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

  const stats = [
    {
      label: 'Vaults',
      value: vaults?.items?.length ?? '—',
      icon: Key,
      href: '/vaults',
      color: 'text-zinc-700 dark:text-zinc-200',
      bg: 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700',
    },
    {
      label: 'Pending Approvals',
      value: pendingApprovals?.length ?? '—',
      icon: CheckSquare,
      href: '/approvals',
      color: pendingApprovals && pendingApprovals.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-400',
      bg: pendingApprovals && pendingApprovals.length > 0 ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/30' : 'bg-zinc-100/60 dark:bg-zinc-800/40 border border-zinc-200/30 dark:border-zinc-700/30',
    },
    {
      label: 'Active Sessions',
      value: 
        (incomingSessions?.filter(s => s.status === 'ACTIVE').length ?? 0) + 
        (outgoingSessions?.filter(s => s.status === 'ACTIVE').length ?? 0),
      icon: Users,
      href: '/sessions',
      color: 'text-lime-700 dark:text-lime-400',
      bg: 'bg-lime-50 dark:bg-lime-950/30 border border-lime-200 dark:border-lime-900/30',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{organization?.name}</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            {greeting}, {user?.fullName?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Secure Delegated Access Platform — Manage repositories, credentials, and temporary access securely.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/extension"
            className="premium-button-secondary text-xs"
          >
            Browser Extension
          </Link>
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
            className="group premium-card p-6 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all duration-200 bg-white dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
            </div>
            <p className="font-number text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 pt-1 pb-0.5 leading-normal overflow-visible">{stat.value}</p>
            <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1.5">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Vaults */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Recent Vaults</h2>
          <Link href="/vaults" className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors uppercase tracking-widest">
            View all →
          </Link>
        </div>
        <div className="premium-card overflow-hidden shadow-none bg-white dark:bg-zinc-900">
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
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <th className="px-5 py-3 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Vault Name</th>
                    <th className="px-5 py-3 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Description</th>
                    <th className="px-5 py-3 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Created</th>
                    <th className="px-5 py-3 text-right text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100/60 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                  {vaults.items.slice(0, 5).map((vault) => (
                    <tr 
                      key={vault.id}
                      className="hover:bg-zinc-50/40 dark:hover:bg-zinc-850/40 transition-colors duration-150 group"
                    >
                      <td className="px-5 py-3.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        <Link href={`/vaults/${vault.id}`} className="flex items-center gap-3 hover:underline">
                          <div className="w-6 h-6 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800 rounded-md flex items-center justify-center flex-shrink-0">
                            <Key className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                          </div>
                          <span className="truncate max-w-[150px] font-bold text-zinc-900 dark:text-zinc-100">{vault.name}</span>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors">
                        <span className="line-clamp-1 max-w-[250px]">{vault.description || 'No description'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-[10px] text-zinc-400 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors font-bold uppercase tracking-wider">
                        {formatDate(vault.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link 
                          href={`/vaults/${vault.id}`}
                          className="inline-flex items-center text-[10px] font-bold text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors uppercase tracking-wider"
                        >
                          Open <ArrowRight className="w-3 h-3 ml-1.5 transition-transform group-hover:translate-x-0.5" />
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

      <div>
        <h2 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Manage Vaults', href: '/vaults', icon: Key, desc: 'View and create storage keys' },
            { label: 'Sessions', href: '/sessions', icon: Users, desc: 'Manage access allocations' },
            { label: 'Approvals', href: '/approvals', icon: CheckSquare, desc: 'Authorize request workflows' },
            { label: 'Team', href: '/settings/members', icon: Shield, desc: 'Manage team role access' },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-4 p-5 bg-white dark:bg-zinc-900 premium-card hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all duration-150 group shadow-none"
            >
              <div className="w-9 h-9 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-center group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800 group-hover:border-zinc-300 dark:group-hover:border-zinc-700 transition-all duration-150">
                <action.icon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-100 transition-colors" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-950 dark:group-hover:text-white">{action.label}</span>
                <span className="block text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-tight">{action.desc}</span>
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
