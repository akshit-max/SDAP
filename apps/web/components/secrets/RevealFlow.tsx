'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRevealSecret } from '../../hooks/useRevealSecret';
import { Eye, EyeOff, AlertTriangle, Loader2, Copy, Check } from 'lucide-react';

interface RevealFlowProps {
  orgId: string;
  vaultId: string;
  secretId: string;
}

export function RevealFlow({ orgId, vaultId, secretId }: RevealFlowProps) {
  const [reason, setReason] = useState('');
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const { mutate, isPending, error, reset } = useRevealSecret();

  const handleClear = useCallback(() => {
    setPlaintext(null);
    setReason('');
    setShowForm(false);
    reset();
  }, [reset]);

  // Clear plaintext on unmount or after 60 seconds
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (plaintext) {
      timeout = setTimeout(() => {
        handleClear();
      }, 60000);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [plaintext, handleClear]);

  const handleReveal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    mutate(
      { orgId, vaultId, secretId, reason },
      {
        onSuccess: (data) => {
          setPlaintext(data.plaintext);
          setShowForm(false);
          setReason('');
        },
      }
    );
  };



  const handleCopy = async () => {
    if (plaintext) {
      await navigator.clipboard.writeText(plaintext);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (plaintext) {
    return (
      <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-250/20 dark:border-amber-900/20 rounded-lg p-5 relative">
        <div className="flex items-center text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-3">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Secret Revealed
        </div>
        
        <div className="bg-slate-900 dark:bg-slate-950 border border-slate-950 dark:border-slate-900 text-slate-100 rounded-lg p-3.5 font-mono text-xs break-all selection:bg-slate-800">
          {plaintext}
        </div>

        <div className="mt-3.5 flex space-x-2.5">
          <button
            onClick={handleCopy}
            className="flex items-center px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-xs transition-colors shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          
          <button
            onClick={handleClear}
            className="flex items-center px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg font-semibold text-xs transition-colors shadow-sm"
          >
            <EyeOff className="w-3.5 h-3.5 mr-1.5" />
            Hide Secret
          </button>
        </div>
        <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-3 font-medium">
          This secret will automatically hide in 60 seconds.
        </p>
      </div>
    );
  }

  if (showForm) {
    return (
      <form onSubmit={handleReveal} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4">Provide Audit Reason</h3>
        
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 flex items-start gap-2.5">
            <span className="text-red-500 mt-0.5">⚠</span>
            <p className="text-xs font-medium text-red-700 dark:text-red-400">{error.message}</p>
          </div>
        )}

        <div className="mb-4 space-y-1.5">
          <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400">
            Why do you need to view this secret?
          </label>
          <input
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:ring-slate-100/10 dark:focus:border-slate-100 outline-none transition-all text-slate-950 dark:text-slate-50 text-xs"
            placeholder="e.g. Debugging production database issue ticket #1234"
          />
        </div>
        
        <div className="flex space-x-2.5">
          <button
            type="submit"
            disabled={isPending || !reason.trim()}
            className="flex items-center px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Eye className="w-3.5 h-3.5 mr-1.5" />
            )}
            Reveal
          </button>
          
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              reset();
            }}
            disabled={isPending}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-xs transition-colors shadow-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-755 dark:text-slate-300 rounded-lg font-semibold text-xs transition-all duration-150 shadow-sm"
    >
      <Eye className="w-3.5 h-3.5 mr-1.5" />
      Reveal Secret Value
    </button>
  );
}
