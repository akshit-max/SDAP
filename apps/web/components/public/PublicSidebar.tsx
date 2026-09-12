'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  Cpu,
  Laptop,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Sun,
  Moon,
  LayoutDashboard,
  Mail,
  PanelLeftClose,
  PanelLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface PublicSidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  viewMode: 'single' | 'all';
  onToggleViewMode: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenDemo: () => void;
}

export function PublicSidebar({
  activeTab,
  onSelectTab,
  viewMode,
  onToggleViewMode,
  theme,
  onToggleTheme,
  onOpenDemo,
}: PublicSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Product Overview', icon: LayoutDashboard },
    { id: 'problem', label: 'The Problem', icon: ShieldAlert },
    { id: 'solution', label: 'Governed Solution', icon: ShieldCheck },
    { id: 'market', label: 'Target Market', icon: Building2 },
    { id: 'capabilities', label: 'Capabilities', icon: Cpu },
    { id: 'screenshots', label: 'UI Previews', icon: Laptop },
    { id: 'business-model', label: 'Business Model', icon: CreditCard },
    { id: 'traction', label: 'Verified Traction', icon: CheckCircle2 },
  ];

  return (
    <aside
      className={`shrink-0 hidden lg:block border-r border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-[#09090b]/90 backdrop-blur-xl h-[calc(100vh-5rem)] sticky top-20 select-none transition-all duration-300 z-30 ${
        collapsed ? 'w-20 p-3' : 'w-64 p-5'
      }`}
    >
      <div className="flex flex-col h-full justify-between overflow-y-auto overflow-x-hidden">
        
        <div className="space-y-6">
          
          {/* Sidebar Header & Collapse Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              {!collapsed && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-number">
                  Hub Modules
                </span>
              )}
              
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={() => setCollapsed(!collapsed)}
                  className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                >
                  {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* View Mode Toggle (Only shown when expanded) */}
            {!collapsed && (
              <div className="p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    if (viewMode !== 'single') onToggleViewMode();
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-md font-bold transition-all text-center cursor-pointer ${
                    viewMode === 'single'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-2xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Focused View
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (viewMode !== 'all') onToggleViewMode();
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-md font-bold transition-all text-center cursor-pointer ${
                    viewMode === 'all'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-2xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Full Scroll
                </button>
              </div>
            )}
          </div>

          {/* Navigation Modules */}
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  title={collapsed ? tab.label : undefined}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center px-0 py-3' : 'justify-between px-3 py-2.5'
                  } rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs font-bold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white dark:text-zinc-950' : 'text-zinc-500 dark:text-zinc-400'}`} />
                    {!collapsed && <span className="truncate">{tab.label}</span>}
                  </div>
                  {!collapsed && isActive && <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 dark:bg-white shrink-0" />}
                </button>
              );
            })}
          </nav>

        </div>

        {/* Bottom Demo Card */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          {!collapsed ? (
            <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-zinc-950 dark:text-white">
                <Mail className="w-4 h-4 text-zinc-900 dark:text-white" />
                <span className="text-xs font-bold font-number uppercase tracking-wider">Request Demo</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                Connect with our team for a guided walkthrough
              </p>
              <button
                type="button"
                onClick={onOpenDemo}
                className="w-full py-2 rounded-md bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <span>Request Demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenDemo}
              className="w-full py-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
              title="Request a Demo"
            >
              <Mail className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </aside>
  );
}
