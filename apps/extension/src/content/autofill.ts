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
import { platformRegistry } from '../providers/platform-registry';
import type { ExtensionMessage, ExtensionResponse, ExtensionSession, AutofillPayload, ProviderAdapter } from '../lib/types';

let provider: ProviderAdapter | null = null;

// ─── OTP Completion Guard ─────────────────────────────────────────────────────
// Module-level flag. Once an OTP attempt has been made on this page (success or
// failure), this is set to true and never cleared. This guards against any code
// path accidentally calling startOtpWatcher() a second time (e.g. a DOM mutation
// storm, popup-triggered autofill, or future wiring changes).
// The per-watcher otpRequested boolean (inside startOtpWatcher) handles the
// within-watcher case; this handles the across-watcher case.
let otpCompleted = false;

// Dual Path Resolution: Prefer V2 PlatformConfig, fallback to Legacy PROVIDER_REGISTRY
const config = platformRegistry.getForHost(location.hostname);

if (
  config && 
  config.login && 
  config.login.usernameSelector && 
  config.login.passwordSelector && 
  config.login.submitSelector
) {
  // Wrap the declarative V2 config into the legacy ProviderAdapter interface
  provider = {
    name: config.name,
    domains: config.domains,
    getCredentialFields: () => {
      // Mimic legacy behavior: only return fields if the primary username field is actually on the DOM
      const usernameExists = document.querySelector(config.login.usernameSelector);
      if (!usernameExists) return null;
      
      if (config.login.requirePasswordOnDOM) {
        const passwordExists = document.querySelector(config.login.passwordSelector);
        if (!passwordExists) return null;
      }
      
      return {
        usernameSelector: config.login.usernameSelector,
        passwordSelector: config.login.passwordSelector,
        submitSelector: config.login.submitSelector,
      };
    }
  };
} else {
  // Immediately fallback to legacy provider registry
  provider = getProviderForHost(location.hostname);
}

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
  } else if (config?.otp) {
    // Hard-navigation case: The user landed on a separate OTP page (e.g. Razorpay /merchants/)
    const otpField = document.querySelector<HTMLInputElement>(config.otp.inputSelector);
    if (otpField && isOtpFieldVisible(otpField)) {
      startOtpWatcher(activeSessions[0].id, activeOrgId);
    }
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
    if (config?.otp) {
      startOtpWatcher(session.id, (session as any).__orgId || activeOrgId);
    }

    // Auto-submit — find the submit button and click it
    if (fields.submitSelector) {
      const submitBtn = document.querySelector<HTMLElement>(fields.submitSelector);
      if (submitBtn) {
        // Small delay so React/Vue state can settle after the input events
        setTimeout(() => {
          submitBtn.click();
        }, 120);
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

// ─── OTP Watcher ──────────────────────────────────────────────────────────────
//
// Started ONLY after a successful login submit. Never on page load.
// Guardrails enforced:
//   1. otpCompleted (module-level) — watcher never starts if OTP already attempted
//   2. otpRequested (closure-level) — API called at most once per watcher instance
//   3. observer.disconnect() before any await — observer never fires twice
//   4. 30-second hard timeout — watcher self-destructs if OTP field never appears
//   5. Visibility check — won't autofill in a background tab
//   6. visibilitychange listener — stops if user navigates away
//   7. isOtpFieldVisible() — only fills visible, enabled fields
//   8. No auto-retry on wrong OTP — watcher + module flag are both exhausted after first fill

function startOtpWatcher(sessionId: string, orgId: string): void {
  // Guard 1: module-level — OTP already attempted on this page lifecycle
  if (otpCompleted) return;

  const otpConfig = config?.otp;
  if (!otpConfig) return; // Should never happen — caller checks config?.otp first

  // Immediate Check: In case of a hard-navigation (e.g. Razorpay /merchants/)
  // the OTP field might already be on the DOM when the content script loads.
  const existingOtpField = document.querySelector<HTMLInputElement>(otpConfig.inputSelector);
  if (existingOtpField && document.visibilityState === 'visible' && isOtpFieldVisible(existingOtpField)) {
    otpCompleted = true;
    fetchAndFillOtp(sessionId, orgId, otpConfig.inputSelector, otpConfig.submitSelector);
    return;
  }

  let otpRequested = false; // Guard 2: single-request per watcher instance

  const observer = new MutationObserver(() => {
    if (otpRequested) return; // Guard 2: already in-flight within this watcher

    const otpField = document.querySelector<HTMLInputElement>(otpConfig.inputSelector);
    if (!otpField) return;

    // Guard 4: only autofill if the tab is visible
    if (document.visibilityState !== 'visible') return;

    // Guard 6: only fill visible, enabled, non-hidden fields
    if (!isOtpFieldVisible(otpField)) return;

    // Set guards and disconnect BEFORE the async call so no second mutation can fire
    otpCompleted = true;            // Guard 1: module-level — survives even if watcher restarted
    otpRequested = true;            // Guard 2: closure-level
    observer.disconnect();          // Guard 3
    clearTimeout(hardTimeout);      // Cancel the 30s timer
    document.removeEventListener('visibilitychange', onVisibilityChange); // Guard 5

    fetchAndFillOtp(sessionId, orgId, otpConfig.inputSelector, otpConfig.submitSelector);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Guard 3: 30-second hard timeout — silent stop (OTP field never appeared)
  const hardTimeout = setTimeout(() => {
    observer.disconnect();
    document.removeEventListener('visibilitychange', onVisibilityChange);
  }, 30_000);

  // Guard 5: stop if user navigates or hides the tab before OTP field appears
  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      observer.disconnect();
      clearTimeout(hardTimeout);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }
  }
  document.addEventListener('visibilitychange', onVisibilityChange);
}

/**
 * Returns true if the OTP input field is visible and interactable.
 * Guards against hidden or disabled inputs that some SPAs keep in the DOM.
 */
function isOtpFieldVisible(el: HTMLInputElement): boolean {
  if (el.disabled || el.hidden) return false;
  if (el.type === 'hidden') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/**
 * Calls the backend to retrieve the OTP, fills the field, and immediately
 * clears the code from memory. Never retries on failure.
 *
 * OTP Boundary Rule: receives only { otp: string }, fills it, nullifies it.
 * Guard 7: no auto-retry — if fill fails, user must request a new code.
 */
async function fetchAndFillOtp(
  sessionId: string,
  orgId: string,
  inputSelector: string,
  submitSelector?: string,
): Promise<void> {
  let otpCode: string | null = null;

  try {
    showToast('Fetching verification code...');

    const response = await sendMessage<{ otp: string }>({
      type: 'FETCH_OTP',
      payload: { sessionId, orgId },
    });

    if (!response.success || !response.data?.otp) {
      const msg = response.error || 'No OTP found.';
      // Specific, actionable message for the Gmail-not-connected case
      if (msg.toLowerCase().includes('not connected') || msg.toLowerCase().includes('gmail')) {
        showToast(
          'Automatic OTP is unavailable — the account owner has not connected Gmail to WithUs. ' +
          'Ask the organization owner to enable Gmail integration.',
          true,
        );
      } else if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('no otp')) {
        showToast('No OTP found. Please request a new verification code.', true);
      } else if (msg.toLowerCase().includes('unavailable') || msg.toLowerCase().includes('rate')) {
        showToast('Gmail temporarily unavailable. Please try again in a moment.', true);
      } else {
        showToast(msg, true);
      }
      return;
    }

    otpCode = response.data.otp;

    const otpField = document.querySelector<HTMLInputElement>(inputSelector);
    if (!otpField || !isOtpFieldVisible(otpField)) {
      showToast('Could not locate the OTP field.', true);
      return;
    }

    fillField(inputSelector, otpCode);

    // Auto-submit only if selector resolves to a visible, enabled element
    if (submitSelector) {
      const submitBtn = document.querySelector<HTMLButtonElement | HTMLInputElement>(submitSelector);
      if (submitBtn && !submitBtn.disabled && isOtpFieldVisible(submitBtn as HTMLInputElement)) {
        setTimeout(() => submitBtn.click(), 120);
      }
      // Guard: if button not found or disabled — fill only, let user click manually
    }

    removeToast();
  } catch {
    showToast('OTP autofill failed. Please enter the code manually.', true);
  } finally {
    otpCode = null; // Guard 6: immediate memory clear regardless of success or failure
  }
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
  if (!fields) {
    showToast('Failed to find login fields on this page.', true);
    return;
  }

  try {
    if (fields.usernameSelector) {
      fillField(fields.usernameSelector, username || fallbackUsername);
    }
    if (fields.passwordSelector && password) {
      try {
        fillField(fields.passwordSelector, password);
      } catch {
        // Ignore missing password on multi-step logins (e.g. Razorpay, Shopify)
      }
    }
    provider?.afterFill?.();
    if (config?.otp) {
      startOtpWatcher(sessionId, orgId);
    }

    if (fields.submitSelector) {
      const submitBtn = document.querySelector<HTMLElement>(fields.submitSelector);
      if (submitBtn) setTimeout(() => submitBtn.click(), 120);
      else showToast('Could not find submit button.', true);
    }
  } catch (err: any) {
    showToast(err.message || 'Failed to fill credentials', true);
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
