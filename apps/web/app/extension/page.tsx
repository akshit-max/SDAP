'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
        <div className="pb-4 border-b border-zinc-200/80 dark:border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-5 h-[1.5px] bg-sky-500" />
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                AUTOMATION & AGENTS
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Browser Extension
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Autofill credentials directly into target websites securely and dynamically through WithUs.
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2.5 flex-wrap">
            <a
              href="https://chromewebstore.google.com/detail/withus-vault/ccelghkaoejlmljlhcefnkbcbfmoge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-zinc-200 dark:border-white/15 bg-white/70 dark:bg-white/[0.06] hover:bg-white dark:hover:bg-white/[0.12] text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white text-xs font-bold transition-all shadow-sm"
            >
              <svg className="w-4 h-4 text-zinc-900 dark:text-zinc-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
                <line x1="21.17" y1="8" x2="12" y2="8" />
                <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
                <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
              </svg>
              <span>Chrome Web Store</span>
            </a>
            <a
              href="/downloads/WITHUS-Extension.zip"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold transition-all shadow-sm active:scale-[0.99]"
            >
              <Download className="w-4 h-4" />
              <span>Download Extension (ZIP)</span>
            </a>
          </div>
        </div>

        {/* Future Ready / Webstore Announcement Alert */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-white/[0.03] backdrop-blur-md border border-zinc-200/80 dark:border-white/10 flex items-start gap-3 shadow-sm">
          <Info className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
            <span className="text-zinc-900 dark:text-white font-bold mr-1.5">Store Release Status:</span>
            Chrome Web Store and Microsoft Edge store approval is in progress. In the meantime, you can load the developer version unpacked using the step-by-step instructions below.
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.number} 
                className="rounded-[24px] bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 p-5 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-white/20 transition-all shadow-[0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/10 px-2.5 py-0.5 rounded-full">
                      Step {step.number}
                    </span>
                    {step.badge && (
                      <span className="text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-2.5 py-0.5 rounded-full">
                        {step.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3.5 items-start">
                    <div className="w-9 h-9 rounded-xl border border-zinc-200/80 dark:border-white/10 flex items-center justify-center bg-zinc-100 dark:bg-white/[0.06] text-zinc-900 dark:text-white flex-shrink-0 shadow-sm">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-900 dark:text-white">{step.title}</h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Optional Step Actions */}
                {step.number === 1 && (
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/10 flex justify-end">
                    <a
                      href="/downloads/WITHUS-Extension.zip"
                      className="text-[11px] font-bold text-zinc-900 dark:text-white hover:underline flex items-center gap-1.5"
                    >
                      Download Package <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {step.number === 3 && step.action && (
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/10 flex justify-end">
                    <button
                      onClick={step.action}
                      className="text-[11px] font-bold text-zinc-900 dark:text-white hover:underline"
                    >
                      {copiedLink ? 'Copied to Clipboard!' : 'Copy Link'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Verification Checklist Card */}
        <div className="rounded-[28px] bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]">
          <h2 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Verification Checklist
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs text-zinc-600 dark:text-zinc-300 font-medium">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span>WithUs extension badge appears in your browser bar</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span>Clicking the icon opens the secure WithUs credential tray</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span>Status indicator in top right shows green dot (authenticated)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span>Autofill prompts automatically trigger on logins (Vercel, GoDaddy, GitHub)</span>
            </div>
          </div>
        </div>

        {/* Troubleshooting Section */}
        <div className="rounded-[28px] bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]">
          <h2 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-500" />
            Troubleshooting
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                Extension icon not showing in toolbar?
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal pl-3.5">
                Click the Extensions icon (puzzle piece) in your browser's toolbar and select the pin icon next to <span className="font-bold text-zinc-900 dark:text-white">WithUs Vault</span> to keep it permanently visible.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                Autofill prompts not triggering?
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal pl-3.5">
                Open the extension pop-up and confirm that the status dot in the top right is green. If it's grey, click <span className="font-bold text-zinc-900 dark:text-white">Sign In</span> to re-establish your workspace session.
              </p>
            </div>
          </div>
        </div>

        {/* Support & Privacy Footer */}
        <div className="pt-4 flex items-center justify-between border-t border-zinc-200/80 dark:border-white/10 text-[10px] text-zinc-400 font-medium">
          <div>
            &copy; {new Date().getFullYear()} WithUs. All rights reserved.
          </div>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors hover:underline">
              Privacy Policy
            </Link>
            <span>&bull;</span>
            <a href="mailto:makewithus.in@gmail.com" className="hover:text-zinc-900 dark:hover:text-white transition-colors hover:underline">
              Support
            </a>
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}
