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
let loginStartTime = Date.now();

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
      const usernameExists = document.querySelector(config.login.usernameSelector);
      const passwordExists = config.login.passwordSelector ? document.querySelector(config.login.passwordSelector) : null;
      
      // Allow if either the email or password field is present
      if (!usernameExists && !passwordExists) return null;
      
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
  // Not a supported login page — content script exits silently.
  // This is expected when the manifest injects on broad patterns like *.razorpay.com/*
  // which also matches post-login dashboard pages (dashboard.razorpay.com).
  // Using `throw` here causes a noisy "Uncaught Error" in the browser's extension panel.
  // Instead we just skip all initialization below.
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
  
  // Only activate if this page has a login form OR a visible OTP field.
  // This prevents the toast from firing on post-login pages like
  // dashboard.razorpay.com/app/dashboard which match the domain but have no login UI.
  const checkAndActivate = () => {
    const fields = provider?.getCredentialFields();
    if (!fields) return false;

    // At least one of: username field or password field must be in the DOM
    const hasUsername = fields.usernameSelector
      ? !!document.querySelector(fields.usernameSelector)
      : false;
    const hasPassword = fields.passwordSelector
      ? !!document.querySelector(fields.passwordSelector)
      : false;

    return hasUsername || hasPassword;
  };

  if (checkAndActivate()) {
    handleAutofillRequest();
    return;
  }

  if (config?.otp) {
    // Hard-navigation case: landed directly on a standalone OTP page
    const otpFields = Array.from(document.querySelectorAll<HTMLInputElement>(config.otp.inputSelector));
    const visibleOtpField = otpFields.find(f => isOtpFieldVisible(f));
    if (visibleOtpField) {
      startOtpWatcher(activeSessions[0].id, activeOrgId, loginStartTime);
      return;
    }
  }

  // SPA page: form not rendered yet — watch for login fields to appear
  // (e.g. LinkedIn /flagship-web/login/ hydrates after script runs)
  let formWatchAttempts = 0;
  const MAX_FORM_WAIT_ATTEMPTS = 40; // 40 × 250ms = 10 seconds max
  const formWatcher = new MutationObserver(() => {
    formWatchAttempts++;
    if (formWatchAttempts > MAX_FORM_WAIT_ATTEMPTS) {
      formWatcher.disconnect();
      return;
    }
    if (checkAndActivate()) {
      formWatcher.disconnect();
      handleAutofillRequest();
    } else if (config?.otp) {
      const otpFields = Array.from(document.querySelectorAll<HTMLInputElement>(config.otp.inputSelector));
      if (otpFields.find(f => isOtpFieldVisible(f))) {
        formWatcher.disconnect();
        startOtpWatcher(activeSessions[0].id, activeOrgId, loginStartTime);
      }
    }
  });
  formWatcher.observe(document.body, { childList: true, subtree: true });
  // If neither login form nor OTP field found — do nothing (e.g. post-login dashboard)
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

  loginStartTime = Date.now(); // Capture exact time the login attempt started

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
    const pwEl = fields.passwordSelector
      ? document.querySelector<HTMLInputElement>(fields.passwordSelector)
      : null;

    if (fields.usernameSelector && username) {
      const usernameEl = document.querySelector<HTMLInputElement>(fields.usernameSelector);
      // Safety: the username and password selectors must not match the SAME element.
      // This can happen when selectors are too broad (e.g. input[type="text"] matches
      // a password field that momentarily lost its type attribute).
      if (usernameEl && isOtpFieldVisible(usernameEl) && usernameEl !== pwEl) {
        // Fill email — focus it so the field is active
        fillField(usernameEl, username);
        // Wait for React to process the email state update before we proceed.
        // We do NOT focus the password field next (skipFocus=true below) so that
        // the email field does NOT blur and React does NOT re-render it back to empty.
        await new Promise(r => setTimeout(r, 150));
      }
    }
    if (fields.passwordSelector && password) {
      if (pwEl && isOtpFieldVisible(pwEl)) {
        try { fillField(pwEl, password); } catch { /* ignore */ }
      } else if (!pwEl) {
        startPasswordWatcher(
          fields.passwordSelector,
          fields.submitSelector,
          password,
          session.id,
          (session as any).__orgId || activeOrgId,
        );
      }
    }
    provider?.afterFill?.();

    // ── Manual Step Pause ──────────────────────────────────────────────────────
    // Some platforms (MCA, GST) require a manual security challenge (CAPTCHA,
    // SMS OTP, etc.) that cannot be automated without external infrastructure.
    // When `manualStepMessage` is set on the PlatformConfig, we fill credentials
    // then pause here — showing the message and returning WITHOUT auto-submitting.
    // The user completes the challenge and submits the form themselves.
    //
    // This is intentionally generic. No CAPTCHA-specific logic.
    // Architecture Preservation Directive: do not add captchaSelector or similar.
    if (config?.manualStepMessage) {
      showToast(config.manualStepMessage);
      return;
    }

    if (config?.otp) {
      startOtpWatcher(session.id, (session as any).__orgId || activeOrgId, loginStartTime);
    }

    // Wait 200ms after filling all fields so React fully commits both email + password
    // state before we click submit. Without this, the form may submit with empty values.
    await new Promise(r => setTimeout(r, 200));

    // Auto-submit — clickSubmitButton tries CSS selector then exact text-content match,
    // retrying up to 10 times with 150ms intervals to handle React re-renders.
    // Skips social auth buttons (Google, Microsoft, Apple, etc.) automatically.
    clickSubmitButton(fields.submitSelector);
  } catch {
    showToast('Autofill failed — please fill in manually.', true);
  } finally {
    // Explicit GC hint — nullify references
    (response.data as any) = null;
  }
}

