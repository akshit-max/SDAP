'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { superAdminApi } from '../../../lib/api/superadmin';
import {
  Puzzle, Zap, AlertTriangle, Activity, RefreshCw,
  CheckCircle2, XCircle, Clock, Info, Globe,
  GitBranch, Triangle, Mail, ShoppingBag, CreditCard,
  Wallet, Share2, Landmark, ShieldCheck, FileText,
  Search, SlidersHorizontal, Key, Check, Server, Shield, Sparkles, Layers,
} from 'lucide-react';
import { formatDate } from '../../../lib/formatters';

// ─── Types ────────────────────────────────────────────────────────────────────

type AutofillSupport = 'full' | 'partial' | 'manual_step';

type VaultPlatform = {
  id: string;
  name: string;
  category: string;
  autofillSupport: AutofillSupport;
  nativeApiIntegration: boolean;
  otpSupport: boolean;
  otpType?: string;
  limitations: string | null;
  integrationConnections: { total: number; active: number; failed: number; disconnected: number } | null;
  nativeSessionCount: number | null;
  activePresenceCount: number | null;
  analyticsNote: string | null;
};

type IntegrationStat = {
  provider: string;
  total: number;
  active: number;
  failed: number;
  disconnected: number;
  orgs: number;
  sessions: number;
};

// ─── Visual Brand Icons & Badges ──────────────────────────────────────────────

function PlatformBrandIcon({ platformId }: { platformId: string }) {
  switch (platformId) {
    case 'GITHUB':
      return (
        <div className="w-10 h-10 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-bold shadow-sm flex-shrink-0">
          <GitBranch className="w-5 h-5" />
        </div>
      );
    case 'VERCEL':
      return (
        <div className="w-10 h-10 rounded-lg bg-black text-white dark:bg-zinc-100 dark:text-black flex items-center justify-center font-bold shadow-sm flex-shrink-0">
          <Triangle className="w-4 h-4 fill-current text-white dark:text-black" />
        </div>
      );
    case 'GODADDY':
      return (
        <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
          <Globe className="w-5 h-5" />
        </div>
      );
    case 'GMAIL':
      return (
        <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
          <Mail className="w-5 h-5" />
        </div>
      );
    case 'SHOPIFY':
      return (
        <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
          <ShoppingBag className="w-5 h-5" />
        </div>
      );
    case 'STRIPE':
      return (
        <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
          <CreditCard className="w-5 h-5" />
        </div>
      );
    case 'RAZORPAY':
      return (
        <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
          <Wallet className="w-5 h-5" />
        </div>
      );
    case 'LINKEDIN':
      return (
        <div className="w-10 h-10 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
          <Share2 className="w-5 h-5" />
        </div>
      );
    case 'MCA':
      return (
        <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
          <Landmark className="w-5 h-5" />
        </div>
      );
    case 'GST':
      return (
        <div className="w-10 h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
      );
    case 'UDYAM':
      return (
        <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
          <FileText className="w-5 h-5" />
        </div>
      );
    default:
      return (
        <div className="w-10 h-10 rounded-lg bg-zinc-800 text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
          <Server className="w-5 h-5" />
        </div>
      );
  }
}

function NativeProviderIcon({ provider }: { provider: string }) {
  switch (provider) {
    case 'VERCEL':
      return (
        <div className="w-8 h-8 rounded-md bg-black text-white dark:bg-zinc-100 dark:text-black flex items-center justify-center font-bold shadow-sm flex-shrink-0">
          <Triangle className="w-3.5 h-3.5 fill-current text-white dark:text-black" />
        </div>
      );
    case 'GITHUB':
      return (
        <div className="w-8 h-8 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-bold shadow-sm flex-shrink-0">
          <GitBranch className="w-4 h-4" />
        </div>
      );
    case 'GODADDY':
      return (
        <div className="w-8 h-8 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
          <Globe className="w-4 h-4" />
        </div>
      );
    case 'GMAIL':
      return (
        <div className="w-8 h-8 rounded-md bg-rose-600 text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
          <Mail className="w-4 h-4" />
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-md bg-zinc-800 text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
          <Zap className="w-4 h-4" />
        </div>
      );
  }
}

