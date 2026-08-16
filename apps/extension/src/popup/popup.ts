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

// ─── Platform Branding Helper ─────────────────────────────────────────────────

function getPlatformBranding(resourceName: string): { svg: string; color: string; name: string } {
  const name = resourceName.toLowerCase();
  
  const SVG_DEFAULT = `<svg class="platform-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
  
  if (name.includes('github')) {
    return {
      name: 'GitHub',
      color: '#181717',
      svg: `<svg class="platform-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`
    };
  }
  
  if (name.includes('vercel')) {
    return {
      name: 'Vercel',
      color: '#000000',
      svg: `<svg class="platform-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M24 22.525H0L12 1.745z"/></svg>`
    };
  }
  
  if (name.includes('godaddy')) {
    return {
      name: 'GoDaddy',
      color: '#00A63F',
      svg: `<svg class="platform-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20.702 2.29c-2.494-1.554-5.778-1.187-8.706.654C9.076 1.104 5.79.736 3.3 2.29c-3.941 2.463-4.42 8.806-1.07 14.167 2.47 3.954 6.333 6.269 9.77 6.226 3.439.043 7.301-2.273 9.771-6.226 3.347-5.361 2.872-11.704-1.069-14.167zM4.042 15.328a12.838 12.838 0 01-1.546-3.541 10.12 10.12 0 01-.336-3.338c.15-1.98.956-3.524 2.27-4.345 1.315-.822 3.052-.87 4.903-.137.281.113.556.24.825.382A15.11 15.11 0 007.5 7.54c-2.035 3.255-2.655 6.878-1.945 9.765a13.247 13.247 0 01-1.514-1.98zm17.465-3.541a12.866 12.866 0 01-1.547 3.54 13.25 13.25 0 01-1.513 1.984c.635-2.589.203-5.76-1.353-8.734a.39.39 0 00-.563-.153l-4.852 3.032a.397.397 0 00-.126.546l.712 1.139a.395.395 0 00.547.126l3.145-1.965c.101.306.203.606.28.916.296 1.086.41 2.214.335 3.337-.15 1.982-.956 3.525-2.27 4.347a4.437 4.437 0 01-2.25.65h-.101a4.432 4.432 0 01-2.25-.65c-1.314-.822-2.121-2.365-2.27-4.347-.074-1.123.039-2.251.335-3.337a13.212 13.212 0 014.05-6.482 10.148 10.148 0 012.849-1.765c1.845-.733 3.586-.685 4.9.137 1.316.822 2.122 2.365 2.271 4.345a10.146 10.146 0 01-.33 3.334z"/></svg>`
    };
  }
  
  if (name.includes('stripe')) {
    return {
      name: 'Stripe',
      color: '#635BFF',
      svg: `<svg class="platform-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M13.962 10.931c0-1.8-1.5-2.288-3.75-2.288-2.138 0-4.05.675-4.05 2.25 0 2.213 6.038 1.65 6.038 3.713 0 1.275-1.125 1.988-3 1.988-2.625 0-4.425-.9-4.425-2.588v-.488H2.438v.675c0 3.375 3.338 4.613 6.675 4.613 3.637 0 5.438-1.463 5.438-3.825-.038-2.887-6.562-1.95-6.562-4.125 0-1.05.975-1.425 2.213-1.425 2.1 0 3.037.675 3.037 1.988zM21.562 12.331H15.9v.45c0 2.213 1.238 2.813 3 2.813.9 0 1.763-.225 2.325-.563l.337 1.725c-.75.488-2.025.75-3.3.75-3.262 0-4.988-1.65-4.988-4.988s1.688-5.025 4.838-5.025c3.262 0 4.463 1.913 4.463 4.838zM18.825 9.406c-1.275 0-1.988.563-1.988 1.838h3.9v-.45c.038-1-.412-1.388-1.912-1.388z"/></svg>`
    };
  }
  
  if (name.includes('shopify')) {
    return {
      name: 'Shopify',
      color: '#96bf48',
      svg: `<svg class="platform-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19.587 7.086l-2.73-5.26c-.3-.57-.86-.94-1.5-.94h-6.7c-.64 0-1.2.37-1.5.94L4.417 7.086c-.5.96-.32 2.13.43 2.91L12 17.5l7.15-7.5c.75-.79.93-1.96.43-2.91zM12 2.3c.77 0 1.4.63 1.4 1.4S12.77 5.1 12 5.1s-1.4-.63-1.4-1.4.63-1.4 1.4-1.4z"/></svg>`
    };
  }
  
  if (name.includes('razorpay')) {
    return {
      name: 'Razorpay',
      color: '#0B0F19',
      svg: `<svg class="platform-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2zm0 4.8L18.6 19H5.4L12 6.8z"/></svg>`
    };
  }
  
  if (name.includes('linkedin')) {
    return {
      name: 'LinkedIn',
      color: '#0077B5',
      svg: `<svg class="platform-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0zM7.12 20.45H3.56V9H7.12v11.45zM5.34 7.43c-1.14 0-2.06-.92-2.06-2.06 0-1.14.92-2.06 2.06-2.06 1.14 0 2.06.92 2.06 2.06 0 1.14-.92 2.06-2.06 2.06zm15.11 13.02h-3.56v-5.6c0-1.34-.03-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95v5.7H9.33V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29z"/></svg>`
    };
  }
  
  if (name.includes('mca')) {
    return {
      name: 'MCA Portal',
      color: '#1a365d',
      svg: `<svg class="platform-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>`
    };
  }

  if (name.includes('gst')) {
    return {
      name: 'GST Portal',
      color: '#0f766e',
      svg: `<svg class="platform-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
    };
  }

  if (name.includes('udyam')) {
    return {
      name: 'Udyam Portal',
      color: '#701a75',
      svg: `<svg class="platform-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
    };
  }

  // Capitalize name
  const capitalized = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
  return {
    name: capitalized,
    color: '#27272a',
    svg: SVG_DEFAULT
  };
}

