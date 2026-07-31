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
  showBadge();
}

// ─── Autofill Badge ───────────────────────────────────────────────────────────

function showBadge(): void {
  if (document.getElementById('withus-autofill-badge')) return;

  const badge = document.createElement('div');
  badge.id = 'withus-autofill-badge';
  badge.setAttribute('role', 'button');
  badge.setAttribute('aria-label', 'WITHUS: autofill with delegated credentials');
  badge.style.cssText = [
    'position:fixed',
    'bottom:20px',
    'right:20px',
    'z-index:2147483647',
    'background:#1e293b',
    'color:#f8fafc',
    'border-radius:12px',
    'padding:10px 16px',
    'font-family:system-ui,sans-serif',
    'font-size:13px',
    'font-weight:600',
    'cursor:pointer',
    'box-shadow:0 4px 20px rgba(0,0,0,0.3)',
    'display:flex',
    'align-items:center',
    'gap:8px',
    'user-select:none',
    'border:1px solid rgba(255,255,255,0.08)',
    'transition:background 0.15s',
  ].join(';');

  badge.innerHTML = `
    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;flex-shrink:0"></span>
    WITHUS – Fill with delegated access
  `;

  badge.addEventListener('mouseenter', () => {
    badge.style.background = '#334155';
  });
  badge.addEventListener('mouseleave', () => {
    badge.style.background = '#1e293b';
  });
  badge.addEventListener('click', handleAutofillRequest);

  document.body.appendChild(badge);
}

// ─── Autofill Handler ─────────────────────────────────────────────────────────

async function handleAutofillRequest(): Promise<void> {
  const badge = document.getElementById('withus-autofill-badge');
  if (badge) {
    badge.textContent = 'Fetching credentials…';
    (badge as HTMLElement).style.pointerEvents = 'none';
  }

  // Use first matching session; if multiple, pick least-used
  const session = activeSessions.sort((a, b) => a.revealCount - b.revealCount)[0];
  if (!session) {
    showError('No active session found. Request access from WITHUS.');
    return;
  }

  const response = await sendMessage<AutofillPayload>({
    type: 'REVEAL_SECRET',
    payload: { sessionId: session.id, orgId: activeOrgId },
  });

  if (!response.success || !response.data) {
    showError(response.error || 'Failed to retrieve credentials.');
    return;
  }

  const { username, password } = response.data;
  const fields = provider?.getCredentialFields();

  if (!fields) {
    showError('Could not detect login form on this page.');
    return;
  }

  try {
    fillField(fields.usernameSelector, username);
    fillField(fields.passwordSelector, password);
    provider?.afterFill?.();
    removeBadge();
  } catch {
    showError('Autofill failed — please fill in manually.');
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

function removeBadge(): void {
  document.getElementById('withus-autofill-badge')?.remove();
}

function showError(message: string): void {
  const badge = document.getElementById('withus-autofill-badge') as HTMLElement | null;
  if (badge) {
    badge.textContent = `⚠ ${message}`;
    badge.style.background = '#7f1d1d';
    badge.style.pointerEvents = 'auto';
    setTimeout(() => badge.remove(), 5000);
  }
}

// ─── Message Helper ───────────────────────────────────────────────────────────

function sendMessage<T>(msg: ExtensionMessage): Promise<ExtensionResponse<T>> {
  return chrome.runtime.sendMessage(msg) as Promise<ExtensionResponse<T>>;
}

// ─── Popup-triggered Autofill ─────────────────────────────────────────────────
// The popup can inject a specific sessionId to autofill, bypassing the badge.

window.addEventListener('withus:autofill', async (e: Event) => {
  const { sessionId, orgId } = (e as CustomEvent<{ sessionId: string; orgId: string }>).detail;

  const response = await sendMessage<AutofillPayload>({
    type: 'REVEAL_SECRET',
    payload: { sessionId, orgId },
  });

  if (!response.success || !response.data) return;

  const { username, password } = response.data;
  const fields = provider?.getCredentialFields();
  if (!fields) return;

  try {
    fillField(fields.usernameSelector, username);
    fillField(fields.passwordSelector, password);
    provider?.afterFill?.();
    removeBadge();
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
