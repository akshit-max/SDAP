'use client';

import React, { useState } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { useAuth } from '../../lib/auth/AuthContext';
import { useUpdateOrganization } from '../../hooks/useOrganization';
import { useToast } from '../../components/common/Toast';
import { Loader2, Building2 } from 'lucide-react';

export default function SettingsPage() {
  const { organization, refreshContext } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(organization?.name || '');
  const { mutate: updateOrg, isPending } = useUpdateOrganization(organization?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateOrg(
      { name: name.trim() },
      {
        onSuccess: () => {
          toast('success', 'Workspace name updated.');
          refreshContext();
        },
        onError: (err) => toast('error', err.message || 'Failed to update workspace.'),
      }
    );
  };

  return (
    <DashboardShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Workspace Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage your organization configuration.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              General
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Workspace Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Organization ID</label>
              <input
                type="text"
                readOnly
                value={organization?.id || ''}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 text-xs font-mono cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400">Use this ID when calling the API directly.</p>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending || !name.trim() || name === organization?.name}
                className="flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
