'use client';

import React, { useState, useEffect } from 'react';
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
  }, [plaintext]);

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

  const handleClear = () => {
    setPlaintext(null);
    setReason('');
    setShowForm(false);
    reset();
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
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 relative">
        <div className="flex items-center text-yellow-800 mb-4 font-medium">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Secret Revealed
        </div>
        
        <div className="bg-white border border-gray-200 rounded-md p-4 font-mono text-sm break-all">
          {plaintext}
        </div>

        <div className="mt-4 flex space-x-3">
          <button
            onClick={handleCopy}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium text-sm transition-colors"
          >
            {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          
          <button
            onClick={handleClear}
            className="flex items-center px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-md font-medium text-sm transition-colors"
          >
            <EyeOff className="w-4 h-4 mr-2" />
            Hide Secret
          </button>
        </div>
        <p className="text-xs text-yellow-600 mt-4">
          This secret will automatically hide in 60 seconds.
        </p>
      </div>
    );
  }

  if (showForm) {
    return (
      <form onSubmit={handleReveal} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Provide Audit Reason</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error.message}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Why do you need to view this secret?
          </label>
          <input
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. Debugging production database issue ticket #1234"
          />
        </div>
        
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isPending || !reason.trim()}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Eye className="w-4 h-4 mr-2" />
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
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium text-sm transition-colors"
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
      className="flex items-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md font-medium text-sm transition-colors"
    >
      <Eye className="w-4 h-4 mr-2" />
      Reveal Secret Value
    </button>
  );
}
