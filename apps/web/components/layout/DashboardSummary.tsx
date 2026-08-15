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
      color: 'text-zinc-700',
      bg: 'bg-zinc-100/80 border border-zinc-200/50',
    },
    {
      label: 'Pending Approvals',
      value: pendingApprovals?.length ?? '—',
      icon: CheckSquare,
      href: '/approvals',
      color: pendingApprovals && pendingApprovals.length > 0 ? 'text-amber-600' : 'text-zinc-500',
      bg: pendingApprovals && pendingApprovals.length > 0 ? 'bg-amber-50 border border-amber-200/50' : 'bg-zinc-100/60 border border-zinc-200/30',
    },
    {
      label: 'Active Sessions',
      value: 
        (incomingSessions?.filter(s => s.status === 'ACTIVE').length ?? 0) + 
        (outgoingSessions?.filter(s => s.status === 'ACTIVE').length ?? 0),
      icon: Users,
      href: '/sessions',
      color: 'text-zinc-700',
      bg: 'bg-lime-400/20 border border-lime-300/40',
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
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            {greeting}, {user?.fullName?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Secure Delegated Access Platform — Manage repositories, credentials, and temporary access securely.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/extension"
            className="px-4 py-2.5 text-xs font-bold rounded-none bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 hover:text-black transition-all duration-200 inline-flex items-center justify-center shadow-sm"
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
            className="group premium-card p-6 hover:border-zinc-300 hover:shadow-md transition-all duration-200 bg-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-9 h-9 ${stat.bg} rounded-none flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight text-zinc-900">{stat.value}</p>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1.5">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Vaults */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Recent Vaults</h2>
          <Link href="/vaults" className="text-[10px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-widest">
            View all →
          </Link>
        </div>
        <div className="premium-card overflow-hidden shadow-none bg-white">
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
                  <tr className="border-b border-zinc-100 bg-zinc-50/50">
                    <th className="px-5 py-3 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Vault Name</th>
                    <th className="px-5 py-3 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Description</th>
                    <th className="px-5 py-3 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Created</th>
                    <th className="px-5 py-3 text-right text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100/60 bg-white">
                  {vaults.items.slice(0, 5).map((vault) => (
                    <tr 
                      key={vault.id}
                      className="hover:bg-zinc-50/40 transition-colors duration-150 group"
                    >
                      <td className="px-5 py-3.5 text-xs font-semibold text-zinc-900">
                        <Link href={`/vaults/${vault.id}`} className="flex items-center gap-3 hover:underline">
                          <div className="w-6 h-6 bg-zinc-50 border border-zinc-200/60 rounded-none flex items-center justify-center flex-shrink-0">
                            <Key className="w-3 h-3 text-zinc-400" />
                          </div>
                          <span className="truncate max-w-[150px] font-bold text-zinc-900">{vault.name}</span>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-zinc-500">
                        <span className="line-clamp-1 max-w-[250px]">{vault.description || 'No description'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                        {new Date(vault.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link 
                          href={`/vaults/${vault.id}`}
                          className="inline-flex items-center text-[10px] font-bold text-zinc-400 group-hover:text-zinc-900 transition-colors uppercase tracking-wider"
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

      {/* Quick Actions */}
      <div>
        <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Quick Actions</h2>
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
              className="flex items-center gap-4 p-5 bg-white premium-card hover:border-zinc-300 hover:shadow-sm transition-all duration-150 group shadow-none"
            >
              <div className="w-9 h-9 rounded-none bg-zinc-50 border border-zinc-200/60 flex items-center justify-center group-hover:bg-zinc-950 group-hover:border-zinc-950 transition-all duration-150">
                <action.icon className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-zinc-900 group-hover:text-zinc-950">{action.label}</span>
                <span className="block text-[9px] text-zinc-400 mt-0.5 leading-tight">{action.desc}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
