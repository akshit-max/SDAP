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
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-slate-900 dark:bg-slate-100 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white dark:text-slate-900" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{organization?.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {greeting}, {user?.fullName?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here's an overview of your workspace.
          </p>
        </div>
        <Link
          href="/vaults"
          className="flex items-center px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New Vault
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Vaults */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Recent Vaults</h2>
          <Link href="/vaults" className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            View all →
          </Link>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          {!vaults || vaults.items.length === 0 ? (
            <div className="p-8 text-center">
              <Key className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No vaults yet.</p>
              <Link href="/vaults" className="text-xs text-slate-900 dark:text-slate-100 font-semibold hover:underline mt-1 inline-block">
                Create your first vault →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {vaults.items.slice(0, 5).map((vault) => (
                <li key={vault.id}>
                  <Link
                    href={`/vaults/${vault.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                        <Key className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{vault.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{vault.description || 'No description'}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h2>
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
              className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all text-center group"
            >
              <action.icon className="w-5 h-5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
