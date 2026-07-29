'use client';

import React, { useState } from 'react';
import { useAuditEvents } from '../../hooks/useAudit';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AuditEventDto } from '@repo/types';

const ORG_ID = 'org-1'; // Hardcoded for foundation sprint

export default function AuditPage() {
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data, isLoading } = useAuditEvents(ORG_ID, {
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
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="mt-1 text-sm text-gray-500">Security and operational events across the organization.</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-md shadow border border-gray-200 flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <input
              type="text"
              placeholder="e.g. secret.revealed"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Actor ID</label>
            <input
              type="text"
              placeholder="User UUID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
            />
          </div>
          <div>
            <button
              onClick={() => setPage(1)} // Re-trigger query naturally happens due to state change, but resetting page ensures we go to page 1
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Filter
            </button>
            <button
              onClick={resetFilters}
              className="ml-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                      Loading audit events...
                    </td>
                  </tr>
                ) : data?.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                      No audit events found.
                    </td>
                  </tr>
                ) : (
                  data?.data.map((event: AuditEventDto) => (
                    <React.Fragment key={event.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(event.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {event.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="font-medium">{event.actorId || 'System'}</div>
                          {event.actor?.email && <div className="text-gray-500 text-xs">{event.actor.email}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {event.resourceType ? `${event.resourceType}: ${event.resourceId}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => toggleRow(event.id)}
                            className="text-blue-600 hover:text-blue-900 focus:outline-none"
                          >
                            {expandedRow === event.id ? <ChevronUp className="h-5 w-5 ml-auto" /> : <ChevronDown className="h-5 w-5 ml-auto" />}
                          </button>
                        </td>
                      </tr>
                      {expandedRow === event.id && (
                        <tr className="bg-gray-50">
                          <td colSpan={5} className="px-6 py-4">
                            <div className="text-sm text-gray-700">
                              <h4 className="font-semibold mb-2">Metadata (v{event.eventVersion})</h4>
                              <pre className="bg-gray-800 text-green-400 p-4 rounded-md overflow-x-auto text-xs">
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
            <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
              <div className="flex-1 flex justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="text-sm text-gray-500 self-center">
                  Page <span className="font-medium">{page}</span> of <span className="font-medium">{data.totalPages}</span>
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
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
