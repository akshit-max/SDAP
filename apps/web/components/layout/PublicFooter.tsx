import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="text-center text-xs text-white/70 font-medium border-t border-white/20 mt-12 pt-8 select-none">
      <p className="text-[11px] sm:text-xs">
        &copy; {new Date().getFullYear()} WithUs Inc. All rights reserved.
      </p>
      <div className="mt-4 flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-[11px] sm:text-xs">
        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
        <span className="text-white/40 hidden sm:inline">&bull;</span>
        <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
        <span className="text-white/40 hidden sm:inline">&bull;</span>
        <Link href="/security" className="hover:text-white transition-colors">Security & Data Protection</Link>
        <span className="text-white/40 hidden sm:inline">&bull;</span>
        <Link href="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
        <span className="text-white/40 hidden sm:inline">&bull;</span>
        <Link href="/refund-policy" className="hover:text-white transition-colors">Refund & Cancellation</Link>
      </div>
      <div className="mt-6 pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-white/25 hover:border-white/60 hover:bg-white/10 text-white/90 hover:text-white text-xs transition-all backdrop-blur-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Home</span>
        </Link>
      </div>
    </footer>
  );
}
