import Link from 'next/link';
import { ArrowLeft, Home, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 text-white font-sans overflow-hidden">
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

      {/* Main Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-md mx-auto rounded-3xl bg-white/[0.08] backdrop-blur-xl border border-white/20 p-8 shadow-2xl text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
          <ShieldAlert className="w-8 h-8 text-white/90" />
        </div>

        <span className="text-[11px] font-mono uppercase tracking-widest text-white/70 font-semibold px-3 py-1 rounded-full bg-white/10 border border-white/15">
          Error 404
        </span>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
          Page Not Found
        </h1>

        <p className="mt-2 text-sm text-white/80 leading-relaxed">
          The requested page could not be located or has been moved to a different access route.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#2b416c] text-xs font-semibold hover:bg-white/90 transition-all shadow-md active:scale-95"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return Home</span>
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-all border border-white/20 shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
