'use client';

import React, { useState } from 'react';
import { X, Mail, CheckCircle2, Send, ExternalLink, Shield, Building2, User, Check } from 'lucide-react';

interface DemoRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoRequestModal({ isOpen, onClose }: DemoRequestModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [message, setMessage] = useState('');
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Full name is required';
    if (!email.trim()) {
      newErrors.email = 'Work email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid work email address';
    }
    if (!organization.trim()) newErrors.organization = 'Company/Organization name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, organization, message }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit demo request');
      }

      setSubmitted(true);
    } catch (error) {
      setSubmitError('Failed to submit your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setOrganization('');
    setMessage('');
    setErrors({});
    setSubmitted(false);
    setIsSubmitting(false);
    setSubmitError('');
    onClose();
  };

  const handleTryAgain = () => {
    setSubmitError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/75 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Modal Container */}
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#0b0c0e] border border-zinc-200/80 dark:border-zinc-800/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden text-zinc-900 dark:text-zinc-100 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Top Accent Glow Line */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-zinc-400 dark:via-zinc-600 to-transparent opacity-50" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-100 flex items-center justify-center shadow-xs shrink-0">
              <Mail className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-white tracking-tight">
                Request a WITHUS Demo
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-normal">
                Connect with our team for a guided walkthrough
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all duration-200"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7">
          {!submitted && !submitError ? (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-4.5">
              
              {/* Feature Pill Indicators */}
              <div className="flex flex-wrap items-center gap-2 pb-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium shadow-2xs">
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  No login required
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium shadow-2xs">
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Direct email transmission
                </span>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-800 dark:group-focus-within:text-zinc-200 transition-colors" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    disabled={isSubmitting}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/70 border ${
                      errors.name 
                        ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' 
                        : 'border-zinc-200 dark:border-zinc-800/80 focus:border-zinc-950 dark:focus:border-zinc-200 focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-white/10'
                    } text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all duration-200 disabled:opacity-50`}
                  />
                </div>
                {errors.name && <p className="text-[11px] font-medium text-red-500 animate-in fade-in">{errors.name}</p>}
              </div>

              {/* Work Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Work / Company Email <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-800 dark:group-focus-within:text-zinc-200 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    disabled={isSubmitting}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/70 border ${
                      errors.email 
                        ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' 
                        : 'border-zinc-200 dark:border-zinc-800/80 focus:border-zinc-950 dark:focus:border-zinc-200 focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-white/10'
                    } text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all duration-200 disabled:opacity-50`}
                  />
                </div>
                {errors.email && <p className="text-[11px] font-medium text-red-500 animate-in fade-in">{errors.email}</p>}
              </div>

              {/* Organization */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Company / Organization <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-800 dark:group-focus-within:text-zinc-200 transition-colors" />
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Acme Cloud Solutions"
                    disabled={isSubmitting}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/70 border ${
                      errors.organization 
                        ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' 
                        : 'border-zinc-200 dark:border-zinc-800/80 focus:border-zinc-950 dark:focus:border-zinc-200 focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-white/10'
                    } text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all duration-200 disabled:opacity-50`}
                  />
                </div>
                {errors.organization && <p className="text-[11px] font-medium text-red-500 animate-in fade-in">{errors.organization}</p>}
              </div>

              {/* Optional Message */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Optional Message / Specific Use Case
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your team's access delegation needs..."
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800/80 focus:border-zinc-950 dark:focus:border-zinc-200 focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-white/10 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all duration-200 resize-none disabled:opacity-50"
                />
              </div>

              {/* Mechanism Callout */}
              <div className="p-3.5 rounded-xl bg-zinc-100/60 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-3">
                <Shield className="w-4 h-4 text-zinc-700 dark:text-zinc-300 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium text-[11px]">
                  Submitting will securely send your demo request to our team. No credentials or login access are required.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-md shadow-zinc-950/10 dark:shadow-white/5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-950 rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Demo Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : submitError ? (
            <div className="py-6 text-center space-y-4 animate-in fade-in duration-200">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center shadow-xs">
                <Shield className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-zinc-950 dark:text-white">Submission Failed</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed font-medium">
                  {submitError}
                </p>
              </div>
              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTryAgain}
                  className="px-5 py-2.5 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold cursor-pointer hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-xs"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-zinc-950 dark:text-white">Demo Request Sent</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed font-medium">
                  Your request has been successfully submitted. Our team will contact you shortly regarding the demo for <strong className="text-zinc-950 dark:text-white font-semibold">{organization}</strong>.
                </p>
              </div>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold cursor-pointer hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-md shadow-zinc-950/10 dark:shadow-white/5 active:scale-[0.98]"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

