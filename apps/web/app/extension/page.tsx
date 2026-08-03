'use client';

import React, { useState } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { 
  Download, 
  FolderArchive, 
  Compass, 
  ToggleRight, 
  FolderOpen, 
  CheckCircle2, 
  ExternalLink,
  Info
} from 'lucide-react';

export default function ExtensionPage() {
  const [copiedLink, setCopiedLink] = useState(false);

  const steps = [
    {
      number: 1,
      title: 'Download Extension',
      description: 'Get the stable WithUs extension package compiled for your workspace.',
      icon: Download,
      badge: 'ZIP Archive',
    },
    {
      number: 2,
      title: 'Extract the ZIP',
      description: 'Unzip the downloaded archive to a permanent directory on your local machine.',
      icon: FolderArchive,
    },
    {
      number: 3,
      title: 'Open Extension Settings',
      description: 'Navigate to chrome://extensions or edge://extensions in your web browser.',
      icon: Compass,
      actionText: 'Copy Link',
      action: () => {
        navigator.clipboard.writeText('chrome://extensions');
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    },
    {
      number: 4,
      title: 'Enable Developer Mode',
      description: 'Turn on the "Developer mode" toggle switch in the top right corner of the extension page.',
      icon: ToggleRight,
    },
    {
      number: 5,
      title: 'Load Unpacked',
      description: 'Click the "Load unpacked" button in the top left corner.',
      icon: FolderOpen,
    },
    {
      number: 6,
      title: 'Select Extracted Folder',
      description: 'Select the unzipped folder. The extension icon will now appear in your browser toolbar!',
      icon: CheckCircle2,
    }
  ];

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="pb-4 border-b border-premium flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-premium-main">Browser Extension</h1>
            <p className="text-xs text-premium-muted mt-1 font-semibold leading-relaxed">
              Autofill credentials directly into target websites securely and dynamically through WithUs.
            </p>
          </div>
          <div className="flex-shrink-0">
            <a
              href="/downloads/WITHUS-Extension.zip"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-premium-main hover:bg-premium-main/90 text-premium-surface text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Extension (ZIP)
            </a>
          </div>
        </div>

        {/* Future Ready / Webstore Announcement Alert */}
        <div className="p-4 bg-slate-50/50 dark:bg-zinc-900/30 border border-premium rounded-lg flex items-start gap-3">
          <Info className="w-4 h-4 text-premium-main mt-0.5 flex-shrink-0" />
          <div className="text-xs text-premium-muted leading-relaxed font-semibold">
            <p className="text-premium-main font-bold mb-0.5">Looking for the Web Store version?</p>
            WithUs is currently undergoing reviews for public extension stores. In the meantime, you can install the developer version using the step-by-step instructions below. Once approved, you'll be able to install it directly with a single click.
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.number} 
                className="premium-card p-5 flex flex-col justify-between hover:border-premium-main/30 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-premium-muted uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                      Step {step.number}
                    </span>
                    {step.badge && (
                      <span className="text-[9px] font-bold bg-premium-main/10 text-premium-main border border-premium-main/20 px-2 py-0.5 rounded-full">
                        {step.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3.5">
                    <div className="w-8 h-8 rounded-lg border border-premium flex items-center justify-center bg-slate-50/30 dark:bg-zinc-900/10 flex-shrink-0">
                      <Icon className="w-4.5 h-4.5 text-premium-main" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-premium-main">{step.title}</h3>
                      <p className="text-[11px] text-premium-muted font-medium mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Optional Step Actions */}
                {step.number === 1 && (
                  <div className="mt-4 pt-3 border-t border-premium flex justify-end">
                    <a
                      href="/downloads/WITHUS-Extension.zip"
                      className="text-[10px] font-bold text-premium-main hover:underline flex items-center gap-1.5"
                    >
                      Download Package <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {step.number === 3 && step.action && (
                  <div className="mt-4 pt-3 border-t border-premium flex justify-end">
                    <button
                      onClick={step.action}
                      className="text-[10px] font-bold text-premium-main hover:underline"
                    >
                      {copiedLink ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Verification Checklist Card */}
        <div className="premium-card p-6">
          <h2 className="text-xs font-bold text-premium-main uppercase tracking-wider mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Verification Checklist
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-premium-muted font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              WithUs extension badge appears in your browser bar
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              Clicking the icon shows "WithUs Vault" pop-up
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              Status indicator in top right shows a green dot when logged in
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              Autofill prompts automatically trigger on logins (e.g. Vercel, GoDaddy)
            </div>
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}