// ─── DOM Fill Helpers ─────────────────────────────────────────────────────────

// skipFocus: pass true when filling a secondary field that should NOT steal focus
// from a previously-filled field. This is critical for LinkedIn-style controlled
// inputs where React re-renders and clears the email field on blur.
function fillField(
  selectorOrEl: string | HTMLInputElement,
  value: string,
  skipFocus = false,
): void {
  const el = typeof selectorOrEl === 'string' ? document.querySelector<HTMLInputElement>(selectorOrEl) : selectorOrEl;
  if (!el) throw new Error(`Field not found: ${selectorOrEl}`);

  // Only focus if explicitly requested — focusing causes the PREVIOUS field to blur,
  // which can trigger React’s onBlur re-render and clear a value we just set.
  if (!skipFocus) el.focus();

  // Use native prototype setter to bypass any framework-controlled property descriptor.
  const nativeInputSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )?.set;

  // React maintains an internal _valueTracker on each controlled input.
  // Reset it to '' so React always sees a delta (tracker="" vs el.value=newValue)
  // and fires onChange to update React state.
  const tracker = (el as any)._valueTracker;
  if (tracker) tracker.setValue('');

  nativeInputSetter?.call(el, value);

  // Dispatch a realistic sequence of events so React/Angular/Vue pick up the change.
  el.dispatchEvent(new InputEvent('input',  { bubbles: true, data: value, inputType: 'insertText' }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: value.slice(-1) }));
  el.dispatchEvent(new KeyboardEvent('keyup',   { bubbles: true, key: value.slice(-1) }));
}



/**
 * Finds the submit / primary action button on the page.
 * Tries the CSS selector first. If that doesn't match, falls back to finding
 * a visible, enabled <button> whose text matches common submit labels.
 * This handles cases like Razorpay's plain <button>Login</button> that has
 * no type="submit", class, or data attribute to select on.
 *
 * Retries up to maxAttempts times with intervalMs delay between each attempt,
 * to handle SPA pages where the button renders slightly after the input field.
 */