function AutofillBadge({ level }: { level: AutofillSupport }) {
  switch (level) {
    case 'full':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> Full Autofill
        </span>
      );
    case 'partial':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
          <Clock className="w-3 h-3 text-amber-500 flex-shrink-0" /> Partial Autofill
        </span>
      );
    case 'manual_step':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
          <Info className="w-3 h-3 text-blue-500 flex-shrink-0" /> Fill + Manual Step
        </span>
      );
  }
}

function NativeBadge({ supported }: { supported: boolean }) {
  return supported ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
      <Zap className="w-3 h-3 text-purple-500 flex-shrink-0" /> Native API
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
      <Key className="w-3 h-3 text-zinc-400 flex-shrink-0" /> Vault Autofill
    </span>
  );
}

function MetricValue({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="text-zinc-400 dark:text-zinc-500 font-mono text-xs" title="Analytics unavailable — platform field not stored on Secret">
        —
      </span>
    );
  }
  return <span className="font-bold text-zinc-900 dark:text-zinc-100 font-number">{value}</span>;
}

// ─── Platform Ecosystem Tab ───────────────────────────────────────────────────

function PlatformEcosystemTab() {
  const [platforms, setPlatforms] = useState<VaultPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    superAdminApi.getPlatformEcosystem()
      .then((res) => setPlatforms(res.data?.platforms || []))
      .catch(() => setError('Failed to load platform ecosystem data.'))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(platforms.map((p) => p.category)));
    return ['all', ...cats];
  }, [platforms]);

  const filteredPlatforms = useMemo(() => {
    return platforms.filter((platform) => {
      const matchesSearch =
        platform.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        platform.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        platform.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || platform.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [platforms, searchQuery, selectedCategory]);

  const statsSummary = useMemo(() => {
    const total = platforms.length;
    const nativeCount = platforms.filter((p) => p.nativeApiIntegration).length;
    const autofillCount = platforms.filter((p) => p.autofillSupport === 'full').length;
    const otpCount = platforms.filter((p) => p.otpSupport).length;
    return { total, nativeCount, autofillCount, otpCount };
  }, [platforms]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
        <span className="text-xs font-semibold text-zinc-500">Loading WITHUS Platform Ecosystem...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <span className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Stat Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg space-y-1">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Ecosystem</span>
            <Layers className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-number">{statsSummary.total}</p>
          <p className="text-[10px] text-zinc-500 font-medium">Supported Vault platforms</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg space-y-1">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Native Integrations</span>
            <Zap className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-number">{statsSummary.nativeCount}</p>
          <p className="text-[10px] text-zinc-500 font-medium">API-level revocation ready</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg space-y-1">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Full Autofill</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-number">{statsSummary.autofillCount}</p>
          <p className="text-[10px] text-zinc-500 font-medium">Instant extension login</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg space-y-1">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">OTP Watchers</span>
            <Shield className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-number">{statsSummary.otpCount}</p>
          <p className="text-[10px] text-zinc-500 font-medium">Automated 2FA verification</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3.5 p-4 rounded-lg bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/50">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="space-y-1 text-xs">
          <p className="font-bold text-blue-900 dark:text-blue-300">
            WITHUS Platform & Extension Ecosystem Architecture
          </p>
          <p className="text-blue-800 dark:text-blue-400 leading-relaxed text-[11px]">
            Organisations store credentials in their Vault and issue Delegated Access Sessions to team members. The WITHUS browser extension handles automated field injection, credential submission, and 2FA verification.
          </p>
        </div>
      </div>

      {/* Controls Bar: Search & Category Chips */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search platforms, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs font-medium text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 placeholder:text-zinc-400"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs font-semibold rounded whitespace-nowrap transition-colors capitalize ${
                selectedCategory === cat
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Platform Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPlatforms.map((platform) => (
          <div
            key={platform.id}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <PlatformBrandIcon platformId={platform.id} />
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white transition-colors">
                    {platform.name}
                  </h3>
                  <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                    {platform.category}
                  </span>
                </div>
              </div>
              <NativeBadge supported={platform.nativeApiIntegration} />
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              <AutofillBadge level={platform.autofillSupport} />
              {platform.otpSupport && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                  <Shield className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                  {platform.otpType || 'OTP Watcher'}
                </span>
              )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-center">
              <div className="bg-zinc-50 dark:bg-zinc-800/40 p-2 rounded border border-zinc-100 dark:border-zinc-800">
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Connections</p>
                <p className="text-xs">
                  {platform.nativeApiIntegration && platform.integrationConnections !== null ? (
                    <MetricValue value={platform.integrationConnections.active} />
                  ) : (
                    <MetricValue value={null} />
                  )}
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/40 p-2 rounded border border-zinc-100 dark:border-zinc-800">
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Sessions</p>
                <p className="text-xs">
                  {platform.nativeApiIntegration ? (
                    <MetricValue value={platform.nativeSessionCount} />
                  ) : (
                    <MetricValue value={null} />
                  )}
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/40 p-2 rounded border border-zinc-100 dark:border-zinc-800">
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Presence</p>
                <p className="text-xs">
                  <MetricValue value={platform.activePresenceCount} />
                </p>
              </div>
            </div>

            {/* Limitations / Notes */}
            {platform.limitations ? (
              <div className="flex items-start gap-2 p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] leading-relaxed font-medium">{platform.limitations}</p>
              </div>
            ) : platform.analyticsNote ? (
              <div className="flex items-start gap-2 p-2.5 rounded bg-zinc-100/70 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-zinc-500 dark:text-zinc-400">
                <Info className="w-3.5 h-3.5 text-zinc-400 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] leading-relaxed font-medium">{platform.analyticsNote}</p>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Fully operational credential pipeline</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredPlatforms.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2">
          <Search className="w-8 h-8 mx-auto text-zinc-400" />
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">No platforms match your criteria.</p>
          <p className="text-[11px] text-zinc-500">Try adjusting your search query or category filter.</p>
        </div>
      )}
    </div>
  );
}

// ─── Integration Connections Tab ──────────────────────────────────────────────

function IntegrationConnectionsTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.getPlatformStats();
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stats: IntegrationStat[] = data?.stats || [];
  const recentActivity: any[] = data?.recentActivity || [];

  const LIMIT = 10;
  const totalPages = Math.max(1, Math.ceil(recentActivity.length / LIMIT));
  const paginatedActivity = recentActivity.slice((page - 1) * LIMIT, page * LIMIT);

  return (
    <div className="space-y-6">
      {/* Section Banner */}
      <div className="flex items-start gap-3.5 p-4 rounded-lg bg-purple-50/80 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/50">
        <Zap className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
        <div className="space-y-1 text-xs">
          <p className="font-bold text-purple-900 dark:text-purple-300">
            Native OAuth & API Integrations (4 Reference Providers)
          </p>
          <p className="text-purple-800 dark:text-purple-400 leading-relaxed text-[11px]">
            These 4 reference providers support direct API-level OAuth connections. When a Delegated Access Session expires or is revoked, WITHUS communicates directly with the provider API to terminate active sessions.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-2">
          <RefreshCw className="w-5 h-5 animate-spin text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-500">Loading API connection metrics...</span>
        </div>
      ) : (
        <>
          {/* Platform Analytics Summary */}
          {stats.length > 0 && (() => {
            const mostPopular = [...stats].sort((a, b) => b.sessions - a.sessions)[0];
            const leastUsed = [...stats].sort((a, b) => a.sessions - b.sessions)[0];
            const added = recentActivity.filter((e) => e.action === 'integration.connected').length;
            const removed = recentActivity.filter((e) => e.action === 'integration.disconnected').length;
            return (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Platform Analytics (15-Day Window)</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 space-y-1.5 shadow-sm">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Most Popular</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{mostPopular?.provider || '—'}</p>
                    <p className="text-[10px] text-zinc-400 font-number">{mostPopular?.sessions ?? 0} sessions</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 space-y-1.5 shadow-sm">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Least Used</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{leastUsed?.provider || '—'}</p>
                    <p className="text-[10px] text-zinc-400 font-number">{leastUsed?.sessions ?? 0} sessions</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-4 space-y-1.5 shadow-sm">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Platforms Added</p>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 font-number">{added}</p>
                    <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500">Last 15 days</p>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 rounded-lg p-4 space-y-1.5 shadow-sm">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Platforms Removed</p>
                    <p className="text-xl font-bold text-rose-700 dark:text-rose-300 font-number">{removed}</p>
                    <p className="text-[10px] text-rose-600/70 dark:text-rose-500">Last 15 days</p>
                  </div>
                </div>
                {/* Connection Success Rate per provider */}
                <div className="mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Connection Success Rate by Provider</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {stats.map((stat) => {
                      const successRate = stat.total > 0 ? Math.round((stat.active / stat.total) * 100) : 100;
                      return (
                        <div key={stat.provider} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 shadow-sm space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{stat.provider}</p>
                            <span className={`text-xs font-bold font-number ${successRate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {successRate}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${successRate >= 80 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              style={{ width: `${successRate}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-zinc-400 font-number">{stat.active} active · {stat.failed} failed · {stat.total} total connections</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Provider Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.provider}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-3 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <NativeProviderIcon provider={stat.provider} />
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{stat.provider}</h4>
                    <p className="text-[10px] text-zinc-500 font-medium">{stat.total} total connections</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-center">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-1.5">
                    <p className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Active</p>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-number">{stat.active}</p>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/20 rounded p-1.5">
                    <p className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase">Failed</p>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-number">{stat.failed}</p>
                  </div>

                  <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded p-1.5">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase">Sessions</p>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-number">{stat.sessions}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Activity Table */}
          {recentActivity.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm space-y-0">
              <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Recent Integration Audit Logs
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  Total {recentActivity.length} events (Last 15 days)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-800/30">
                    <tr>
                      {['Action', 'Organisation', 'Actor', 'Timestamp'].map((h, i) => (
                        <th
                          key={h}
                          className={`px-5 py-3 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider ${
                            i === 3 ? 'text-right' : 'text-left'
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                    {paginatedActivity.map((e: any) => (
                      <tr key={e.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          {e.action}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                          {e.organization?.name ?? '—'}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono text-zinc-700 dark:text-zinc-300">
                          {e.actor?.email ?? '—'}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs text-zinc-800 dark:text-zinc-200 text-right font-number">
                          {formatDate(e.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Page <span className="font-bold text-zinc-900 dark:text-zinc-100 font-number">{page}</span> of{' '}
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 font-number">{totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SuperAdminPlatformsPage() {
  const searchParams = useSearchParams();
  const tab = searchParams?.get('tab');
  const isConnectionsTab = tab === 'connections';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shadow-sm">
              <Puzzle className="w-4 h-4" />
            </div>
            WITHUS Platforms
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            {isConnectionsTab
              ? 'Native API integrations — Vercel, GitHub, GoDaddy, Gmail. API-level delegation and session revocation.'
              : '11 official WITHUS Vault & Extension platforms. Credential storage, delegated sessions, and extension autofill.'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg border border-zinc-200 dark:border-zinc-700/80 w-fit">
          <a
            href="/superadmin/platforms"
            className={`px-4 py-1.5 text-xs font-bold rounded transition-all flex items-center gap-1.5 ${
              !isConnectionsTab
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Platform Ecosystem
            <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
              11 platforms
            </span>
          </a>
          <a
            href="/superadmin/platforms?tab=connections"
            className={`px-4 py-1.5 text-xs font-bold rounded transition-all flex items-center gap-1.5 ${
              isConnectionsTab
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-purple-500" />
            Integration Connections
            <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              4 native
            </span>
          </a>
        </div>
      </div>

      {/* Tab Content */}
      {isConnectionsTab ? <IntegrationConnectionsTab /> : <PlatformEcosystemTab />}
    </div>
  );
}
