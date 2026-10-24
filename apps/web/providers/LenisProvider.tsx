'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Clean up any existing instance
    if (lenisRef.current) {
      lenisRef.current.destroy();
      lenisRef.current = null;
    }

    let active = true;

    const setupLenis = () => {
      if (!active) return;

      // Automatically detect if the current view renders an inner shell scroll canvas (e.g. DashboardShell, SuperAdminShell)
      // or standard document-level scrolling (e.g. Login, Register, Pricing, Legal policies)
      const shellMain = document.querySelector('main.overflow-y-auto') as HTMLElement | null;

      let wrapper: HTMLElement | Window = window;
      let content: HTMLElement = document.documentElement;

      if (shellMain) {
        wrapper = shellMain;
        content = (shellMain.firstElementChild as HTMLElement) || shellMain;
      }

      const lenis = new Lenis({
        wrapper: wrapper,
        content: content,
        eventsTarget: wrapper === window ? window : wrapper,
        lerp: 0.08,
        wheelMultiplier: 0.9,
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        syncTouch: false, // 100% native mobile touch momentum
        autoRaf: true,
        prevent: (node) => {
          if (!node || !(node instanceof HTMLElement)) return false;
          // Never intercept scroll inside Modals, Dialogs, Select dropdowns, or Sidebar
          if (
            node.closest(
              '[data-lenis-prevent], [role="dialog"], [role="menu"], [role="listbox"], aside, [data-radix-popper-content-wrapper]'
            )
          ) {
            return true;
          }
          const scrollable = node.closest('.overflow-y-auto, .overflow-auto, .overflow-y-scroll, .custom-scrollbar');
          if (scrollable && scrollable !== wrapper) {
            return true;
          }
          return false;
        },
      });

      const handleResize = () => lenis.resize();
      window.addEventListener('resize', handleResize, { passive: true });

      lenisRef.current = lenis;
      (window as any).sdapLenis = lenis;
    };

    // Initialize with slight yield for Next.js DOM readiness
    const timer = setTimeout(setupLenis, 30);

    return () => {
      active = false;
      clearTimeout(timer);
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      if ((window as any).sdapLenis) {
        delete (window as any).sdapLenis;
      }
    };
  }, [pathname]);

  return <>{children}</>;
}
