'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { usePresence } from '../../hooks/usePresence';
import { useOrgMembers } from '../../hooks/useOrganization';
import { useAuth } from '../../lib/auth/AuthContext';
import { 
  Activity, 
  Users, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal, 
  Globe, 
  CircleDot, 
  ArrowUpDown,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PresenceRecord } from '../../lib/api/presence';

// Presence is considered active within this window (mirrors backend: 90 seconds)
const ACTIVE_WINDOW_MS = 90_000;
const ITEMS_PER_PAGE = 10;

/** Format seconds → "8 sec ago", "1 min ago", "2 hr ago" */
function timeAgo(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s} sec ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return `${h} hr ago`;
}

interface GroupedMember {
  userId: string;
  name: string;
  email: string;
  platforms: (PresenceRecord & { status: 'ACTIVE' | 'RECENTLY_ACTIVE' | 'OFFLINE'; lastSeenMs: number })[];
  isActive: boolean;
  mostRecentLastSeenAt: number;
}

export default function ActivityPage() {
  const { organization } = useAuth();
  const router = useRouter();
  const orgId = organization?.id ?? null;
  const isAdmin =
    organization?.role === 'OWNER' || organization?.role === 'ADMIN';

  // ─── Real-time tick ─────────────────────────────────────────────────────────
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Non-admin members get bounced — presence is admin/owner only
  useEffect(() => {
    if (organization && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [organization, isAdmin, router]);

  // Fetch all organization members to show members without presence history
  const { data: orgMembers, isLoading: isLoadingMembers } = useOrgMembers(orgId || '');
  const { presenceMap, isLoading: isLoadingPresence } = usePresence(orgId, isAdmin);

  // ─── UI & Filter States ─────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState<'lastActive' | 'name' | 'platforms'>('lastActive');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});

  // Reset pagination when search/filter updates
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedPlatform, selectedStatus, sortBy]);

  // Toggle expanded users
  const toggleExpand = (userId: string) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Collect unique platforms for the filter dropdown
  const allUniquePlatforms = useMemo(() => {
    const platforms = new Set<string>();
    presenceMap.forEach(records => {
      records.forEach(r => platforms.add(r.platform));
    });
    return Array.from(platforms).sort();
  }, [presenceMap]);

  // Combine Org Members & Presence data
  const computedMembers = useMemo(() => {
    if (!orgMembers) return [];

    return orgMembers.map(member => {
      const userId = member.user.id;
      const records = presenceMap.get(userId) || [];

      // Map presence records to their individual statuses and relative times
      const platforms = records.map(r => {
        const lastSeenMs = now - new Date(r.lastSeenAt).getTime();
        let status: 'ACTIVE' | 'RECENTLY_ACTIVE' | 'OFFLINE' = 'OFFLINE';
        if (lastSeenMs <= 45_000) {
          status = 'ACTIVE';
        } else if (lastSeenMs <= 90_000) {
          status = 'RECENTLY_ACTIVE';
        }

        return {
          ...r,
          lastSeenMs,
          status
        };
      }).sort((a, b) => a.lastSeenMs - b.lastSeenMs);

      // User is active if they have at least one active/recently active platform
      const isActive = platforms.some(p => p.status === 'ACTIVE' || p.status === 'RECENTLY_ACTIVE');

      const mostRecentLastSeenAt = platforms.length > 0
        ? Math.max(...platforms.map(p => new Date(p.lastSeenAt).getTime()))
        : 0;

      return {
        userId,
        name: member.user.fullName || 'Unknown User',
        email: member.user.email,
        platforms,
        isActive,
        mostRecentLastSeenAt
      };
    });
  }, [orgMembers, presenceMap, now]);

  // Filter members based on Search Query, Platform, and Status
  const filteredMembers = useMemo(() => {
    return computedMembers
      .map(member => {
        let filteredPlatforms = [...member.platforms];

        // 1. Filter by platform name
        if (selectedPlatform !== 'All') {
          filteredPlatforms = filteredPlatforms.filter(p => p.platform === selectedPlatform);
        }

        // 2. Filter by status
        if (selectedStatus !== 'All') {
          filteredPlatforms = filteredPlatforms.filter(p => {
            if (selectedStatus === 'Active') return p.status === 'ACTIVE';
            if (selectedStatus === 'Recently Active') return p.status === 'RECENTLY_ACTIVE';
            if (selectedStatus === 'Offline') return p.status === 'OFFLINE';
            return true;
          });
        }

        return {
          ...member,
          platforms: filteredPlatforms
        };
      })
      .filter(member => {
        // 3. Search query matching name/email
        const matchesSearch =
          member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.email.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        // If a platform filter is active, only show the user if they actually have matching platforms.
        if (selectedPlatform !== 'All' && member.platforms.length === 0) {
          return false;
        }

        // If a status filter is active
        if (selectedStatus !== 'All') {
          if (selectedStatus === 'Offline' && selectedPlatform === 'All' && member.platforms.length === 0 && !member.isActive) {
            return true;
          }
          if (member.platforms.length === 0) {
            return false;
          }
        }

        return true;
      });
  }, [computedMembers, searchQuery, selectedPlatform, selectedStatus]);

  // Sort filtered list
  const sortedMembers = useMemo(() => {
    const sorted = [...filteredMembers];
    sorted.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'platforms') {
        return b.platforms.length - a.platforms.length;
      }
      // default: lastActive
      return b.mostRecentLastSeenAt - a.mostRecentLastSeenAt;
    });
    return sorted;
  }, [filteredMembers, sortBy]);

  // Paginate sorted list
  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedMembers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedMembers, currentPage]);

  const totalPages = Math.max(1, Math.ceil(sortedMembers.length / ITEMS_PER_PAGE));

  // Compute overall dashboard stats
  const stats = useMemo(() => {
    const totalMembers = orgMembers?.length ?? 0;
    const currentlyActive = computedMembers.filter(m => m.isActive).length;

    // Distinct platforms currently active across all members
    const activePlatformsSet = new Set<string>();
    computedMembers.forEach(m => {
      m.platforms.forEach(p => {
        if (p.status === 'ACTIVE' || p.status === 'RECENTLY_ACTIVE') {
          activePlatformsSet.add(p.platform);
        }
      });
    });

    const fullyOffline = totalMembers - currentlyActive;

    return {
      totalMembers,
      currentlyActive,
      activePlatforms: activePlatformsSet.size,
      fullyOffline
    };
  }, [orgMembers, computedMembers]);

  // Automatically expand active users on mount/load
  useEffect(() => {
    if (computedMembers.length > 0) {
      const initialExpanded: Record<string, boolean> = {};
      computedMembers.forEach(m => {
        if (m.isActive) {
          initialExpanded[m.userId] = true;
        }
      });
      setExpandedUsers(prev => ({ ...initialExpanded, ...prev }));
    }
  }, [computedMembers.length]);

  const isLoading = isLoadingMembers || isLoadingPresence;

  if (!isAdmin) return null;

  return (
    <DashboardShell>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* ─── Header (Consistent with Sessions & Vaults Page) ─────────── */}
        <div className="flex justify-between items-center pb-2 border-b border-premium">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-premium-main">Activity</h1>
            <p className="text-xs text-premium-muted mt-0.5">Monitor delegated platform activity in near-real-time.</p>
          </div>
        </div>

        {/* ─── Metric Stats (Consistent with Dashboard Cards) ─────────── */}
        {!isLoading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="premium-card p-5 flex flex-col justify-between shadow-none min-h-[105px]">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xl font-bold text-premium-main">{stats.totalMembers}</p>
                <p className="text-[10px] font-bold text-premium-muted uppercase tracking-wider mt-1">Total Members</p>
              </div>
            </div>

            <div className="premium-card p-5 flex flex-col justify-between shadow-none min-h-[105px]">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CircleDot className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xl font-bold text-premium-main">{stats.currentlyActive}</p>
                <p className="text-[10px] font-bold text-premium-muted uppercase tracking-wider mt-1">Currently Active</p>
              </div>
            </div>

            <div className="premium-card p-5 flex flex-col justify-between shadow-none min-h-[105px]">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-violet-50 dark:bg-violet-950/30 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <Globe className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xl font-bold text-premium-main">{stats.activePlatforms}</p>
                <p className="text-[10px] font-bold text-premium-muted uppercase tracking-wider mt-1">Active Platforms</p>
              </div>
            </div>

            <div className="premium-card p-5 flex flex-col justify-between shadow-none min-h-[105px]">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800/60 rounded-lg flex items-center justify-center text-premium-muted">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xl font-bold text-premium-main">{stats.fullyOffline}</p>
                <p className="text-[10px] font-bold text-premium-muted uppercase tracking-wider mt-1">Fully Offline</p>
              </div>
            </div>

          </div>
        )}

        {/* ─── Control Bar (Consistent Inputs and Select elements) ──────── */}
        <div className="premium-card p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-none">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-premium-muted">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search member name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-premium bg-premium-surface text-xs text-premium-main placeholder-premium-muted focus:outline-none focus:border-premium-main focus:ring-2 focus:ring-premium-main/10 shadow-sm transition-all"
            />
          </div>

          {/* Filters Selects */}
          <div className="flex flex-wrap items-center gap-3">
            
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-premium-muted" />
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="bg-premium-surface border border-premium text-xs text-premium-main rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-premium-main focus:ring-2 focus:ring-premium-main/10 shadow-sm cursor-pointer font-semibold"
              >
                <option value="All">All Platforms</option>
                {allUniquePlatforms.map(platform => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-premium-surface border border-premium text-xs text-premium-main rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-premium-main focus:ring-2 focus:ring-premium-main/10 shadow-sm cursor-pointer font-semibold"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Recently Active">Recently Active</option>
                <option value="Offline">Offline</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-premium-muted" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-premium-surface border border-premium text-xs text-premium-main rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-premium-main focus:ring-2 focus:ring-premium-main/10 shadow-sm cursor-pointer font-semibold"
              >
                <option value="lastActive">Sort: Last Active</option>
                <option value="name">Sort: Name</option>
                <option value="platforms">Sort: Platforms Count</option>
              </select>
            </div>

          </div>
        </div>

        {/* ─── Main Grouped Table/Cards ──────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="premium-card p-5 animate-pulse"
              >
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                <div className="h-3 w-48 bg-slate-100 dark:bg-slate-800 rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-8 w-full bg-slate-50 dark:bg-slate-800/50 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedMembers.length === 0 ? (
          <div className="text-center py-12 premium-card shadow-none">
            <Users className="w-8 h-8 mx-auto mb-3 text-premium-muted opacity-40" />
            <p className="text-xs font-bold text-premium-main">
              No matching activity found
            </p>
            <p className="text-[11px] text-premium-muted mt-1 max-w-sm mx-auto opacity-70">
              Try adjusting your filters or search keywords.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {paginatedMembers.map((member) => {
              const isExpanded = !!expandedUsers[member.userId];
              const initials = member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

              return (
                <div
                  key={member.userId}
                  className="premium-card overflow-hidden shadow-none transition-all duration-150 hover:border-premium"
                >
                  
                  {/* User Parent Header Row */}
                  <div 
                    onClick={() => toggleExpand(member.userId)}
                    className="px-5 py-3.5 flex items-center justify-between bg-slate-50/20 dark:bg-zinc-900/10 cursor-pointer hover:bg-slate-50/40 dark:hover:bg-zinc-900/20 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-premium-main/10 text-premium-main font-semibold text-[11px] flex items-center justify-center border border-premium-main/20 flex-shrink-0">
                        {initials}
                      </div>

                      {/* Name & Email */}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-premium-main tracking-tight leading-tight truncate">
                          {member.name}
                        </h4>
                        <p className="text-[10px] font-bold text-premium-muted leading-tight truncate mt-1">
                          {member.email}
                        </p>
                      </div>

                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      
                      {/* Platforms Badge Count */}
                      {member.platforms.length > 0 && (
                        <span className="text-[10px] font-bold text-premium-muted bg-premium-surface px-2.5 py-1 rounded-md border border-premium">
                          {member.platforms.length} platform{member.platforms.length !== 1 ? 's' : ''}
                        </span>
                      )}

                      {/* Overall Status Pill */}
                      {member.isActive ? (
                        <span className="inline-flex w-28 justify-center items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/20 dark:border-emerald-900/20 flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          Currently Active
                        </span>
                      ) : (
                        <span className="inline-flex w-28 justify-center items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/30 flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                          Offline
                        </span>
                      )}

                      {/* Expand / Collapse Icon */}
                      <button className="text-premium-muted hover:text-premium-main transition-colors p-1">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                    </div>
                  </div>

                  {/* Expanded Sub-table */}
                  {isExpanded && (
                    <div className="border-t border-premium bg-premium-surface divide-y divide-premium">
                      
                      {member.platforms.map((record) => (
                        <div
                          key={record.platform}
                          className="px-6 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/20 dark:hover:bg-zinc-900/10 transition-colors border-b border-premium/65 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            
                            {/* Inner Dot indicator */}
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                record.status === 'ACTIVE'
                                  ? 'bg-emerald-500'
                                  : record.status === 'RECENTLY_ACTIVE'
                                  ? 'bg-amber-400'
                                  : 'bg-slate-400 dark:bg-zinc-500'
                              }`}
                            />

                            {/* Platform name */}
                            <span className="text-xs font-bold text-premium-main w-36 truncate">
                              {record.platform}
                            </span>
                            
                            {/* Individual status badge */}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              record.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/20'
                                : record.status === 'RECENTLY_ACTIVE'
                                ? 'bg-amber-50 text-amber-700 border-amber-200/20 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/20'
                                : 'bg-slate-100 text-slate-500 border-slate-200/30 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-800/40'
                            }`}>
                              {record.status === 'ACTIVE' ? 'Active' : record.status === 'RECENTLY_ACTIVE' ? 'Recently active' : 'Offline'}
                            </span>

                          </div>

                          <div className="text-[10px] text-premium-muted font-bold uppercase tracking-wider tabular-nums">
                            Last seen {timeAgo(Math.max(0, record.lastSeenMs))}
                          </div>
                        </div>
                      ))}

                      {member.platforms.length === 0 && (
                        <div className="px-6 py-4 text-xs text-premium-muted italic text-center">
                          No activity recorded for this member.
                        </div>
                      )}

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

        {/* ─── Pagination Controls (Consistent borders and sizing) ────── */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-premium pt-4">
            <p className="text-xs text-premium-muted">
              Showing <span className="font-semibold text-premium-main">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
              <span className="font-semibold text-premium-main">
                {Math.min(currentPage * ITEMS_PER_PAGE, sortedMembers.length)}
              </span>{' '}
              of <span className="font-semibold text-premium-main">{sortedMembers.length}</span> members
            </p>
            
            <div className="flex items-center gap-1.5">
              
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 border border-premium rounded-lg text-premium-muted hover:text-premium-main hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-2.5 py-0.5 text-xs rounded-md border font-semibold transition-all ${
                      currentPage === page
                        ? 'bg-premium-main/10 text-premium-main border-premium-main/40'
                        : 'border-transparent text-premium-muted hover:text-premium-main hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1 border border-premium rounded-lg text-premium-muted hover:text-premium-main hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

            </div>
          </div>
        )}

        {/* ─── Legend Indicator & Footer ────────────────────────────── */}
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between border-t border-premium pt-6 gap-4">
          
          <div className="flex flex-wrap items-center justify-center gap-5 text-[10px] font-bold text-premium-muted uppercase tracking-wider bg-premium-surface px-4 py-2.5 rounded-xl border border-premium">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active (&le; 45s)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Recently Active (45s - 90s)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-500" />
              Offline (&gt; 90s)
            </span>
          </div>

          <p className="text-[10px] font-bold text-premium-muted uppercase tracking-wider text-center md:text-right">
            Dashboard updates every 30 seconds · Interactive 1-second counters
          </p>

        </div>

      </div>
    </DashboardShell>
  );
}
