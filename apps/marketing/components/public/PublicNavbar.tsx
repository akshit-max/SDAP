'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Sun, Moon } from 'lucide-react';
import { WithUsLogo } from '../common/WithUsLogo';

interface PublicNavbarProps {
  onOpenDemo: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  activeTab?: string;
  onSelectTab?: (tabId: string) => void;
}

export function PublicNavbar({
  onOpenDemo,
  theme = 'dark',
  onToggleTheme,
  activeTab,
  onSelectTab,
}: PublicNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'hero', name: 'Overview', href: '#hero' },
    { id: 'problem', name: 'Problem', href: '#problem' },
    { id: 'solution', name: 'Solution', href: '#solution' },
    { id: 'use-cases', name: 'Use Cases', href: '#use-cases' },
    { id: 'capabilities', name: 'Capabilities', href: '#capabilities' },
    { id: 'preview', name: 'Product Preview', href: '#preview' },
    { id: 'pricing', name: 'Pricing', href: '#pricing' },
    { id: 'stage', name: 'Status', href: '#stage' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-800/80 shadow-lg'
          : 'bg-neutral-950/70 backdrop-blur-md border-b border-neutral-800/50'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <WithUsLogo height="h-8 sm:h-9" />
          </div>

          {/* Desktop / Laptop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => {
                    if (onSelectTab) {
                      onSelectTab(link.id);
                    } else {
                      e.preventDefault();
                      const target = document.getElementById(link.id);
                      if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                      }
                    }
                  }}
                  className={`transition-all py-1 cursor-pointer tracking-wide ${
                    isActive
                      ? 'text-white font-bold border-b-2 border-white pb-0.5 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {link.name}
                </a>
              );
            })}
          </nav>

          {/* Action CTAs & Theme Toggle */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-2 rounded-lg border border-neutral-800 text-neutral-300 hover:bg-neutral-800 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-neutral-100" />
                ) : (
                  <Moon className="w-4 h-4 text-neutral-900" />
                )}
              </button>
            )}

            {/* Request a Demo Primary CTA */}
            <button
              type="button"
              onClick={onOpenDemo}
              className="px-5 py-2.5 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer group"
            >
              <span>Request Demo</span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-950 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={onOpenDemo}
              className="px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-950 text-xs font-bold"
            >
              Demo
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-neutral-300 hover:bg-neutral-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-neutral-950/95 border-b border-neutral-800 px-4 pt-3 pb-6 space-y-4 backdrop-blur-xl">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-neutral-300">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    if (onSelectTab) {
                      onSelectTab(link.id);
                    } else {
                      e.preventDefault();
                      const target = document.getElementById(link.id);
                      if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                      }
                    }
                  }}
                  className={`text-left transition-colors py-2 border-b border-neutral-900 ${
                    isActive ? 'text-white font-bold border-l-2 border-white pl-2' : 'hover:text-white'
                  }`}
                >
                  {link.name}
                </a>
              );
            })}
          </nav>
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDemo();
              }}
              className="w-full py-2.5 rounded-xl bg-neutral-100 text-neutral-950 text-xs font-bold flex items-center justify-center gap-2"
            >
              <span>Request Demo</span>
              <ArrowRight className="w-4 h-4 text-neutral-950" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

