'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { usePresence } from '../../hooks/usePresence';
import { useOrgMembers } from '../../hooks/useOrganization';
import { useAuth } from '../../lib/auth/AuthContext';
import { hasPermission } from '../../lib/auth/permissions';
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
  ChevronRight,
  Lock,
  Check,
  Crown,
} from 'lucide-react';
import { useOrgSubscription } from '../../hooks/useBilling';
import { PresenceRecord } from '../../lib/api/presence';
import { Modal } from '../../components/common/Modal';

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
  const { organization, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const orgId = organization?.id ?? null;
  const isAdmin =
    hasPermission(organization?.role, 'PRESENCE_READ');

  // Plan-based gate: Activity monitoring is PRO+ only
  const { subscription, loading: isSubLoading, initialized: isSubInitialized } = useOrgSubscription(orgId);
  // Guard: treat as "not free" until BOTH auth AND subscription have fully settled.
  // `initialized` is only true after at least one real fetch completed with a real orgId,
  // which eliminates the race window between auth hydration and the billing fetch starting.
  const isFree = !isAuthLoading && isSubInitialized && (!subscription || subscription.plan === 'FREE');

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
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                LIVE PRESENCE TELEMETRY
              </span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white">
              Real-time Activity
            </h1>
            <p className="text-xs text-[#86868B] mt-0.5">
              Live telemetry monitoring across delegated platform extension sessions.
            </p>
          </div>
        </div>

        {/* FREE plan gate: Activity monitoring is PRO+ only */}
        {isFree ? (
          <Modal 
            isOpen={true} 
            onClose={() => router.push('/dashboard')} 
            title="Feature Locked"
            maxWidth="max-w-md"
          >
            <div className="space-y-4">
              {/* Icon & Description */}
              <div className="flex flex-col items-center justify-center text-center pt-1">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3 text-amber-500">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white tracking-tight">
                  Activity Monitoring Restricted
                </h3>
                <p className="text-xs text-[#86868B] mt-1.5 max-w-sm leading-relaxed">
                  Real-time platform activity monitoring is available on <span className="font-semibold text-[#1D1D1F] dark:text-white">Pro</span> and <span className="font-semibold text-[#1D1D1F] dark:text-white">Business</span> plans. Upgrade to monitor your team's live platform usage.
                </p>
              </div>

              {/* Feature Highlights Card */}
              <div className="rounded-xl bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 border border-[#E5E5EA] dark:border-[#38383A] p-4 space-y-2">
                <p className="text-[10px] font-semibold text-[#86868B] uppercase tracking-wider">Included in Pro &amp; Business:</p>
                <div className="space-y-2 text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                    <span>Real-time member presence &amp; activity status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                    <span>Platform-specific connection tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                    <span>Live status updates &amp; activity filtering</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
                <button 
                  onClick={() => router.push('/dashboard')} 
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-[#38383A] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#38383A]/80 transition-colors shadow-sm"
                >
                  Go Back
                </button>
                <button 
                  onClick={() => router.push('/pricing')} 
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#0071E3] hover:bg-[#0077ED] text-white flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Crown className="w-3.5 h-3.5" />
                  Upgrade Plan
                </button>
              </div>
            </div>
          </Modal>
        ) : (
          <>

        {/* ─── Metric Stats ─────────── */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] p-4 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[105px]">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="font-number text-2xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white">{stats.totalMembers}</p>
                <p className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider mt-0.5">Total Members</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] p-4 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[105px]">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CircleDot className="w-4 h-4" />
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div>
                <p className="font-number text-2xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white">{stats.currentlyActive}</p>
                <p className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider mt-0.5">Currently Active</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] p-4 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[105px]">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="font-number text-2xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white">{stats.activePlatforms}</p>
                <p className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider mt-0.5">Active Platforms</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] p-4 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[105px]">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#86868B] flex items-center justify-center border border-[#E5E5EA] dark:border-[#38383A]">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="font-number text-2xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white">{stats.fullyOffline}</p>
                <p className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider mt-0.5">Fully Offline</p>
              </div>
            </div>

          </div>
        )}

        {/* ─── Control Bar ──────── */}
        <div className="rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#86868B]">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search member name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-lg text-xs bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 border border-[#E5E5EA] dark:border-[#38383A] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] focus:outline-none focus:ring-1 focus:ring-[#0071E3] transition-all"
            />
          </div>

          {/* Filters Selects */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#86868B]" />
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 border border-[#E5E5EA] dark:border-[#38383A] text-xs text-[#1D1D1F] dark:text-[#F5F5F7] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0071E3] transition-all cursor-pointer font-medium"
              >
                <option value="All" className="bg-white dark:bg-[#1C1C1E]">All Platforms</option>
                {allUniquePlatforms.map(platform => (
                  <option key={platform} value={platform} className="bg-white dark:bg-[#1C1C1E]">{platform}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 border border-[#E5E5EA] dark:border-[#38383A] text-xs text-[#1D1D1F] dark:text-[#F5F5F7] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0071E3] transition-all cursor-pointer font-medium"
              >
                <option value="All" className="bg-white dark:bg-[#1C1C1E]">All Statuses</option>
                <option value="Active" className="bg-white dark:bg-[#1C1C1E]">Active</option>
                <option value="Recently Active" className="bg-white dark:bg-[#1C1C1E]">Recently Active</option>
                <option value="Offline" className="bg-white dark:bg-[#1C1C1E]">Offline</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#86868B]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 border border-[#E5E5EA] dark:border-[#38383A] text-xs text-[#1D1D1F] dark:text-[#F5F5F7] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0071E3] transition-all cursor-pointer font-medium"
              >
                <option value="lastActive" className="bg-white dark:bg-[#1C1C1E]">Sort: Last Active</option>
                <option value="name" className="bg-white dark:bg-[#1C1C1E]">Sort: Name</option>
                <option value="platforms" className="bg-white dark:bg-[#1C1C1E]">Sort: Platforms Count</option>
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
                className="rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] p-4 animate-pulse shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
              >
                <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
                <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-800/60 rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-8 w-full bg-zinc-50 dark:bg-zinc-800/30 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedMembers.length === 0 ? (
          <div className="text-center py-14 rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <Users className="w-8 h-8 mx-auto mb-3 text-[#86868B]" />
            <p className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
              No matching activity records found
            </p>
            <p className="text-xs text-[#86868B] mt-1 max-w-sm mx-auto">
              Try adjusting your search queries or filter selections.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {paginatedMembers.map((member) => {
              const isExpanded = !!expandedUsers[member.userId];
              const initials = member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

              return (
                <div
                  key={member.userId}
                  className="rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors"
                >
                  
                  {/* User Parent Header Row */}
                  <div 
                    onClick={() => toggleExpand(member.userId)}
                    className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-[#F5F5F7]/50 dark:hover:bg-[#2C2C2E]/40 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-[#0071E3]/10 text-[#0071E3] font-semibold text-xs flex items-center justify-center flex-shrink-0">
                        {initials}
                      </div>

                      {/* Name & Email */}
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-[#1D1D1F] dark:text-white truncate">
                          {member.name}
                        </h4>
                        <p className="text-[11px] text-[#86868B] truncate mt-0.5">
                          {member.email}
                        </p>
                      </div>

                    </div>

                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      
                      {/* Overall Status Pill */}
                      {member.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Currently Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#86868B] border border-[#E5E5EA] dark:border-[#38383A]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#86868B]" />
                          Offline
                        </span>
                      )}

                      {/* Expand / Collapse Icon */}
                      <div className="p-1 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>

                    </div>
                  </div>

                  {/* Expanded Sub-table */}
                  {isExpanded && (
                    <div className="border-t border-[#E5E5EA]/60 dark:border-[#2C2C2E]/60 bg-[#F5F5F7]/30 dark:bg-[#2C2C2E]/20 divide-y divide-[#E5E5EA]/60 dark:divide-[#2C2C2E]/60">
                      
                      {member.platforms.map((record) => (
                        <div
                          key={record.platform}
                          className="px-5 py-2.5 flex items-center justify-between text-xs hover:bg-[#F5F5F7]/50 dark:hover:bg-[#2C2C2E]/40 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            
                            {/* Inner Dot indicator */}
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                record.status === 'ACTIVE'
                                  ? 'bg-emerald-500'
                                  : record.status === 'RECENTLY_ACTIVE'
                                  ? 'bg-amber-400'
                                  : 'bg-zinc-400 dark:bg-zinc-600'
                              }`}
                            />

                            {/* Platform name */}
                            <span className="text-xs font-medium text-[#1D1D1F] dark:text-white w-32 truncate">
                              {record.platform}
                            </span>
                            
                            {/* Individual status badge */}
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                              record.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : record.status === 'RECENTLY_ACTIVE'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                : 'bg-[#F5F5F7] text-[#86868B] border-[#E5E5EA] dark:bg-[#2C2C2E] dark:border-[#38383A]'
                            }`}>
                              {record.status === 'ACTIVE' ? 'Active' : record.status === 'RECENTLY_ACTIVE' ? 'Recently active' : 'Offline'}
                            </span>

                          </div>

                          <div className="text-[11px] text-[#86868B] tabular-nums">
                            Last seen {timeAgo(Math.max(0, record.lastSeenMs))}
                          </div>
                        </div>
                      ))}

                      {member.platforms.length === 0 && (
                        <div className="px-5 py-3 text-xs text-[#86868B] italic text-center">
                          No active platform sessions recorded for this member.
                        </div>
                      )}

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

        {/* ─── Pagination Controls ────── */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-[#86868B]">
              Showing <span className="font-medium text-[#1D1D1F] dark:text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
              <span className="font-medium text-[#1D1D1F] dark:text-white">
                {Math.min(currentPage * ITEMS_PER_PAGE, sortedMembers.length)}
              </span>{' '}
              of <span className="font-medium text-[#1D1D1F] dark:text-white">{sortedMembers.length}</span> members
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-white dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-[#38383A] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#38383A]/80 disabled:opacity-40 transition-colors shadow-sm"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 flex items-center justify-center text-xs rounded-lg font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-[#0071E3] text-white shadow-sm'
                        : 'text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E]'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-white dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-[#38383A] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#38383A]/80 disabled:opacity-40 transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* ─── Legend Indicator & Footer ────────────────────────────── */}
        <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center justify-center gap-5 text-[11px] font-medium text-[#86868B] bg-white dark:bg-[#1C1C1E] px-4 py-2 rounded-lg border border-[#E5E5EA] dark:border-[#2C2C2E] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Active (&le; 45s)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Recently Active (45s - 90s)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-600" />
              Offline (&gt; 90s)
            </span>
          </div>

          <p className="text-xs text-[#86868B] text-center md:text-right">
            Near-real-time telemetry · Refreshes every 30 seconds
          </p>

        </div>

          </>
        )}

      </div>
    </DashboardShell>
  );
}
