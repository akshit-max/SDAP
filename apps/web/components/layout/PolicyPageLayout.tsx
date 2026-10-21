'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { PublicFooter } from './PublicFooter';

interface PolicyPageLayoutProps {
  title: string;
  lastUpdated?: string;
  badge?: string;
  children: React.ReactNode;
}

export function PolicyPageLayout({
  title,
  lastUpdated = 'August 24, 2026',
  badge = 'LEGAL & COMPLIANCE',
  children,
}: PolicyPageLayoutProps) {
  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden overflow-y-auto text-white font-geist antialiased selection:bg-white selection:text-zinc-950">
      {/* WithUs Hero Rainbow Blue Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-[#2b416c] to-[#5879b0]">
        <img
          src="/shadow-bg.png"
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover mix-blend-color-burn opacity-70"
        />
        <img
          src="/sun-halo.png"
          alt=""
          className="pointer-events-none select-none absolute inset-0 h-full w-full object-cover object-center opacity-90 mix-blend-screen"
        />
        <div
          className="pointer-events-none absolute h-screen w-[16rem] rounded-full right-[24rem] top-0 rotate-45 opacity-40"
          style={{
            background: '#ffffff',
            boxShadow: '0 6.719px 50.393px 0 #ffffff inset',
            filter: 'blur(200px)',
          }}
        />
      </div>

      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex items-center justify-between relative z-20">
        <Link href="/" className="flex items-center hover:opacity-90 transition-opacity group">
          <img
            src="/withus_white_full.png"
            alt="WithUs"
            className="h-8 sm:h-9 w-auto object-contain select-none group-hover:scale-105 transition-transform"
          />
        </Link>

        <div className="flex items-center gap-3 text-xs">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-white/30 hover:border-white/70 hover:bg-white/10 text-white font-medium transition-all shadow-sm backdrop-blur-md"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/register"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-zinc-950 font-medium hover:bg-zinc-100 transition-all shadow-sm"
          >
            <span>Create Workspace</span>
          </Link>
        </div>
      </header>

      {/* Main Document Content */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Document Header */}
        <div className="text-center space-y-3 mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.12] border border-white/20 text-[11px] font-bold tracking-widest uppercase text-white/90 backdrop-blur-md">
            <span>{badge}</span>
          </div>
          <h1 className="font-geist text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-white/75 font-normal">
            Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Apple Frosted Glass Document Container */}
        <div className="w-full rounded-[32px] p-6 sm:p-10 md:p-14 bg-white/[0.10] backdrop-blur-2xl border border-white/25 shadow-[0_28px_60px_-12px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.35)] text-white space-y-10 sm:space-y-12">
          {children}

          <PublicFooter />
        </div>
      </main>

      {/* Subtle Bottom Spacing */}
      <div className="h-6" />
    </div>
  );
}
