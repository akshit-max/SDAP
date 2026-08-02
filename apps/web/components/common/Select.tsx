'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className={clsx("relative w-full", className)} ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2 text-left bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:ring-slate-150/10 dark:focus:border-zinc-700 outline-none transition-all text-slate-950 dark:text-zinc-50 text-sm flex items-center justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className="w-4 h-4 text-slate-400 dark:text-zinc-500 flex-shrink-0 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-full max-h-60 overflow-y-auto bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 py-1">
          {options.length === 0 ? (
            <div className="px-3.5 py-2 text-xs text-slate-450 dark:text-zinc-500 italic">
              No options available
            </div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={clsx(
                  "w-full text-left px-3.5 py-2 text-xs font-semibold transition-colors truncate block",
                  opt.value === value
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
                    : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900"
                )}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