function detectPlatform(hostname: string): string {
  const host = hostname.toLowerCase();
  if (host.includes('github.com')) return 'GitHub';
  if (host.includes('vercel.com')) return 'Vercel';
  if (host.includes('godaddy.com')) return 'GoDaddy';
  if (host.includes('linkedin.com')) return 'LinkedIn';
  if (host.includes('shopify.com')) return 'Shopify';
  if (host.includes('stripe.com')) return 'Stripe';
  if (host.includes('razorpay.com')) return 'Razorpay';
  if (host.includes('mca.gov.in')) return 'MCA Portal';
  if (host.includes('gst.gov.in')) return 'GST Portal';
  if (host.includes('udyamregistration.gov.in')) return 'Udyam Portal';
  return '';
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  const authResponse = await sendMessage({ type: 'CHECK_AUTH' });

  if (!authResponse.success) {
    showLogin();
    return;
  }

  const auth = await Storage.getAuth();
  const email = auth?.email || '';
  userEmailEl.textContent = email;
  
  const avatarEl = document.getElementById('user-avatar');
  if (avatarEl && email) {
    avatarEl.textContent = email.charAt(0).toUpperCase();
  }
  
  statusDot.classList.add('connected');

  await showSessions(email);
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
  loginBtn.innerHTML = '<span class="spinner"></span> Signing in…';
  loginError.classList.add('hidden');

  try {
    const auth = await WithusApi.login(email, password);
    await Storage.setAuth(auth);
    userEmailEl.textContent = auth.email;
    
    const avatarEl = document.getElementById('user-avatar');
    if (avatarEl) {
      avatarEl.textContent = auth.email.charAt(0).toUpperCase();
    }
    
    statusDot.classList.add('connected');
    loginView.classList.add('hidden');
    await showSessions(auth.email);
  } catch (err: unknown) {
    showLoginError((err as Error).message || 'Login failed. Check your credentials.');
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"/></svg>
      Sign in to WithUs
    `;
  }
});

// Allow Enter key to submit
passwordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loginBtn.click();
});

function showLoginError(msg: string) {
  loginError.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    <span>${escapeHtml(msg)}</span>
  `;
  loginError.classList.remove('hidden');
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

async function showSessions(email: string) {
  sessionsView.classList.remove('hidden');
  footer.classList.remove('hidden');
  userEmailEl.textContent = email;
  
  const avatarEl = document.getElementById('user-avatar');
  if (avatarEl && email) {
    avatarEl.textContent = email.charAt(0).toUpperCase();
  }
  
  sessionsList.innerHTML = '<div class="no-sessions"><strong>Loading…</strong></div>';

  // Get the current tab's hostname
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const hostname = tab?.url ? new URL(tab.url).hostname : '';

  if (hostname) {
    const platformName = detectPlatform(hostname);
    if (platformName) {
      const branding = getPlatformBranding(platformName);
      currentSiteEl.style.background = '#f0fdf4';
      currentSiteEl.style.borderColor = '#bbf7d0';
      currentSiteEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; color: #166534; font-weight: 700;">
          <div style="display: flex; align-items: center; justify-content: center; width: 14px; height: 14px; color: ${branding.color};">
            ${branding.svg}
          </div>
          ${escapeHtml(platformName)} detected
        </div>
        <span style="font-size: 10px; color: #166534; background: #dcfce7; padding: 2px 6px; border-radius: 99px; font-weight: 700; border: 1px solid #bbf7d0; line-height: 1;">Secure fill</span>
      `;
    } else {
      currentSiteEl.style.background = '#ffffff';
      currentSiteEl.style.borderColor = 'var(--card-border)';
      currentSiteEl.innerHTML = `Current site <span style="font-weight: 700; color: var(--text);">${escapeHtml(hostname)}</span>`;
    }
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
      
    const platform = (session as any).resourceName || 'Unknown';
    const branding = getPlatformBranding(platform);

    card.innerHTML = `
      <div class="session-header">
        <div class="platform-icon-container" style="color: ${branding.color};">
          ${branding.svg}
        </div>
        <div class="session-title-group">
          <span class="session-name">${escapeHtml(branding.name)}</span>
          <span class="session-status-badge">Active</span>
        </div>
      </div>
      <div class="session-details">
        <div class="detail-row">
          <span>Granted by</span>
          <span>${escapeHtml((session as any).grantor?.email || 'Unknown')}</span>
        </div>
        <div class="detail-row">
          <span>Usage limit</span>
          <span>${escapeHtml(revealsLeft)}</span>
        </div>
        <div class="detail-row">
          <span>Expires</span>
          <span>${expiresAt}</span>
        </div>
      </div>
      <button class="btn btn-primary" 
              data-session-id="${session.id}" 
              data-org-id="${(session as any).__orgId || orgId}"
              data-tab-id="${tabId}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"/></svg>
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
