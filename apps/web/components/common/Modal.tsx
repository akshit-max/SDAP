'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const sdapLenis = (window as any).sdapLenis;
      sdapLenis?.stop?.();

      return () => {
        document.removeEventListener('keydown', handleKey);
        document.body.style.overflow = originalOverflow;
        sdapLenis?.start?.();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-lenis-prevent="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        data-lenis-prevent="true"
        className={`relative w-full ${maxWidth} max-h-[min(calc(100vh-2.5rem),90vh)] flex flex-col bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-premium overflow-hidden my-auto`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-premium flex-shrink-0">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div
          data-lenis-prevent="true"
          className="p-6 overflow-y-auto flex-1 min-h-0 custom-scrollbar"
          style={{ minHeight: 0, overscrollBehavior: 'contain' }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