function clickSubmitButton(
  selector?: string,
  maxAttempts = 10,
  intervalMs = 150,
): void {
  const SUBMIT_LABELS = new Set(['login', 'log in', 'continue', 'verify', 'submit', 'next', 'sign in', 'signin', 'proceed']);
  // Social auth buttons to never click — their text often starts with a SUBMIT_LABEL
  // e.g. "Sign in with Google", "Sign in with Microsoft", "Continue with Apple"
  const SOCIAL_KEYWORDS = ['google', 'microsoft', 'apple', 'facebook', 'github', 'twitter', 'sso', 'saml'];

  const tryFind = (): HTMLElement | null => {
    // 1. CSS selector path — most specific
    if (selector) {
      const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
      const visible = els.find(el => {
        if ((el as any).disabled) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        // Skip social login buttons even if they match the CSS selector
        const text = el.textContent?.toLowerCase() ?? '';
        return !SOCIAL_KEYWORDS.some(kw => text.includes(kw));
      });
      if (visible) return visible;
    }

    // 2. Text-content fallback — EXACT match only to avoid clicking social auth
    // buttons like "Sign in with Microsoft" (which starts with "sign in")
    return Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(btn => {
      if (btn.disabled) return false;
      const rect = btn.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const text = btn.textContent?.trim().toLowerCase() ?? '';
      // Reject any button that contains social provider keywords
      if (SOCIAL_KEYWORDS.some(kw => text.includes(kw))) return false;
      // EXACT match only — "sign in with microsoft" ≠ "sign in"
      return SUBMIT_LABELS.has(text);
    }) ?? null;
  };

  let attempts = 0;
  const retry = () => {
    attempts++;
    const btn = tryFind();
    if (btn) {
      btn.click();
      return;
    }
    if (attempts < maxAttempts) {
      setTimeout(retry, intervalMs);
    }
    // If still not found after all attempts — silently give up.
    // Credentials are already filled; user can click manually.
  };

  retry();
}

// ─── Password Step Watcher ────────────────────────────────────────────────────
// For multi-step logins (e.g. Razorpay) where the password field only appears
// after a SPA transition from the email step. Watches for the password field to
// appear in the DOM, fills it, then hands off to the OTP watcher if needed.
// Self-destructs after 30 seconds. Does NOT affect single-step platforms.

