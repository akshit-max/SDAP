'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { superAdminApi } from '../../../lib/api/superadmin';
import { Search, CheckCircle, XCircle, Shield, Loader2, User, Calendar, Filter, RotateCcw, Activity, Clock } from 'lucide-react';
import { formatDate } from '../../../lib/formatters';


export default function SuperAdminUsersPage() {
  const searchParams = useSearchParams();
  const isActivityTab = searchParams?.get('tab') === 'activity';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [page, setPage] = useState(1);

  // Activity tab: load audit events
  const [activityData, setActivityData] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(1);

  useEffect(() => {
    if (isActivityTab) {
      setActivityLoading(true);
      superAdminApi.getGlobalAudit({ page: 1, limit: 100 })
        .then((res) => setActivityData(res.data?.data || []))
        .finally(() => setActivityLoading(false));
      return;
    }
    setLoading(true);
    superAdminApi.getUsers({ page: 1, limit: 100, search: search || undefined })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [search, isActivityTab]);

  // Client-side filtering for high responsiveness
  const filteredUsers = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter((u: any) => {
      // Status filter
      if (statusFilter === 'ACTIVE' && !u.isActive) return false;
      if (statusFilter === 'INACTIVE' && u.isActive) return false;

      // Role filter
      const primaryRole = u.organizationMemberships?.[0]?.role || 'NONE';
      if (roleFilter !== 'ALL' && primaryRole !== roleFilter) return false;

      // Date range filter
      if (fromDate) {
        const uDate = new Date(u.createdAt).getTime();
        const fDate = new Date(fromDate).getTime();
        if (uDate < fDate) return false;
      }
      if (toDate) {
        const uDate = new Date(u.createdAt).getTime();
        const tDate = new Date(toDate).getTime() + 86400000;
        if (uDate > tDate) return false;
      }

      return true;
    });
  }, [data, statusFilter, roleFilter, fromDate, toDate]);

  const LIMIT = 10;
  const totalFilteredPages = Math.max(1, Math.ceil(filteredUsers.length / LIMIT));
  const paginatedUsers = filteredUsers.slice((page - 1) * LIMIT, page * LIMIT);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setRoleFilter('ALL');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const isFiltered = search || statusFilter !== 'ALL' || roleFilter !== 'ALL' || fromDate || toDate;

  // ── Activity Tab early return ─────────────────────────────────────────────
  if (isActivityTab) {
    const ACTIVITY_LIMIT = 10;
    const totalActivityPages = Math.max(1, Math.ceil(activityData.length / ACTIVITY_LIMIT));
    const paginatedActivity = activityData.slice((activityPage - 1) * ACTIVITY_LIMIT, activityPage * ACTIVITY_LIMIT);

    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="pb-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5" /> User Activity
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Recent actions performed by users across all organisations.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-number bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded border border-slate-200 dark:border-zinc-700">
            Total {activityData.length} activity events
          </span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
          {activityLoading ? (
            <div className="px-5 py-12 text-center">
              <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin text-slate-700 dark:text-slate-300" />
              <p className="text-xs text-slate-500">Loading activity...</p>
            </div>
          ) : activityData.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-slate-400" />
              <p className="text-xs text-slate-500">No recent user activity found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800">
                  <thead className="bg-slate-50 dark:bg-zinc-800/50">
                    <tr>
                      {['Action', 'Actor Email', 'Organisation', 'Resource', 'Timestamp'].map((h, i) => (
                        <th key={h} scope="col" className={`px-5 py-3 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                    {paginatedActivity.map((e: any) => (
                      <tr key={e.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono font-bold text-slate-900 dark:text-slate-100">{e.action}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono text-slate-800 dark:text-slate-200">
                          {e.actor?.email ?? <span className="text-slate-400">System</span>}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">
                          {e.organization?.name ?? <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">
                          {e.resourceType ?? <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-800 dark:text-slate-200 text-right font-number">{formatDate(e.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination Controls */}
              <div className="px-5 py-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/30">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Page <span className="font-bold text-slate-900 dark:text-slate-100 font-number">{activityPage}</span> of{' '}
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-number">{totalActivityPages}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={activityPage <= 1}
                    onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={activityPage >= totalActivityPages}
                    onClick={() => setActivityPage(p => Math.min(totalActivityPages, p + 1))}
                    className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Platform Users</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">All registered user accounts across the WITHUS platform.</p>
        </div>
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-number bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded border border-slate-200 dark:border-zinc-700">
          Showing <span className="font-bold text-slate-900 dark:text-slate-100">{filteredUsers.length}</span> of <span className="font-bold text-slate-900 dark:text-slate-100">{data?.total ?? 0}</span> users
        </span>
      </div>

      {/* Structured & Consistent Multi-Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-4 shadow-sm space-y-4">
        {/* Row 1: Search & Dropdown Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Direct Search on Type */}
          <div className="relative md:col-span-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email address..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-9 pl-9 pr-3 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 placeholder:text-slate-400"
            />
          </div>

          {/* Account Status Filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full h-9 px-3 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500"
            >
              <option value="ALL">All Account Statuses</option>
              <option value="ACTIVE">Active Accounts Only</option>
              <option value="INACTIVE">Inactive Accounts Only</option>
            </select>
          </div>

          {/* Org Role Filter */}
          <div className="md:col-span-3">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="w-full h-9 px-3 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500"
            >
              <option value="ALL">All Org Roles</option>
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
              <option value="NONE">Unassigned / Personal</option>
            </select>
          </div>

          {/* Filter Status Badge / Reset Button */}
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
            <span>Filter by Joined Date:</span>
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
      </div>

      {/* Consistent Table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800">
            <thead className="bg-slate-50 dark:bg-zinc-800/50">
              <tr>
                <th scope="col" className="px-5 py-3 text-left text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">User Name</th>
                <th scope="col" className="px-5 py-3 text-left text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Email Address</th>
                <th scope="col" className="px-5 py-3 text-left text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Organization</th>
                <th scope="col" className="px-5 py-3 text-left text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Org Role</th>
                <th scope="col" className="px-5 py-3 text-left text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Account Status</th>
                <th scope="col" className="px-5 py-3 text-left text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Last Login</th>
                <th scope="col" className="px-5 py-3 text-left text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Joined Date</th>
                <th scope="col" className="px-5 py-3 text-right text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Platform Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin text-slate-700 dark:text-slate-300" />
                    Loading platform users...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                    No matching users found for the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user: any) => {
                  const role = user.organizationMemberships?.[0]?.role;
                  const orgName = user.organizationMemberships?.[0]?.organization?.name;
                  const displayName = user.fullName || user.email.split('@')[0];
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                      {/* User Name */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-slate-100 text-xs font-bold">
                            {displayName[0]?.toUpperCase() || <User className="w-3.5 h-3.5" />}
                          </div>
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{user.fullName || displayName}</span>
                        </div>
                      </td>

                      {/* Email Address */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono font-medium text-slate-800 dark:text-slate-200">
                        {user.email}
                      </td>

                      {/* Organization */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs">
                        {orgName ? (
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{orgName}</span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100/70 dark:bg-zinc-800/70 border border-slate-200/80 dark:border-zinc-700/80 rounded">
                            Personal Account
                          </span>
                        )}
                      </td>

                      {/* Org Role */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs">
                        {role ? (
                          <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-zinc-700 rounded">
                            {role}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100/70 dark:bg-zinc-800/70 border border-slate-200/80 dark:border-zinc-700/80 rounded">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Account Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs">
                        {user.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <XCircle className="w-3 h-3 mr-1 text-rose-600 dark:text-rose-400" /> Inactive
                          </span>
                        )}
                      </td>

                      {/* Last Login */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-slate-800 dark:text-slate-200 font-number">
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : (
                          <span className="text-slate-400 dark:text-slate-500 italic text-[10px]">Never</span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-slate-800 dark:text-slate-200 font-number">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Platform Access */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs">
                        {user.isSuperAdmin ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border border-zinc-900 dark:border-zinc-100">
                            <Shield className="w-3 h-3 mr-1" /> Super Admin
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100/70 dark:bg-zinc-800/70 border border-slate-200/80 dark:border-zinc-700/80 rounded">
                            Standard User
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/30">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Page <span className="font-bold text-slate-900 dark:text-slate-100 font-number">{page}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-slate-100 font-number">{totalFilteredPages}</span>
            {' '}· <span className="font-bold text-slate-900 dark:text-slate-100 font-number">{filteredUsers.length}</span> matching users
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




