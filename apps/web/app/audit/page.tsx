'use client';

import React, { useState } from 'react';
import { useAuditEvents } from '../../hooks/useAudit';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AuditEventDto } from '@repo/types';
import { useAuth } from '../../lib/auth/AuthContext';

export default function AuditPage() {
  const { organization } = useAuth();
  const orgId = organization?.id || '';
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data, isLoading } = useAuditEvents(orgId, {
    action: actionFilter || undefined,
    actorId: actorFilter || undefined,
    page: String(page),
    limit: '20',
  });

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const resetFilters = () => {
    setActionFilter('');
    setActorFilter('');
    setPage(1);
  };

  return (
    <DashboardShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Audit Log</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Security and operational events across the organization.</p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-end shadow-sm">
          <div className="flex-1 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-605 dark:text-slate-400">Action</label>
            <input
              type="text"
              placeholder="e.g. secret.revealed"
              className="w-full px-3.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:ring-slate-100/10 dark:focus:border-slate-100 outline-none transition-all text-slate-950 dark:text-slate-50 text-xs"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-605 dark:text-slate-400">Actor ID</label>
            <input
              type="text"
              placeholder="User UUID"
              className="w-full px-3.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:ring-slate-100/10 dark:focus:border-slate-100 outline-none transition-all text-slate-950 dark:text-slate-50 text-xs"
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
            />
          </div>
          <div className="flex">
            <button
              onClick={() => setPage(1)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm"
            >
              Filter
            </button>
            <button
              onClick={resetFilters}
              className="ml-2 px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-xs transition-colors shadow-sm"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-150/40 dark:divide-slate-800/50">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                <tr>
                  <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                    Action
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                    Actor
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                    Resource
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-right text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                      Loading audit events...
                    </td>
                  </tr>
                ) : data?.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                      No audit events found.
                    </td>
                  </tr>
                ) : (
                  data?.data.map((event: AuditEventDto) => (
                    <React.Fragment key={event.id}>
                      <tr className="hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {new Date(event.createdAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 inline-flex text-[10px] leading-5 font-bold rounded-full bg-slate-100 dark:bg-slate-850 text-slate-800 dark:text-slate-350 border border-slate-200/40 dark:border-slate-750/30">
                            {event.action}
                          </span>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-900 dark:text-slate-100 font-medium">
                          <div className="font-semibold">{event.actorId || 'System'}</div>
                          {event.actor?.email && <div className="text-slate-400 dark:text-slate-500 text-[10px]">{event.actor.email}</div>}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {event.resourceType ? `${event.resourceType}: ${event.resourceId}` : 'N/A'}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-right text-xs font-semibold">
                          <button
                            onClick={() => toggleRow(event.id)}
                            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors focus:outline-none"
                          >
                            {expandedRow === event.id ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                          </button>
                        </td>
                      </tr>
                      {expandedRow === event.id && (
                        <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                          <td colSpan={5} className="px-5 py-3">
                            <div className="text-xs text-slate-700 dark:text-slate-300">
                              <h4 className="font-bold mb-2 uppercase tracking-wide text-[10px] text-slate-400">Metadata (v{event.eventVersion})</h4>
                              <pre className="bg-slate-950 text-emerald-400 border border-slate-950 dark:border-slate-900 p-3 rounded-lg overflow-x-auto text-[10px] leading-relaxed font-mono">
                                {JSON.stringify(event.metadata, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="bg-white dark:bg-slate-900 px-5 py-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
              <div className="flex-1 flex justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-350 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="text-xs text-slate-550 dark:text-slate-400 self-center font-medium">
                  Page <span className="font-bold text-slate-900 dark:text-slate-100">{page}</span> of <span className="font-bold text-slate-900 dark:text-slate-100">{data.totalPages}</span>
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="relative inline-flex items-center px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-350 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