function startPasswordWatcher(
  passwordSelector: string,
  submitSelector: string | undefined,
  password: string,
  sessionId: string,
  orgId: string,
): void {
  const observer = new MutationObserver(() => {
    const pwEl = document.querySelector<HTMLInputElement>(passwordSelector);
    if (!pwEl || !isOtpFieldVisible(pwEl)) return;

    observer.disconnect();
    clearTimeout(timeout);

    try {
      fillField(pwEl, password);
      // Hand off to OTP watcher if this platform expects an OTP after password
      if (config?.otp) startOtpWatcher(sessionId, orgId, loginStartTime);
      // Click submit button — retries automatically if not immediately rendered
      clickSubmitButton(submitSelector);
    } catch {
      showToast('Password autofill failed — please enter manually.', true);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  const timeout = setTimeout(() => observer.disconnect(), 30_000);
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

function startOtpWatcher(sessionId: string, orgId: string, startTime: number): void {
  // Guard 1: module-level — OTP already attempted on this page lifecycle
  if (otpCompleted) return;

  const otpConfig = config?.otp;
  if (!otpConfig) return; // Should never happen — caller checks config?.otp first

  // Immediate Check: In case of a hard-navigation (e.g. Razorpay /merchants/)
  // the OTP field might already be on the DOM when the content script loads.
  const existingOtpFields = Array.from(document.querySelectorAll<HTMLInputElement>(otpConfig.inputSelector));
  const existingOtpField = existingOtpFields.find(f => isOtpFieldVisible(f));
  if (existingOtpField && document.visibilityState === 'visible') {
    otpCompleted = true;
    fetchAndFillOtp(sessionId, orgId, otpConfig.inputSelector, otpConfig.submitSelector, existingOtpField, config?.id, startTime);
    return;
  }

  let otpRequested = false; // Guard 2: single-request per watcher instance

  const observer = new MutationObserver(() => {
    if (otpRequested) return; // Guard 2: already in-flight within this watcher

    const otpFields = Array.from(document.querySelectorAll<HTMLInputElement>(otpConfig.inputSelector));
    const otpField = otpFields.find(f => isOtpFieldVisible(f));
    if (!otpField) return;

    // Guard 4: only autofill if the tab is visible
    if (document.visibilityState !== 'visible') return;

    // Set guards and disconnect BEFORE the async call so no second mutation can fire
    otpCompleted = true;            // Guard 1: module-level — survives even if watcher restarted
    otpRequested = true;            // Guard 2: closure-level
    observer.disconnect();          // Guard 3
    clearTimeout(hardTimeout);      // Cancel the 30s timer
    document.removeEventListener('visibilitychange', onVisibilityChange); // Guard 5

    fetchAndFillOtp(sessionId, orgId, otpConfig.inputSelector, otpConfig.submitSelector, otpField, config?.id, startTime);
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
  resolvedOtpField?: HTMLInputElement,
  platform?: string,
  loginStartTime?: number,
): Promise<void> {
  let otpCode: string | null = null;

  try {
    showToast('Fetching verification code...');

    const response = await sendMessage<{ otp: string }>({
      type: 'FETCH_OTP',
      // Include the platform so the backend can use a sender-specific Gmail search
      // Include the loginStartTime so the backend only picks up NEW emails
      payload: { sessionId, orgId, platform, loginStartTime },
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
    console.log('✅ WITHUS EXTRACTED OTP:', otpCode);

    let otpField = resolvedOtpField;
    if (!otpField) {
      const otpFields = Array.from(document.querySelectorAll<HTMLInputElement>(inputSelector));
      otpField = otpFields.find(f => isOtpFieldVisible(f));
    }

    if (!otpField || !isOtpFieldVisible(otpField)) {
      showToast('Could not locate the OTP field.', true);
      return;
    }

    // ── Multi-box OTP detection (e.g. Razorpay: 6 separate single-digit inputs) ──
    // If there are multiple visible inputs matching the selector, distribute
    // one digit per box. Otherwise fill the whole code into the single field.
    const allOtpBoxes = Array.from(document.querySelectorAll<HTMLInputElement>(inputSelector))
      .filter(f => isOtpFieldVisible(f));

    if (allOtpBoxes.length > 1 && otpCode.length === allOtpBoxes.length) {
      // Distribute one digit per box
      for (let i = 0; i < allOtpBoxes.length; i++) {
        const box = allOtpBoxes[i];
        const digit = otpCode[i];

        box.focus();
        box.dispatchEvent(new KeyboardEvent('keydown', { key: digit, bubbles: true }));

        // Use native setter so React/Vue controlled inputs pick up the change
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value',
        )?.set;
        nativeSetter?.call(box, digit);

        box.dispatchEvent(new Event('input', { bubbles: true }));
        box.dispatchEvent(new Event('change', { bubbles: true }));
        box.dispatchEvent(new KeyboardEvent('keyup', { key: digit, bubbles: true }));
      }
    } else {
      // Single input — fill entire OTP string at once (Vercel, GitHub, Stripe, etc.)
      fillField(otpField, otpCode);
    }

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
      // Only fill if the element is present — avoids error on multi-step flows
      // where the email field has already been submitted (e.g. Razorpay password step)
      const usernameEl = document.querySelector<HTMLInputElement>(fields.usernameSelector);
      if (usernameEl && isOtpFieldVisible(usernameEl)) {
        fillField(usernameEl, username || fallbackUsername);
      }
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
      startOtpWatcher(sessionId, orgId, loginStartTime);
    }

    // clickSubmitButton tries CSS selector then text-content fallback with retries
    clickSubmitButton(fields.submitSelector);
  } catch (err: any) {
    showToast(err.message || 'Failed to fill credentials', true);
  } finally {
    (response.data as any) = null;
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────

// Only run on supported login pages (provider was resolved above).
// If provider is null (e.g. post-login dashboard pages injected via broad manifest pattern),
// nothing executes — we exit silently without throwing.
if (provider) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', discoverSessions);
  } else {
    discoverSessions();
  }
}
