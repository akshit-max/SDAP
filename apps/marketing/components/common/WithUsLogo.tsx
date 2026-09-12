'use client';

import React from 'react';
import clsx from 'clsx';

interface WithUsLogoProps {
  className?: string;
  height?: string;
  variant?: 'full' | 'icon';
}

export function WithUsStar({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <g stroke="currentColor" strokeWidth="7" strokeLinecap="round">
        <line x1="32" y1="10" x2="32" y2="54" />
        <line x1="10" y1="32" x2="54" y2="32" />
        <line x1="16.44" y1="16.44" x2="47.56" y2="47.56" />
        <line x1="16.44" y1="47.56" x2="47.56" y2="16.44" />
      </g>
    </svg>
  );
}

export function WithUsLogo({ className, height = "h-8", variant = 'full' }: WithUsLogoProps) {
  if (variant === 'icon') {
    return <WithUsStar className={clsx(className || "w-6 h-6 text-zinc-900 dark:text-zinc-100")} />;
  }

  return (
    <div className={clsx("relative flex items-center select-none", className)}>
      <img
        src="/logo-light.png"
        alt="WithUs"
        className={clsx(height, "w-auto object-contain dark:hidden")}
      />
      <img
        src="/logo-dark.png"
        alt="WithUs"
        className={clsx(height, "w-auto object-contain hidden dark:block")}
      />
    </div>
  );
}
