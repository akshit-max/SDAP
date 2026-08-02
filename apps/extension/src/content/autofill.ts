/**
 * WITHUS Extension — Content Script
 *
 * Injected into supported login pages. Responsibilities:
 *  1. Detect if this page is a supported provider login
 *  2. Ask the service worker if there's an active WITHUS session
 *  3. Inject a subtle autofill badge — user must confirm before fill
 *  4. On confirmation: receive credentials and fill the form
 *  5. Clear credentials from memory immediately after fill
 *
 * NO credentials are ever stored in content script memory beyond the fill operation.
 */

import { getProviderForHost } from '../providers/registry';
import type { ExtensionMessage, ExtensionResponse, ExtensionSession, AutofillPayload } from '../lib/types';

const provider = getProviderForHost(location.hostname);
if (!provider) {
  // Not a supported domain — do nothing
  throw new Error('WITHUS: unsupported domain, content script exiting');
}

// ─── Session Discovery ────────────────────────────────────────────────────────

let activeSessions: ExtensionSession[] = [];
let activeOrgId = '';

async function discoverSessions(): Promise<void> {
  const response = await sendMessage<{ sessions: ExtensionSession[]; orgId: string }>({
    type: 'GET_ACTIVE_SESSION',
    payload: { domain: location.hostname },
  });

  if (!response.success || !response.data?.sessions.length) return;
  activeSessions = response.data.sessions;
  activeOrgId = response.data.orgId;
  
  // Magic GoDaddy flow: auto-fill immediately if session exists!
  // BUT only if we actually detect a login form on this specific page
  if (provider?.getCredentialFields()) {
    handleAutofillRequest();
  }
}

// ─── Magic Toast ──────────────────────────────────────────────────────────────

function showToast(message: string, isError = false): void {
  let toast = document.getElementById('withus-magic-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'withus-magic-toast';
    toast.style.cssText = [
      'position:fixed',
      'top:24px',
      'right:24px',
      'z-index:2147483647',
      'background:#030303',
      'color:#ffffff',
      'border-radius:8px',
      'padding:12px 20px',
      'font-family:system-ui,sans-serif',
      'font-size:13px',
      'font-weight:600',
      'box-shadow:0 10px 40px rgba(0,0,0,0.5)',
      'display:flex',
      'align-items:center',
      'gap:10px',
      'user-select:none',
      'border:1px solid rgba(255,255,255,0.15)',
      'transition:opacity 0.3s ease, transform 0.3s ease',
      'opacity:0',
      'transform:translateY(-10px)',
    ].join(';');
    document.body.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
      toast!.style.opacity = '1';
      toast!.style.transform = 'translateY(0)';
    });
  }

  const icon = isError ? '❌' : '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#22c55e;flex-shrink:0"></span>';
  toast.innerHTML = `${icon} ${message}`;
  
  if (isError) {
    toast.style.background = '#030303';
    toast.style.border = '1px solid rgba(239, 68, 68, 0.4)';
    toast.style.color = '#ef4444';
    setTimeout(() => {
      toast?.style.setProperty('opacity', '0');
      toast?.style.setProperty('transform', 'translateY(-10px)');
      setTimeout(() => toast?.remove(), 300);
    }, 4000);
  }
}

function removeToast(): void {
  const toast = document.getElementById('withus-magic-toast');
  if (toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }
}

// ─── Autofill Handler ─────────────────────────────────────────────────────────

async function handleAutofillRequest(): Promise<void> {
  const session = activeSessions.sort((a, b) => a.revealCount - b.revealCount)[0];
  if (!session) return;

  showToast('WithUs session detected... Logging you in...');

  // Introduce 1-second delay for premium UX
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const response = await sendMessage<AutofillPayload>({
    type: 'LAUNCH_SESSION',
    payload: { sessionId: session.id, orgId: (session as any).__orgId || activeOrgId },
  });

  if (!response.success || !response.data) {
    showToast(response.error || 'Failed to retrieve credentials.', true);
    return;
  }

  const { username, password } = response.data;
  const fields = provider?.getCredentialFields();

  if (!fields) {
    showToast('Could not detect login form on this page.', true);
    return;
  }

  try {
    if (fields.usernameSelector) {
      fillField(fields.usernameSelector, username);
    }
    if (fields.passwordSelector && password) {
      // Vercel and some others might not have a password field on the first page
      try {
        fillField(fields.passwordSelector, password);
      } catch {
        // Ignore missing password field if we successfully filled username
      }
    }
    provider?.afterFill?.();

    // Auto-submit — find the submit button and click it
    if (fields.submitSelector) {
      const submitBtn = document.querySelector<HTMLElement>(fields.submitSelector);
      if (submitBtn) {
        // Small delay so React/Vue state can settle after the input events
        setTimeout(() => submitBtn.click(), 120);
      }
    }
  } catch {
    showToast('Autofill failed — please fill in manually.', true);
  } finally {
    // Explicit GC hint — nullify references
    (response.data as any) = null;
  }
}

// ─── DOM Fill Helpers ─────────────────────────────────────────────────────────

function fillField(selector: string, value: string): void {
  const el = document.querySelector<HTMLInputElement>(selector);
  if (!el) throw new Error(`Field not found: ${selector}`);

  // Set value using native input setter so React/Vue controlled inputs update
  const nativeInputSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )?.set;
  nativeInputSetter?.call(el, value);

  // Dispatch events so framework re-renders pick up the change
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

// ─── Message Helper ───────────────────────────────────────────────────────────

function sendMessage<T>(msg: ExtensionMessage): Promise<ExtensionResponse<T>> {
  try {
    const promise = chrome.runtime.sendMessage(msg) as Promise<ExtensionResponse<T>>;
    return promise.catch((error: any) => {
      if (error?.message?.includes('Extension context invalidated')) {
        alert('WithUs Extension was updated. The page will now refresh to apply changes.');
        window.location.reload();
        return new Promise(() => {}); // Wait forever while page reloads
      }
      throw error;
    });
  } catch (error: any) {
    if (error?.message?.includes('Extension context invalidated')) {
      alert('WithUs Extension was updated. The page will now refresh to apply changes.');
      window.location.reload();
      return new Promise(() => {});
    }
    throw error;
  }
}

// ─── Popup-triggered Autofill ─────────────────────────────────────────────────
// The popup can inject a specific sessionId to autofill, bypassing the badge.

window.addEventListener('withus:autofill', async (e: Event) => {
  const { sessionId, orgId } = (e as CustomEvent<{ sessionId: string; orgId: string }>).detail;

  const response = await sendMessage<AutofillPayload>({
    type: 'LAUNCH_SESSION',
    payload: { sessionId, orgId },
  });

  if (!response.success || !response.data) return;

  const { username, password } = response.data;
  const session = activeSessions.find(s => s.id === sessionId);
  const fallbackUsername = session?.resourceName || session?.secretName || '';
  const fields = provider?.getCredentialFields();
  if (!fields) return;

  try {
    fillField(fields.usernameSelector, username || fallbackUsername);
    fillField(fields.passwordSelector, password);
    provider?.afterFill?.();

    if (fields.submitSelector) {
      const submitBtn = document.querySelector<HTMLElement>(fields.submitSelector);
      if (submitBtn) setTimeout(() => submitBtn.click(), 120);
    }
  } finally {
    (response.data as any) = null;
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────

// Wait for DOM to be ready before detecting session
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', discoverSessions);
} else {
  discoverSessions();
}
