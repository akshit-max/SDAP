'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { superAdminApi } from '../../../lib/api/superadmin';
import { Search, ExternalLink, CheckCircle, XCircle, Loader2, Building2, Calendar, Filter, RotateCcw } from 'lucide-react';
import { formatDate } from '../../../lib/formatters';

export default function SuperAdminOrgsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [page, setPage] = useState(1);

  const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  useEffect(() => {
    setLoading(true);
    superAdminApi.getOrganizations({ page: 1, limit: 100, search: search || undefined })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [search]);

  // Client-side multi-filtering for instant responsiveness
  const filteredOrgs = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter((org: any) => {
      // Status filter
      if (statusFilter === 'ACTIVE' && !org.isActive) return false;
      if (statusFilter === 'INACTIVE' && org.isActive) return false;
      // New = registered in last 30 days
      if (statusFilter === 'NEW' && new Date(org.createdAt) < THIRTY_DAYS_AGO) return false;
      // High usage = 5+ delegated sessions
      if (statusFilter === 'HIGH_USAGE' && (org._count?.delegatedSessions ?? 0) < 5) return false;
      // Low usage = 0 delegated sessions
      if (statusFilter === 'LOW_USAGE' && (org._count?.delegatedSessions ?? 0) > 0) return false;

      // Date range filter
      if (fromDate) {
        const oDate = new Date(org.createdAt).getTime();
        const fDate = new Date(fromDate).getTime();
        if (oDate < fDate) return false;
      }
      if (toDate) {
        const oDate = new Date(org.createdAt).getTime();
        const tDate = new Date(toDate).getTime() + 86400000;
        if (oDate > tDate) return false;
      }

      return true;
    });
  }, [data, statusFilter, fromDate, toDate]);

  const LIMIT = 10;
  const totalFilteredPages = Math.max(1, Math.ceil(filteredOrgs.length / LIMIT));
  const paginatedOrgs = filteredOrgs.slice((page - 1) * LIMIT, page * LIMIT);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const isFiltered = search || statusFilter !== 'ALL' || fromDate || toDate;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Organizations</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">All registered organizations on the WITHUS platform.</p>
        </div>
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-number bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded border border-slate-200 dark:border-zinc-700">
          Showing <span className="font-bold text-slate-900 dark:text-slate-100">{filteredOrgs.length}</span> of <span className="font-bold text-slate-900 dark:text-slate-100">{data?.total ?? 0}</span> organizations
        </span>
      </div>

      {/* Structured & Consistent Multi-Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-4 shadow-sm space-y-4">
        {/* Row 1: Search & Status Dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Direct Search on Type */}
          <div className="relative md:col-span-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by organization name or owner email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-9 pl-9 pr-3 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 placeholder:text-slate-400"
            />
          </div>

          {/* Status Filter — includes derivable filters + billing Coming Soon note */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full h-9 px-3 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500"
            >
              <optgroup label="Status">
                <option value="ALL">All Organizations</option>
                <option value="ACTIVE">Active Organizations</option>
                <option value="INACTIVE">Inactive Organizations</option>
                <option value="NEW">New (Last 30 Days)</option>
              </optgroup>
              <optgroup label="Usage (from session data)">
                <option value="HIGH_USAGE">High Usage (5+ Sessions)</option>
                <option value="LOW_USAGE">Low Usage (0 Sessions)</option>
              </optgroup>
            </select>
          </div>

          {/* Reset Filters button */}
          <div className="md:col-span-1 flex items-center justify-end">
            {isFiltered ? (
              <button
                onClick={clearFilters}
                className="h-9 px-3 w-full text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center justify-center gap-1.5"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            ) : (
              <div className="h-9 px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 justify-center">
                <Filter className="w-3 h-3" /> Filtered
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Clean Date Range Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 min-w-fit">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter by Registration Date:</span>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                className="h-8 px-2 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                className="h-8 px-2 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500"
              />
            </div>
          </div>
        </div>

        {/* Billing-gated filters note */}
        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            <span className="font-bold text-amber-600 dark:text-amber-500">Coming Soon (Billing Required):</span>
            {' '}Free / Pro / Trial / Subscription Status filters will be available after payment gateway integration.
          </p>
        </div>
      </div>

      {/* Consistent Table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800">
            <thead className="bg-slate-50 dark:bg-zinc-800/50">
              <tr>
                <th scope="col" className="px-5 py-3 text-left text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Organization</th>
                <th scope="col" className="px-5 py-3 text-left text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Primary Owner</th>
                <th scope="col" className="px-5 py-3 text-center text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Members</th>
                <th scope="col" className="px-5 py-3 text-center text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Vaults</th>
                <th scope="col" className="px-5 py-3 text-center text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Sessions</th>
                <th scope="col" className="px-5 py-3 text-left text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-5 py-3 text-left text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Created Date</th>
                <th scope="col" className="px-5 py-3 text-right text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin text-slate-700 dark:text-slate-300" />
                    Loading organizations...
                  </td>
                </tr>
              ) : paginatedOrgs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                    No matching organizations found for the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedOrgs.map((org: any) => (
                  <tr key={org.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    {/* Organization Name */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-slate-100 dark:bg-zinc-800 flex items-center justify-center border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-slate-100">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{org.name}</span>
                      </div>
                    </td>

                    {/* Owner Email */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono font-medium text-slate-800 dark:text-slate-200">
                      {org.owner?.email ? (
                        <span>{org.owner.email}</span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100/70 dark:bg-zinc-800/70 border border-slate-200/80 dark:border-zinc-700/80 rounded">
                          No Primary Owner
                        </span>
                      )}
                    </td>

                    {/* Counts */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-bold text-slate-900 dark:text-slate-100 font-number text-center">
                      {org._count?.members ?? 0}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-bold text-slate-900 dark:text-slate-100 font-number text-center">
                      {org._count?.vaults ?? 0}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-bold text-slate-900 dark:text-slate-100 font-number text-center">
                      {org._count?.delegatedSessions ?? 0}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs">
                      {org.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <XCircle className="w-3 h-3 mr-1 text-rose-600 dark:text-rose-400" /> Inactive
                        </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-slate-800 dark:text-slate-200 font-number">
                      {formatDate(org.createdAt)}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs">
                      <Link
                        href={`/superadmin/organizations/${org.id}`}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" /> View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/30">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Page <span className="font-bold text-slate-900 dark:text-slate-100 font-number">{page}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-slate-100 font-number">{totalFilteredPages}</span>
            {' '}· <span className="font-bold text-slate-900 dark:text-slate-100 font-number">{filteredOrgs.length}</span> matching orgs
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={page >= totalFilteredPages}
              onClick={() => setPage(p => Math.min(totalFilteredPages, p + 1))}
              className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




