/**
 * WITHUS Extension — Popup Script
 *
 * Handles the popup UI state machine:
 *  NOT_AUTHENTICATED → Login form
 *  AUTHENTICATED     → Session list for current tab's domain
 */

import { Storage } from '../lib/storage';
import { WithusApi } from '../lib/api';
import type { ExtensionMessage, ExtensionResponse, ExtensionSession } from '../lib/types';

// ─── Elements ─────────────────────────────────────────────────────────────────

const loginView = document.getElementById('login-view')!;
const sessionsView = document.getElementById('sessions-view')!;
const footer = document.getElementById('footer')!;
const statusDot = document.getElementById('status-dot')!;

const emailInput = document.getElementById('email') as HTMLInputElement;
const passwordInput = document.getElementById('password') as HTMLInputElement;
const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;
const loginError = document.getElementById('login-error')!;

const sessionsList = document.getElementById('sessions-list')!;
const currentSiteEl = document.getElementById('current-site')!;
const userEmailEl = document.getElementById('user-email')!;
const logoutBtn = document.getElementById('logout-btn')!;

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  const authResponse = await sendMessage({ type: 'CHECK_AUTH' });

  if (!authResponse.success) {
    showLogin();
    return;
  }

  const auth = await Storage.getAuth();
  userEmailEl.textContent = auth?.email || '';
  statusDot.classList.add('connected');

  await showSessions(auth?.email || '');
}

// ─── Login ────────────────────────────────────────────────────────────────────

function showLogin() {
  loginView.classList.remove('hidden');
  sessionsView.classList.add('hidden');
  footer.classList.add('hidden');
  statusDot.classList.remove('connected');
}

loginBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showLoginError('Please enter your email and password.');
    return;
  }

  loginBtn.disabled = true;
  loginBtn.innerHTML = '<span class="spinner">⟳</span> Signing in…';
  loginError.classList.add('hidden');

  try {
    const auth = await WithusApi.login(email, password);
    await Storage.setAuth(auth);
    userEmailEl.textContent = auth.email;
    statusDot.classList.add('connected');
    loginView.classList.add('hidden');
    await showSessions(auth.email);
  } catch (err: unknown) {
    showLoginError((err as Error).message || 'Login failed. Check your credentials.');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign in to WithUs';
  }
});

// Allow Enter key to submit
passwordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loginBtn.click();
});

function showLoginError(msg: string) {
  loginError.textContent = msg;
  loginError.classList.remove('hidden');
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

async function showSessions(email: string) {
  sessionsView.classList.remove('hidden');
  footer.classList.remove('hidden');
  userEmailEl.textContent = email;
  sessionsList.innerHTML = '<div class="no-sessions"><strong>Loading…</strong></div>';

  // Get the current tab's hostname
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const hostname = tab?.url ? new URL(tab.url).hostname : '';

  if (hostname) {
    currentSiteEl.innerHTML = `Current site: <span>${hostname}</span>`;
  }

  const response = await sendMessage<{ sessions: ExtensionSession[]; orgId: string }>({
    type: 'GET_ACTIVE_SESSION',
    payload: { domain: hostname },
  });

  if (!response.success) {
    sessionsList.innerHTML = `
      <div class="no-sessions">
        <strong>Not authenticated</strong>
        Please sign in to WithUs to view delegated sessions.
      </div>`;
    showLogin();
    return;
  }

  const sessions = response.data?.sessions || [];
  const orgId = response.data?.orgId || '';

  if (sessions.length === 0) {
    sessionsList.innerHTML = `
      <div class="no-sessions">
        <strong>No active sessions for this site</strong>
        Ask an admin to grant you a delegated session for this platform.
      </div>`;
    return;
  }

  renderSessions(sessions, orgId, tab?.id);
}

function renderSessions(sessions: ExtensionSession[], orgId: string, tabId: number | undefined) {
  sessionsList.innerHTML = '';

  for (const session of sessions) {
    const card = document.createElement('div');
    card.className = 'session-card';

    const expiresAt = new Date(session.expiresAt).toLocaleString();
    const revealsLeft = session.maxReveals
      ? `${session.maxReveals - session.revealCount} reveals left`
      : 'Unlimited reveals';

    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span class="session-name">${escapeHtml((session as any).resourceName || 'Unknown')}</span>
        <span class="badge-active">Active</span>
      </div>
      <div class="session-meta">
        <span>Granted by ${escapeHtml((session as any).grantor?.email || 'Unknown')}</span>
        <span>${revealsLeft}</span>
      </div>
      <div class="session-meta">Expires ${expiresAt}</div>
      <button class="btn btn-primary" style="margin-top:10px" 
              data-session-id="${session.id}" 
              data-org-id="${(session as any).__orgId || orgId}"
              data-tab-id="${tabId}">
        Autofill this page
      </button>
    `;

    sessionsList.appendChild(card);
  }

  // Wire autofill buttons
  sessionsList.querySelectorAll<HTMLButtonElement>('[data-session-id]').forEach((btn) => {
    btn.addEventListener('click', () => handleAutofill(btn, tabId));
  });
}

async function handleAutofill(btn: HTMLButtonElement, tabId: number | undefined) {
  const sessionId = btn.dataset.sessionId!;
  const orgId = btn.dataset.orgId!;

  btn.disabled = true;
  btn.textContent = 'Filling…';

  if (tabId) {
    // Trigger autofill in the content script via scripting API
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: triggerAutofill,
        args: [sessionId, orgId],
      });
      btn.textContent = '✓ Filled';
      setTimeout(() => window.close(), 1200);
    } catch {
      btn.textContent = 'Fill failed — try on the page';
      btn.disabled = false;
    }
  } else {
    btn.textContent = 'No active tab';
    btn.disabled = false;
  }
}

/** Injected into the page to trigger autofill via the content script message channel */
function triggerAutofill(sessionId: string, orgId: string) {
  window.dispatchEvent(
    new CustomEvent('withus:autofill', { detail: { sessionId, orgId } }),
  );
}

// ─── Logout ───────────────────────────────────────────────────────────────────

logoutBtn.addEventListener('click', async () => {
  logoutBtn.textContent = 'Signing out…';
  await sendMessage({ type: 'LOGOUT' });
  showLogin();
  sessionsList.innerHTML = '';
  statusDot.classList.remove('connected');
  logoutBtn.textContent = 'Sign out';
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sendMessage<T = unknown>(msg: ExtensionMessage): Promise<ExtensionResponse<T>> {
  return chrome.runtime.sendMessage(msg) as Promise<ExtensionResponse<T>>;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

init().catch(console.error);
