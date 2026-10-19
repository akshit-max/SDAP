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
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="pb-4 border-b border-[#E5E5EA] dark:border-[#2C2C2E] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                AUTOMATION &amp; AGENTS
              </span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white">
              Browser Extension
            </h1>
            <p className="text-xs text-[#86868B] mt-0.5 leading-relaxed">
              Autofill credentials directly into target websites securely and dynamically through WithUs.
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2.5 flex-wrap">
            <a
              href="https://chromewebstore.google.com/detail/withus-vault/ccelghkaoejlmljlhcefnkbcbfmoge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#2C2C2E] hover:bg-[#F5F5F7] dark:hover:bg-[#38383A]/80 text-[#1D1D1F] dark:text-[#F5F5F7] text-xs font-medium transition-colors shadow-sm"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium transition-colors shadow-sm active:scale-[0.99]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Extension (ZIP)</span>
            </a>
          </div>
        </div>

        {/* Future Ready / Webstore Announcement Alert */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] flex items-start gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <Info className="w-4 h-4 text-[#0071E3] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-[#636366] dark:text-[#AEAEB2] leading-relaxed font-normal">
            <span className="text-[#1D1D1F] dark:text-white font-medium mr-1.5">Store Release Status:</span>
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
                className="rounded-xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] p-4 flex flex-col justify-between hover:border-[#D1D1D6] dark:hover:border-[#38383A] transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-medium text-[#86868B] uppercase tracking-wider bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-[#38383A] px-2 py-0.5 rounded-md">
                      Step {step.number}
                    </span>
                    {step.badge && (
                      <span className="text-[10px] font-medium bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20 px-2 py-0.5 rounded-md">
                        {step.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-lg border border-[#E5E5EA] dark:border-[#38383A] flex items-center justify-center bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-[#1D1D1F] dark:text-white">{step.title}</h3>
                      <p className="text-[11px] text-[#636366] dark:text-[#AEAEB2] font-normal mt-0.5 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Optional Step Actions */}
                {step.number === 1 && (
                  <div className="mt-3 pt-2.5 border-t border-[#E5E5EA] dark:border-[#2C2C2E] flex justify-end">
                    <a
                      href="/downloads/WITHUS-Extension.zip"
                      className="text-xs font-medium text-[#0071E3] hover:underline flex items-center gap-1"
                    >
                      Download Package <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {step.number === 3 && step.action && (
                  <div className="mt-3 pt-2.5 border-t border-[#E5E5EA] dark:border-[#2C2C2E] flex justify-end">
                    <button
                      onClick={step.action}
                      className="text-xs font-medium text-[#0071E3] hover:underline"
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
        <div className="rounded-xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <h2 className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Verification Checklist
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#636366] dark:text-[#AEAEB2] font-normal">
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
        <div className="rounded-xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <h2 className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-500" />
            Troubleshooting
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                Extension icon not showing in toolbar?
              </h3>
              <p className="text-xs text-[#636366] dark:text-[#AEAEB2] leading-relaxed font-normal pl-3.5">
                Click the Extensions icon (puzzle piece) in your browser's toolbar and select the pin icon next to <span className="font-semibold text-[#1D1D1F] dark:text-white">WithUs Vault</span> to keep it permanently visible.
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                Autofill prompts not triggering?
              </h3>
              <p className="text-xs text-[#636366] dark:text-[#AEAEB2] leading-relaxed font-normal pl-3.5">
                Open the extension pop-up and confirm that the status dot in the top right is green. If it's grey, click <span className="font-semibold text-[#1D1D1F] dark:text-white">Sign In</span> to re-establish your workspace session.
              </p>
            </div>
          </div>
        </div>

        {/* Support & Privacy Footer */}
        <div className="pt-4 flex items-center justify-between border-t border-[#E5E5EA] dark:border-[#2C2C2E] text-[11px] text-[#86868B] font-normal">
          <div>
            &copy; {new Date().getFullYear()} WithUs. All rights reserved.
          </div>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[#1D1D1F] dark:hover:text-white transition-colors hover:underline">
              Privacy Policy
            </Link>
            <span>&bull;</span>
            <a href="mailto:makewithus.in@gmail.com" className="hover:text-[#1D1D1F] dark:hover:text-white transition-colors hover:underline">
              Support
            </a>
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}
