'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { DemoRequestModal } from '../components/public/DemoRequestModal';
import {
  Shield,
  Lock,
  Key,
  Users,
  Building2,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Activity,
  Layers,
  Globe,
  Clock,
  ShieldCheck,
  Check,
  Briefcase,
  ChevronRight,
  ShieldAlert,
  FileCheck,
  Sliders,
  Eye,
  RefreshCw,
  XCircle,
  BarChart3,
  CheckSquare,
  Terminal
} from 'lucide-react';

export default function PublicWithusPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const mainScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sectionIds = ['hero', 'problem', 'solution', 'workflow', 'use-cases', 'capabilities', 'preview', 'pricing', 'stage'];
    
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observerOptions: IntersectionObserverInit = {
      root: mainScrollRef.current,
      rootMargin: '-20% 0px -50% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={mainScrollRef}
      className="dark h-screen overflow-y-auto bg-neutral-950 text-neutral-100 font-sans antialiased selection:bg-neutral-800 selection:text-neutral-100 scroll-smooth"
    >
      {/* Top Navigation Bar with Active Module Indicator */}
      <PublicNavbar
        activeTab={activeSection}
        onOpenDemo={() => setIsDemoModalOpen(true)}
      />

      {/* Main Content Hub */}
      <main className="relative pt-24 pb-24 space-y-32 sm:space-y-40">

        {/* SECTION 1: HERO & TRUST STRIP */}
        <section id="hero" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-20 pb-16 text-center relative overflow-hidden scroll-mt-28">
          {/* Ambient Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[420px] bg-neutral-800/20 blur-[160px] rounded-full pointer-events-none" />

          {/* Eyebrow Module Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-neutral-900/90 border border-neutral-800 text-neutral-300 text-xs font-semibold tracking-wider uppercase font-mono mb-8 shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
            <span>Secure Access Delegation Platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.12]">
            Delegate Platform Access Without Sharing the Underlying Password
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-xl text-neutral-400 max-w-3xl mx-auto font-normal leading-relaxed">
            WITHUS helps organizations give team members controlled access to shared online platforms without directly sharing the underlying password. Teams can manage access, set time limits, revoke access when needed, and keep a clear history of important activity.
          </p>

          {/* Dual Action CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-neutral-950 font-bold text-sm hover:bg-neutral-100 transition-all shadow-xl hover:shadow-neutral-200/10 flex items-center justify-center gap-2.5 group cursor-pointer"
            >
              <span>Request Product Demo</span>
              <ArrowRight className="w-4 h-4 text-neutral-950 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#solution"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-200 font-semibold text-sm hover:bg-neutral-850 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 group"
            >
              <span>How WITHUS Works</span>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {/* Trust Metric Badges Strip */}
          <div className="mt-20 pt-10 border-t border-neutral-900 max-w-5xl mx-auto">
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest mb-6 font-mono">
              Built for Teams That Share Access
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center justify-center text-neutral-300">
              <div className="flex items-center justify-center gap-3 px-4 py-4 rounded-xl bg-neutral-900/60 border border-neutral-850 hover:border-neutral-800 transition-all shadow-2xs">
                <ShieldCheck className="w-4.5 h-4.5 text-white shrink-0" />
                <span className="text-xs font-semibold">Protected Credentials</span>
              </div>
              <div className="flex items-center justify-center gap-3 px-4 py-4 rounded-xl bg-neutral-900/60 border border-neutral-850 hover:border-neutral-800 transition-all shadow-2xs">
                <Lock className="w-4.5 h-4.5 text-white shrink-0" />
                <span className="text-xs font-semibold">Controlled Access</span>
              </div>
              <div className="flex items-center justify-center gap-3 px-4 py-4 rounded-xl bg-neutral-900/60 border border-neutral-850 hover:border-neutral-800 transition-all shadow-2xs">
                <Clock className="w-4.5 h-4.5 text-white shrink-0" />
                <span className="text-xs font-semibold">Access Expiry</span>
              </div>
              <div className="flex items-center justify-center gap-3 px-4 py-4 rounded-xl bg-neutral-900/60 border border-neutral-850 hover:border-neutral-800 transition-all shadow-2xs">
                <Activity className="w-4.5 h-4.5 text-white shrink-0" />
                <span className="text-xs font-semibold">Activity History</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: THE PROBLEM */}
        <section id="problem" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16 border-t border-neutral-900/80 scroll-mt-28">
          <div className="max-w-3xl mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-[11px] font-semibold uppercase tracking-wider font-mono mb-4">
              <AlertTriangle className="w-3.5 h-3.5 text-white" />
              <span>Operational Risk Factors</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mt-1 mb-4">
              Traditional Credential Sharing Creates Unnecessary Risk
            </h2>
            <p className="text-base sm:text-lg text-neutral-400 font-normal leading-relaxed">
              Organizations frequently grant third-party platform access by passing master accounts over unencrypted messaging channels, making access harder to control, revoke, and track.
            </p>
          </div>

          {/* 4 Structured Risk Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-7 rounded-2xl bg-gradient-to-b from-neutral-900/80 via-neutral-900/40 to-neutral-950 border border-neutral-850 hover:border-neutral-750 transition-all duration-300 group hover:shadow-xl hover:shadow-neutral-950/60 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6 text-white group-hover:scale-105 transition-transform shadow-inner">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded bg-neutral-900/90 text-neutral-400 border border-neutral-800 text-[10px] font-mono uppercase font-bold tracking-wider">Risk Factor 01</span>
                <h3 className="text-lg font-bold text-white mt-4 mb-2 tracking-tight">Password Sharing</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Passwords shared through email, messaging apps, or documents can remain accessible long after the original task is complete.
                </p>
              </div>
            </div>

            <div className="p-7 rounded-2xl bg-gradient-to-b from-neutral-900/80 via-neutral-900/40 to-neutral-950 border border-neutral-850 hover:border-neutral-750 transition-all duration-300 group hover:shadow-xl hover:shadow-neutral-950/60 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6 text-white group-hover:scale-105 transition-transform shadow-inner">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded bg-neutral-900/90 text-neutral-400 border border-neutral-800 text-[10px] font-mono uppercase font-bold tracking-wider">Risk Factor 02</span>
                <h3 className="text-lg font-bold text-white mt-4 mb-2 tracking-tight">Too Much Access</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Sharing a full account login can give someone more access than they actually need for their daily task.
                </p>
              </div>
            </div>

            <div className="p-7 rounded-2xl bg-gradient-to-b from-neutral-900/80 via-neutral-900/40 to-neutral-950 border border-neutral-850 hover:border-neutral-750 transition-all duration-300 group hover:shadow-xl hover:shadow-neutral-950/60 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6 text-white group-hover:scale-105 transition-transform shadow-inner">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded bg-neutral-900/90 text-neutral-400 border border-neutral-800 text-[10px] font-mono uppercase font-bold tracking-wider">Risk Factor 03</span>
                <h3 className="text-lg font-bold text-white mt-4 mb-2 tracking-tight">Verification Bottlenecks</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Team members can be delayed when they need a verification code from an administrator to complete a login.
                </p>
              </div>
            </div>

            <div className="p-7 rounded-2xl bg-gradient-to-b from-neutral-900/80 via-neutral-900/40 to-neutral-950 border border-neutral-850 hover:border-neutral-750 transition-all duration-300 group hover:shadow-xl hover:shadow-neutral-950/60 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6 text-white group-hover:scale-105 transition-transform shadow-inner">
                  <FileCheck className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded bg-neutral-900/90 text-neutral-400 border border-neutral-800 text-[10px] font-mono uppercase font-bold tracking-wider">Risk Factor 04</span>
                <h3 className="text-lg font-bold text-white mt-4 mb-2 tracking-tight">Unclear Activity History</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Lack of timestamped session records makes it hard to see who accessed what, when, and from where.
                </p>
              </div>
            </div>
          </div>

          {/* Feature Comparison Matrix */}
          <div className="mt-16 p-8 sm:p-10 rounded-2xl bg-neutral-900/40 border border-neutral-850 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-neutral-800">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Traditional Credential Sharing vs. WITHUS Session Delegation
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Side-by-side evaluation of security control and operational clarity.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-300">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                <span>Access Management Comparison</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 font-mono uppercase tracking-wider">
                    <th className="py-4 px-4 font-bold w-1/3">Feature Metric</th>
                    <th className="py-4 px-4 text-neutral-400 font-bold w-1/3 bg-neutral-950/40 rounded-tl-xl">Legacy Credential Sharing</th>
                    <th className="py-4 px-4 text-white font-bold w-1/3 bg-neutral-900/90 rounded-tr-xl border-t border-r border-l border-neutral-800">WITHUS Session Delegation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850/60 text-neutral-300">
                  <tr>
                    <td className="py-4 px-4 font-semibold text-neutral-200">Credential Visibility</td>
                    <td className="py-4 px-4 text-neutral-400 bg-neutral-950/40">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-neutral-500 shrink-0" />
                        <span>Exposed in plain text</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white font-semibold bg-neutral-900/60 border-r border-l border-neutral-800">
                      <div className="flex items-center gap-2 text-white">
                        <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                        <span>Protected in the WITHUS vault</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-semibold text-neutral-200">Verification Code Sharing</td>
                    <td className="py-4 px-4 text-neutral-400 bg-neutral-950/40">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-neutral-500 shrink-0" />
                        <span>Manual admin forwarding bottlenecks</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white font-semibold bg-neutral-900/60 border-r border-l border-neutral-800">
                      <div className="flex items-center gap-2 text-white">
                        <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                        <span>Automated verification assistance</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-semibold text-neutral-200">Session Duration</td>
                    <td className="py-4 px-4 text-neutral-400 bg-neutral-950/40">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-neutral-500 shrink-0" />
                        <span>Indefinite static access</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white font-semibold bg-neutral-900/60 border-r border-l border-neutral-800">
                      <div className="flex items-center gap-2 text-white">
                        <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                        <span>Time-limited access</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-semibold text-neutral-200">Activity History</td>
                    <td className="py-4 px-4 text-neutral-400 bg-neutral-950/40">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-neutral-500 shrink-0" />
                        <span>Limited visibility into access activity</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white font-semibold bg-neutral-900/60 border-r border-l border-neutral-800">
                      <div className="flex items-center gap-2 text-white">
                        <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                        <span>Timestamped activity history</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-semibold text-neutral-200">Access Revocation</td>
                    <td className="py-4 px-4 text-neutral-400 bg-neutral-950/40 rounded-bl-xl">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-neutral-500 shrink-0" />
                        <span>Tedious manual password resets</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white font-semibold bg-neutral-900/60 border-b border-r border-l border-neutral-800 rounded-br-xl">
                      <div className="flex items-center gap-2 text-white">
                        <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                        <span>Quick access revocation</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 3: THE WITHUS SOLUTION */}
        <section id="solution" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16 border-t border-neutral-900/80 scroll-mt-28">
          <div className="max-w-3xl mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-[11px] font-semibold uppercase tracking-wider font-mono mb-4">
              <Key className="w-3.5 h-3.5 text-white" />
              <span>How WITHUS Helps</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mt-1 mb-4">
              Give Access Without Handing Over the Password
            </h2>
            <p className="text-base sm:text-lg text-neutral-400 font-normal leading-relaxed">
              WITHUS helps organizations provide controlled access while keeping the underlying password protected.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-950 border border-neutral-800 relative overflow-hidden group hover:border-neutral-700 transition-all flex flex-col justify-between shadow-lg">
              <div>
                <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6 text-white shadow-inner">
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Controlled Platform Access</h3>
                <p className="text-neutral-400 text-xs leading-relaxed mb-6">
                  Give authorized team members access to supported platforms without directly giving them the stored password.
                </p>
                <ul className="space-y-3 text-xs text-neutral-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    <span>No password visibility for operators</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    <span>Access expiration and revocation</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-4 border-t border-neutral-850">
                <button
                  onClick={() => setIsDemoModalOpen(true)}
                  className="text-xs font-semibold text-white hover:text-neutral-300 flex items-center gap-1.5 cursor-pointer group"
                >
                  <span>Learn about Vault Security</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-950 border border-neutral-800 relative overflow-hidden group hover:border-neutral-700 transition-all flex flex-col justify-between shadow-lg">
              <div>
                <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6 text-white shadow-inner">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Access Control</h3>
                <p className="text-neutral-400 text-xs leading-relaxed mb-6">
                  Manage who receives access, how long it lasts, and when it should be removed.
                </p>
                <ul className="space-y-3 text-xs text-neutral-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    <span>Timestamped activity history</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    <span>Role-based permissions</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-4 border-t border-neutral-850">
                <button
                  onClick={() => setIsDemoModalOpen(true)}
                  className="text-xs font-semibold text-white hover:text-neutral-300 flex items-center gap-1.5 cursor-pointer group"
                >
                  <span>Explore Activity Logging</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-950 border border-neutral-800 relative overflow-hidden group hover:border-neutral-700 transition-all flex flex-col justify-between shadow-lg">
              <div>
                <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6 text-white shadow-inner">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Verification Code Assistance</h3>
                <p className="text-neutral-400 text-xs leading-relaxed mb-6">
                  Reduce manual verification-code sharing for supported workflows.
                </p>
                <ul className="space-y-3 text-xs text-neutral-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    <span>Less manual code forwarding</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    <span>Smooth login assistance</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-4 border-t border-neutral-850">
                <button
                  onClick={() => setIsDemoModalOpen(true)}
                  className="text-xs font-semibold text-white hover:text-neutral-300 flex items-center gap-1.5 cursor-pointer group"
                >
                  <span>Request Solution Demo</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: HOW ACCESS WORKS */}
        <section id="workflow" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16 border-t border-neutral-900/80 scroll-mt-28">
          <div className="max-w-3xl mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-[11px] font-semibold uppercase tracking-wider font-mono mb-4">
              <Layers className="w-3.5 h-3.5 text-white" />
              <span>How Access Works</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mt-1 mb-4">
              How Access Works
            </h2>
            <p className="text-base sm:text-lg text-neutral-400 font-normal leading-relaxed">
              A simple way to manage access from start to finish.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="p-7 rounded-2xl bg-neutral-900/40 border border-neutral-850 relative">
              <div className="w-8 h-8 rounded-full bg-neutral-800 text-white font-mono text-xs font-bold flex items-center justify-center mb-5">
                01
              </div>
              <h3 className="text-base font-bold text-white mb-2">Protect</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Keep the platform credential protected within WITHUS.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-neutral-900/40 border border-neutral-850 relative">
              <div className="w-8 h-8 rounded-full bg-neutral-800 text-white font-mono text-xs font-bold flex items-center justify-center mb-5">
                02
              </div>
              <h3 className="text-base font-bold text-white mb-2">Grant</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Give an authorized team member access for the work they need to perform.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-neutral-900/40 border border-neutral-850 relative">
              <div className="w-8 h-8 rounded-full bg-neutral-800 text-white font-mono text-xs font-bold flex items-center justify-center mb-5">
                03
              </div>
              <h3 className="text-base font-bold text-white mb-2">Control</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Set access duration and permissions.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-neutral-900/40 border border-neutral-850 relative">
              <div className="w-8 h-8 rounded-full bg-neutral-800 text-white font-mono text-xs font-bold flex items-center justify-center mb-5">
                04
              </div>
              <h3 className="text-base font-bold text-white mb-2">Revoke</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                End access when it is no longer required.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: WHO IT'S FOR / USE CASES */}
        <section id="use-cases" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16 border-t border-neutral-900/80 scroll-mt-28">
          <div className="max-w-3xl mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-[11px] font-semibold uppercase tracking-wider font-mono mb-4">
              <Users className="w-3.5 h-3.5 text-white" />
              <span>Workflow Personas</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mt-1 mb-4">
              Tailored access governance for technical operations
            </h2>
            <p className="text-base sm:text-lg text-neutral-400 font-normal leading-relaxed">
              WITHUS helps teams manage shared access with greater control and visibility.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-7 rounded-2xl bg-neutral-900/40 border border-neutral-850 hover:border-neutral-800 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-5 text-white">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Founders & Executives</h3>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                  Delegate domain management, cloud console access, or billing portals to team leaders without surrendering master account credentials.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-850 text-[10px]">Domain Management</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-850 text-[10px]">Cloud Console</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-850 text-[10px]">Billing Portals</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 text-[10px] font-mono text-center font-bold uppercase tracking-wider">Credential Protection</span>
            </div>

            <div className="p-7 rounded-2xl bg-neutral-900/40 border border-neutral-850 hover:border-neutral-800 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-5 text-white">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Agencies & MSPs</h3>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                  Request temporary client platform access effortlessly. Perform required configurations and hand back clean, logged sessions upon project completion.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-850 text-[10px]">Client Onboarding</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-850 text-[10px]">Task-Bound Access</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-850 text-[10px]">Clean Closure</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 text-[10px] font-mono text-center font-bold uppercase tracking-wider">Frictionless Access</span>
            </div>

            <div className="p-7 rounded-2xl bg-neutral-900/40 border border-neutral-850 hover:border-neutral-800 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-5 text-white">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">DevOps & Contractors</h3>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                  Onboard contractors for specific deployment tasks. Grant strictly time-limited sessions that expire when work concludes.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-850 text-[10px]">Deployment Tasks</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-850 text-[10px]">Time Limits</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-850 text-[10px]">Auto-Expire</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 text-[10px] font-mono text-center font-bold uppercase tracking-wider">Time-Limited Access</span>
            </div>

            <div className="p-7 rounded-2xl bg-neutral-900/40 border border-neutral-850 hover:border-neutral-800 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-5 text-white">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Operations & Security Teams</h3>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                  Keep better visibility into shared access and important access activity across the organization.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-850 text-[10px]">Activity History</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-850 text-[10px]">Access Oversight</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-850 text-[10px]">Role Governance</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 text-[10px] font-mono text-center font-bold uppercase tracking-wider">Activity History</span>
            </div>
          </div>
        </section>

        {/* SECTION 6: CAPABILITIES & INTEGRATION PILLS */}
        <section id="capabilities" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16 border-t border-neutral-900/80 scroll-mt-28">
          <div className="max-w-3xl mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-[11px] font-semibold uppercase tracking-wider font-mono mb-4">
              <Sliders className="w-3.5 h-3.5 text-white" />
              <span>Platform Capabilities</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mt-1 mb-4">
              Practical Tools for Access Management
            </h2>
            <p className="text-base sm:text-lg text-neutral-400 font-normal leading-relaxed">
              Designed to help modern teams manage shared credentials cleanly with control, time limits, and activity records.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-7 rounded-2xl bg-neutral-900/50 border border-neutral-850 hover:border-neutral-700 transition-all">
              <Lock className="w-6 h-6 text-white mb-5" />
              <h3 className="text-sm font-bold text-white mb-2">Protected Credential Vault</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Store organizational credentials in a protected central location instead of spreading them across messages and documents.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-neutral-900/50 border border-neutral-850 hover:border-neutral-700 transition-all">
              <Clock className="w-6 h-6 text-white mb-5" />
              <h3 className="text-sm font-bold text-white mb-2">Time-Limited Access</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Set access duration and allow sessions to expire when they are no longer needed.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-neutral-900/50 border border-neutral-850 hover:border-neutral-700 transition-all">
              <Activity className="w-6 h-6 text-white mb-5" />
              <h3 className="text-sm font-bold text-white mb-2">Activity History</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Keep a clear record of important access and authorization events.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-neutral-900/50 border border-neutral-850 hover:border-neutral-700 transition-all">
              <Globe className="w-6 h-6 text-white mb-5" />
              <h3 className="text-sm font-bold text-white mb-2">Multi-Platform Support</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Support for delegated access workflows across the current WITHUS platform ecosystem.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-neutral-900/50 border border-neutral-850 hover:border-neutral-700 transition-all">
              <RefreshCw className="w-6 h-6 text-white mb-5" />
              <h3 className="text-sm font-bold text-white mb-2">Quick Access Revocation</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Remove delegated access when it is no longer needed.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-neutral-900/50 border border-neutral-850 hover:border-neutral-700 transition-all">
              <Sliders className="w-6 h-6 text-white mb-5" />
              <h3 className="text-sm font-bold text-white mb-2">Role-Based Permissions</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Give different team members appropriate levels of access based on their responsibilities.
              </p>
            </div>
          </div>

          {/* Platform Integration Pill Strip - CATEGORIZED 11 APPROVED PLATFORMS */}
          <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-neutral-900/40 border border-neutral-850 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest font-mono">Supported Platform Ecosystem</span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white mt-1">Pre-Configured Platform Workflows</h4>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300 w-fit">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>11 Verified Platforms</span>
              </div>
            </div>

            {/* Responsive Balanced Grid: 1 col on mobile, 2 cols on SM, 3 cols on LG, 5 cols on XL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              
              {/* Category 1: Developer Tools */}
              <div className="p-5 rounded-xl bg-neutral-950/80 border border-neutral-850 hover:border-neutral-800 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Terminal className="w-4 h-4 text-neutral-400" />
                    <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold tracking-wider">Developer Tools</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:bg-neutral-850 hover:border-neutral-700 transition-all">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>GitHub</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:bg-neutral-850 hover:border-neutral-700 transition-all">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Vercel</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category 2: Domain & Infrastructure */}
              <div className="p-5 rounded-xl bg-neutral-950/80 border border-neutral-850 hover:border-neutral-800 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-neutral-400" />
                    <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold tracking-wider">Domain & Infrastructure</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:bg-neutral-850 hover:border-neutral-700 transition-all">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>GoDaddy</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:bg-neutral-850 hover:border-neutral-700 transition-all">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>LinkedIn</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category 3: Commerce & Payments */}
              <div className="p-5 rounded-xl bg-neutral-950/80 border border-neutral-850 hover:border-neutral-800 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-4 h-4 text-neutral-400" />
                    <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold tracking-wider">Commerce & Payments</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:bg-neutral-850 hover:border-neutral-700 transition-all">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Shopify</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:bg-neutral-850 hover:border-neutral-700 transition-all">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Stripe</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:bg-neutral-850 hover:border-neutral-700 transition-all">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Razorpay</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category 4: Business Registries */}
              <div className="p-5 rounded-xl bg-neutral-950/80 border border-neutral-850 hover:border-neutral-800 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-neutral-400" />
                    <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold tracking-wider">Business Registries</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:bg-neutral-850 hover:border-neutral-700 transition-all">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>MCA</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:bg-neutral-850 hover:border-neutral-700 transition-all">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>GST</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:bg-neutral-850 hover:border-neutral-700 transition-all">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Udyam</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category 5: Communications */}
              <div className="p-5 rounded-xl bg-neutral-950/80 border border-neutral-850 hover:border-neutral-800 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-neutral-400" />
                    <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold tracking-wider">Communications</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:bg-neutral-850 hover:border-neutral-700 transition-all">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Gmail</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 7: PRODUCT PREVIEW MOCKUP - CONCEPTUAL OVERVIEW */}
        <section id="preview" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16 border-t border-neutral-900/80 scroll-mt-28">
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-[11px] font-semibold uppercase tracking-wider font-mono mb-4">
              <Eye className="w-3.5 h-3.5 text-white" />
              <span>Product Preview</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mt-1 mb-4">
              Access Overview
            </h2>
            <p className="text-base sm:text-lg text-neutral-400 font-normal leading-relaxed">
              Conceptual overview of how team access is organized and monitored within WITHUS.
            </p>
          </div>

          {/* Conceptual Dark Dashboard Mockup */}
          <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-2xl overflow-hidden">
            
            {/* Top Control & Navigation Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 mr-2">
                  <div className="w-3 h-3 rounded-full bg-neutral-700" />
                  <div className="w-3 h-3 rounded-full bg-neutral-800" />
                  <div className="w-3 h-3 rounded-full bg-neutral-800" />
                </div>
                <div className="h-4 w-px bg-neutral-800 hidden sm:block" />
                <span className="text-xs font-bold text-white tracking-wide font-mono">WITHUS Governance Console</span>
                <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px] font-mono font-semibold">Demo Sandbox</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-850 border border-neutral-750 text-xs font-semibold text-neutral-200 flex items-center gap-1.5 select-none"
                >
                  <Globe className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Browser Extension</span>
                </div>
                <div
                  className="px-4 py-1.5 rounded-lg bg-white text-neutral-950 text-xs font-bold shadow-xs flex items-center gap-1.5 select-none"
                >
                  <span>+ New Vault</span>
                </div>
              </div>
            </div>

            {/* Dashboard Content Mockup Body */}
            <div className="p-6 sm:p-8 space-y-8 bg-neutral-950/30">

              {/* Greeting Header */}
              <div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">WITHUS</span>
                <h3 className="text-2xl font-extrabold text-white mt-0.5 tracking-tight flex items-center gap-2">
                  <span>Welcome, Alex</span>
                  <span className="text-xl">👋</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Secure Access Platform — Manage repositories, credentials, and temporary access safely.
                </p>
              </div>

              {/* Stat Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-xl bg-neutral-900/80 border border-neutral-850 flex items-center justify-between shadow-xs">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-750 flex items-center justify-center text-white mb-3">
                      <Key className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-3xl font-extrabold text-white font-mono">11</div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold mt-1">Active Vaults</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-600" />
                </div>

                <div className="p-5 rounded-xl bg-neutral-900/80 border border-neutral-850 flex items-center justify-between shadow-xs">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-750 flex items-center justify-center text-white mb-3">
                      <FileCheck className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-3xl font-extrabold text-white font-mono">0</div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold mt-1">Pending Approvals</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-600" />
                </div>

                <div className="p-5 rounded-xl bg-neutral-900/80 border border-neutral-850 flex items-center justify-between shadow-xs">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-750 flex items-center justify-center text-white mb-3">
                      <Users className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-3xl font-extrabold text-white font-mono">3</div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold mt-1">Active Sessions</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-600" />
                </div>
              </div>

              {/* Recent Vaults Table */}
              <div className="p-6 rounded-xl bg-neutral-900/60 border border-neutral-850 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Recent Vaults</h4>
                  <div className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
                    <span>VIEW ALL</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                    <thead>
                      <tr className="text-neutral-500 font-mono uppercase tracking-wider text-[10px] border-b border-neutral-850">
                        <th className="pb-3 px-2 font-bold">Vault Name</th>
                        <th className="pb-3 px-2 font-bold">Description</th>
                        <th className="pb-3 px-2 font-bold">Created</th>
                        <th className="pb-3 px-2 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-850/50 text-neutral-300">
                      {[
                        { name: 'GitHub', desc: 'Engineering source code repository', date: '02/09/2026' },
                        { name: 'Vercel', desc: 'Cloud deployment console', date: '01/09/2026' },
                        { name: 'GoDaddy', desc: 'Domain registrar management', date: '16/08/2026' },
                        { name: 'Shopify', desc: 'E-commerce storefront portal', date: '16/08/2026' },
                        { name: 'Gmail', desc: 'Organizational communications', date: '10/08/2026' },
                      ].map((vault, i) => (
                        <tr key={i} className="hover:bg-neutral-850/40 transition-colors">
                          <td className="py-3 px-2 font-semibold text-white flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded bg-neutral-800 border border-neutral-750 flex items-center justify-center text-neutral-300 shrink-0">
                              <Key className="w-3 h-3" />
                            </div>
                            <span>{vault.name}</span>
                          </td>
                          <td className="py-3 px-2 text-neutral-400">{vault.desc}</td>
                          <td className="py-3 px-2 text-neutral-500 font-mono text-[11px]">{vault.date}</td>
                          <td className="py-3 px-2 text-right">
                            <span className="text-[11px] font-semibold text-neutral-300 inline-flex items-center gap-1">
                              <span>OPEN</span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                  className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-850 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-neutral-850 border border-neutral-750 flex items-center justify-center text-neutral-200 mb-3">
                    <Key className="w-4 h-4" />
                  </div>
                  <h5 className="text-xs font-bold text-white">Manage Vaults</h5>
                  <p className="text-[10px] text-neutral-400 mt-0.5">View and create storage keys</p>
                </div>

                <div
                  className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-850 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-neutral-850 border border-neutral-750 flex items-center justify-center text-neutral-200 mb-3">
                    <Users className="w-4 h-4" />
                  </div>
                  <h5 className="text-xs font-bold text-white">Sessions</h5>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Manage access allocations</p>
                </div>

                <div
                  className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-850 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-neutral-850 border border-neutral-750 flex items-center justify-center text-neutral-200 mb-3">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <h5 className="text-xs font-bold text-white">Approvals</h5>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Authorize request workflows</p>
                </div>

                <div
                  className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-850 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-neutral-850 border border-neutral-750 flex items-center justify-center text-neutral-200 mb-3">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h5 className="text-xs font-bold text-white">Team Roles</h5>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Manage team role access</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 8: APPROVED WITHUS PRICING TIERS */}
        <section id="pricing" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16 border-t border-neutral-900/80 scroll-mt-28">
          <div className="max-w-3xl mb-16 text-center mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-[11px] font-semibold uppercase tracking-wider font-mono mb-4">
              <BarChart3 className="w-3.5 h-3.5 text-white" />
              <span>Simple Pricing</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mt-1 mb-4">
              Transparent plans tailored to your team scale
            </h2>
            <p className="text-base sm:text-lg text-neutral-400 font-normal leading-relaxed">
              Choose the tier that matches your team size, delegation frequency, and platform needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* FREE TIER */}
            <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-850 flex flex-col justify-between hover:border-neutral-800 transition-all">
              <div>
                <h3 className="text-lg font-bold text-white">FREE</h3>
                <p className="text-xs text-neutral-400 mt-1">Get started with essential platform delegation.</p>
                <div className="mt-6 text-3xl font-extrabold text-white">₹0 <span className="text-xs font-normal text-neutral-400">/ month</span></div>
                <ul className="mt-6 space-y-3.5 text-xs text-neutral-300">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span>2 Users</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span>Any 2 Supported Platforms</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span>1 Admin</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span>Basic Audit History</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="mt-8 w-full py-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Request Access
              </button>
            </div>

            {/* PRO TIER */}
            <div className="p-8 rounded-2xl bg-neutral-900 border border-neutral-700 relative flex flex-col justify-between shadow-2xl">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-white text-neutral-950 text-[10px] font-extrabold uppercase tracking-wider shadow-md">
                Most Popular
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">PRO</h3>
                <p className="text-xs text-neutral-400 mt-1">For growing teams that need broader platform access and supported OTP assistance.</p>
                <div className="mt-6 text-3xl font-extrabold text-white">₹499 <span className="text-xs font-normal text-neutral-400">/ month (₹4,990/yr)</span></div>
                <ul className="mt-6 space-y-3.5 text-xs text-neutral-300">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span>5 Users Included (Add-ons available)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span>All Supported Platforms</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span>2 Admins</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span>OTP Capability</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span>Full Audit History & Priority Support</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="mt-8 w-full py-3.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs transition-colors cursor-pointer shadow-md"
              >
                Request Demo
              </button>
            </div>

            {/* BUSINESS TIER */}
            <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-850 flex flex-col justify-between hover:border-neutral-800 transition-all">
              <div>
                <h3 className="text-lg font-bold text-white">BUSINESS</h3>
                <p className="text-xs text-neutral-400 mt-1">Advanced access control, health monitoring & unlimited admins.</p>
                <div className="mt-6 text-3xl font-extrabold text-white">₹1,999 <span className="text-xs font-normal text-neutral-400">/ month (₹19,990/yr)</span></div>
                <ul className="mt-6 space-y-3.5 text-xs text-neutral-300">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span>15 Users Included (Add-ons available)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span>Unlimited Admins</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span>All Supported Platforms</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span>Module-Based Control & Health Monitoring</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span>Advanced Audit History & Priority Support</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="mt-8 w-full py-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Contact Team
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 9: CURRENT STAGE / PROGRESS */}
        <section id="stage" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16 border-t border-neutral-900/80 scroll-mt-28">
          <div className="max-w-3xl mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-[11px] font-semibold uppercase tracking-wider font-mono mb-4">
              <CheckSquare className="w-3.5 h-3.5 text-white" />
              <span>Current Stage</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mt-1 mb-4">
              Core Product Implemented
            </h2>
            <p className="text-base sm:text-lg text-neutral-400 font-normal leading-relaxed">
              WITHUS has its core access-management capabilities implemented and deployed, and is available for product demonstrations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-7 rounded-2xl bg-neutral-900/40 border border-neutral-850">
              <div className="flex items-center gap-2.5 text-neutral-200 font-semibold text-sm mb-3">
                <CheckCircle2 className="w-4.5 h-4.5 text-white" />
                <span>Core Product Implemented</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                WITHUS has its core access-management capabilities implemented and deployed, and is available for product demonstrations.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-neutral-900/40 border border-neutral-850">
              <div className="flex items-center gap-2.5 text-neutral-200 font-semibold text-sm mb-3">
                <Globe className="w-4.5 h-4.5 text-white" />
                <span>Platform Support</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                WITHUS currently supports delegated access workflows across its supported platform ecosystem.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-neutral-900/40 border border-neutral-850">
              <div className="flex items-center gap-2.5 text-neutral-200 font-semibold text-sm mb-3">
                <FileCheck className="w-4.5 h-4.5 text-white" />
                <span>Public Product Stage</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                WITHUS is being prepared for broader adoption, demonstrations, grant applications, and partner discussions.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 10: FINAL CTA & FOOTER */}
        <section id="cta" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-16 border-t border-neutral-900/80 scroll-mt-28">
          <div className="p-12 md:p-16 rounded-3xl bg-gradient-to-b from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800 text-center relative overflow-hidden shadow-2xl">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest font-mono">Get Started</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mt-2">
              Ready to simplify shared platform access?
            </h2>
            <p className="mt-4 text-base text-neutral-400 max-w-xl mx-auto leading-relaxed">
              Schedule a demonstration with our team to see how WITHUS manages access delegation.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="w-full sm:w-auto px-9 py-4 rounded-xl bg-white text-neutral-950 font-bold text-sm hover:bg-neutral-100 transition-all shadow-xl cursor-pointer"
              >
                Request Product Demo
              </button>
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="w-full sm:w-auto px-9 py-4 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 font-semibold text-sm hover:bg-neutral-850 hover:text-white transition-all cursor-pointer"
              >
                Contact Sales Team
              </button>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-20 pt-8 border-t border-neutral-900 text-center sm:flex sm:items-center sm:justify-between text-xs text-neutral-500 pb-10">
            <p>&copy; {new Date().getFullYear()} WITHUS. All rights reserved.</p>
            <div className="mt-4 sm:mt-0 flex items-center justify-center gap-6">
              <a href="#hero" className="hover:text-neutral-300 transition-colors">Back to Top</a>
              <button onClick={() => setIsDemoModalOpen(true)} className="hover:text-neutral-300 transition-colors cursor-pointer">Request Demo</button>
            </div>
          </footer>
        </section>

      </main>

      {/* Demo Request Modal */}
      <DemoRequestModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </div>
  );
}