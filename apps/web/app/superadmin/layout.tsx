'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth/AuthContext';
import { SuperAdminShell } from '../../components/super-admin/SuperAdminShell';

/**
 * SuperAdmin Layout
 * 
 * Provides 3-layer protection:
 * Layer 1: middleware.ts — redirects unauthenticated users to /login
 * Layer 2: This client-side guard — redirects non-super-admins to /dashboard  
 * Layer 3: Backend SuperAdminGuard — returns 403 for any API call from non-super-admins
 */
export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !user.isSuperAdmin) {
      // This user is logged in but is NOT a Super Admin — redirect to their org dashboard
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#07070a]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#7c6dfa] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#6b6b80] font-medium tracking-widest uppercase">Loading</p>
        </div>
      </div>
    );
  }

  if (!user || !user.isSuperAdmin) {
    // Don't render anything while the redirect is in progress
    return (
      <div className="h-screen flex items-center justify-center bg-[#07070a]">
        <div className="text-xs text-[#6b6b80]">Redirecting...</div>
      </div>
    );
  }

  return <SuperAdminShell>{children}</SuperAdminShell>;
}
