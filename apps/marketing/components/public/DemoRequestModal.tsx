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
  const [mailtoUrl, setMailtoUrl] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const recipient = 'contact@makewithus.in';
    const subject = encodeURIComponent(`WITHUS Demo Request - ${organization.trim()}`);
    const body = encodeURIComponent(
      `Hello WITHUS Team,\n\nI would like to request a product demonstration for WITHUS.\n\n` +
      `Details:\n` +
      `- Name: ${name.trim()}\n` +
      `- Work Email: ${email.trim()}\n` +
      `- Organization: ${organization.trim()}\n` +
      (message.trim() ? `- Message: ${message.trim()}\n` : '') +
      `\nSent via WITHUS Public Product Page (https://withus.makewithus.in/withus)`
    );

    const generatedMailto = `mailto:${recipient}?subject=${subject}&body=${body}`;
    setMailtoUrl(generatedMailto);
    setSubmitted(true);

    window.location.href = generatedMailto;
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setOrganization('');
    setMessage('');
    setErrors({});
    setSubmitted(false);
    setMailtoUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 flex items-center justify-center shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-white tracking-tight">
                Request a WITHUS Demo
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Connect with our team for a guided walkthrough
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Feature Pill Indicators */}
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-900 text-[11px] text-zinc-600 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium">
                  <Check className="w-3 h-3 text-zinc-950 dark:text-white" />
                  No login required
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium">
                  <Check className="w-3 h-3 text-zinc-950 dark:text-white" />
                  Direct email transmission
                </span>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Full Name <span className="text-zinc-900 dark:text-white">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border ${
                      errors.name ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-800 focus:border-zinc-950 dark:focus:border-white'
                    } text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-colors`}
                  />
                </div>
                {errors.name && <p className="text-[11px] font-medium text-red-500">{errors.name}</p>}
              </div>

              {/* Work Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Work / Company Email <span className="text-zinc-900 dark:text-white">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border ${
                      errors.email ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-800 focus:border-zinc-950 dark:focus:border-white'
                    } text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-colors`}
                  />
                </div>
                {errors.email && <p className="text-[11px] font-medium text-red-500">{errors.email}</p>}
              </div>

              {/* Organization */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Company / Organization <span className="text-zinc-900 dark:text-white">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Acme Cloud Solutions"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border ${
                      errors.organization ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-800 focus:border-zinc-950 dark:focus:border-white'
                    } text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-colors`}
                  />
                </div>
                {errors.organization && <p className="text-[11px] font-medium text-red-500">{errors.organization}</p>}
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
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-300 dark:border-zinc-800 focus:border-zinc-950 dark:focus:border-white text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-colors resize-none"
                />
              </div>

              {/* Mechanism Callout */}
              <div className="p-3.5 rounded-lg bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-3">
                <Shield className="w-4 h-4 text-zinc-900 dark:text-white shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium text-[11px]">
                  Submitting opens your mail app with a prefilled request to <strong className="text-zinc-950 dark:text-zinc-200 font-semibold">contact@makewithus.in</strong>. No credentials or login access are required.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Demo Request</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="py-4 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-zinc-950 dark:text-white" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-zinc-950 dark:text-white">Demo Request Initiated</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed font-medium">
                  Your email client was prompted with your prefilled demo request details for <strong className="text-zinc-950 dark:text-white font-semibold">{organization}</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left text-xs text-zinc-700 dark:text-zinc-300 space-y-1 font-mono">
                <p className="text-zinc-500 dark:text-zinc-500 text-[10px] uppercase tracking-wider font-sans font-bold">Request Details</p>
                <p><strong>To:</strong> contact@makewithus.in</p>
                <p><strong>From:</strong> {name} &lt;{email}&gt;</p>
                <p><strong>Organization:</strong> {organization}</p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                {mailtoUrl && (
                  <a
                    href={mailtoUrl}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Re-open Mail Client</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold cursor-pointer"
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

