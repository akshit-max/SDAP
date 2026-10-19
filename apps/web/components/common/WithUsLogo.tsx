'use client';

import React from 'react';
import clsx from 'clsx';

interface WithUsLogoProps {
  className?: string;
  height?: string;
  variant?: 'full' | 'icon';
  forceTheme?: 'light' | 'dark';
}

export function WithUsStar({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <img
      src="/withus_white_emblem.png"
      alt="WithUs"
      className={clsx("object-contain select-none", className)}
    />
  );
}

export function WithUsLogo({ className, height = "h-8", variant = 'full', forceTheme }: WithUsLogoProps) {
  if (variant === 'icon') {
    return <WithUsStar className={clsx(className || "w-6 h-6 text-zinc-900 dark:text-zinc-100")} />;
  }

  if (forceTheme === 'dark') {
    return (
      <div className={clsx("relative flex items-center select-none", className)}>
        <img
          src="/withus_white_full.png"
          alt="WithUs"
          className={clsx(height, "w-auto object-contain")}
        />
      </div>
    );
  }

  if (forceTheme === 'light') {
    return (
      <div className={clsx("relative flex items-center select-none", className)}>
        <img
          src="/withus_black_full.png"
          alt="WithUs"
          className={clsx(height, "w-auto object-contain")}
        />
      </div>
    );
  }

  return (
    <div className={clsx("relative flex items-center select-none", className)}>
      <img
        src="/withus_black_full.png"
        alt="WithUs"
        className={clsx(height, "w-auto object-contain dark:hidden")}
      />
      <img
        src="/withus_white_full.png"
        alt="WithUs"
        className={clsx(height, "w-auto object-contain hidden dark:block")}
      />
    </div>
  );
}
