/**
 * WITHUS Mobile Secure Browser PoC — Controlled Autofill, Multi-Step & DOM Hiding Engine
 *
 * Implements:
 * - Full platform parity with verified WITHUS platform registry
 * - Multi-step field-presence-based autofill (Both, Username-only, Password-only)
 * - Safe detection of OTP-only verification screens
 * - Platform-specific DOM element hiding (Show/Hide password toggles & sensitive tabs)
 * - Password input type locking (prevents script-based reveal)
 * - Single-box and multi-box numeric OTP input distribution
 * - React-controlled input setter bypassing framework property descriptors
 * - Recursive open shadow DOM traversal
 * - Sanitizes values and nullifies in-memory JS variables immediately
 * - Strictly avoids auto-submitting forms
 */

import { CredentialService } from './credential.service.ts';

export interface PlatformAutofillSelectors {
  usernameSelector: string;
  passwordSelector: string;
  otpSelector: string;
}

export const PLATFORM_SELECTORS: Record<string, PlatformAutofillSelectors> = {
  GITHUB: {
    usernameSelector: 'input[name="login"], input#login_field',
    passwordSelector: 'input[name="password"], input#password',
    otpSelector: 'input#otp, input[name="otp"]',
  },
  VERCEL: {
    usernameSelector: 'input[type="email"], input[name="email"]',
    passwordSelector: 'input[type="password"], input[name="password"]',
    otpSelector: 'input[autocomplete="one-time-code"], input[inputmode="numeric"], input[type="number"], input[name="code"], input[type="text"][maxlength="1"]',
  },
  SHOPIFY: {
    usernameSelector: 'input[type="email"], input[autocomplete="username"], #account_email',
    passwordSelector: 'input[type="password"], input[autocomplete="current-password"], #account_password',
    otpSelector: 'input#account_one_time_code, input[name="account[one_time_code]"], input[autocomplete="one-time-code"]',
  },
  GODADDY: {
    usernameSelector: '#username, input[name="username"], input[type="email"]',
    passwordSelector: '#password, input[name="password"], input[type="password"]',
    otpSelector: 'input#verification-code-input, input[autocomplete="one-time-code"], input[placeholder*="6-digit code" i]',
  },
  STRIPE: {
    usernameSelector: 'input[type="email"], input[name="email"], input[autocomplete="username"], input#email',
    passwordSelector: 'input[type="password"], input[name="password"], input[autocomplete="current-password"], input#password, input#old-password',
    otpSelector: 'input[name="otp"], input[autocomplete="one-time-code"], input[name="verification_code"], input#prompt-code',
  },
  RAZORPAY: {
    usernameSelector: 'input[type="email"], input[type="text"], input[type="tel"], input[autocomplete="username"], input[autocomplete="email"], input#email',
    passwordSelector: 'input[type="password"], input[autocomplete="current-password"], input[placeholder*="password" i], input#password',
    otpSelector: 'input[name="otp"], input[autocomplete="one-time-code"], input[inputmode="numeric"][maxlength="1"], input[type="number"][maxlength="1"], input[data-testid="otp-input"]',
  },
  LINKEDIN: {
    usernameSelector: 'input[name="session_key"], input#username, input[type="text"]:not([placeholder*="Search" i]):not(.search-global-typeahead__input), input[type="email"], #session_key',
    passwordSelector: 'input[name="session_password"], input#password, input[type="password"], #session_password',
    otpSelector: 'input#input__email_verification_pin, input[name="pin"], input.input_verification_pin, input[autocomplete="one-time-code"]',
  },
  MCA: {
    usernameSelector: 'input#userName, input#username, input#userId, input#userID, input#loginId, input#loginid, input[name="userName" i], input[name="username" i], input[name="userID" i], input[name="userId" i], input[name="loginid" i], input[name="loginId" i], #userNameId input, #userId input, .userID input, .user-id-input input, input[name="user_name"], input#user_name',
    passwordSelector: 'input[type="password"], input[name="password"], input[id="password"]',
    otpSelector: 'input#otp, input[name="otp"]',
  },
  GST: {
    usernameSelector: '#user_name, input[name="user_name"], input[id="user_name"], input[name="username"], input[id="username"], input#username',
    passwordSelector: '#user_pass, input[name="user_pass"], input[id="user_pass"], input[type="password"], input[name="password"]',
    otpSelector: 'input#otp, input[name="otp"]',
  },
  UDYAM: {
    usernameSelector: 'input[name="udyam_no"], input[id="udyam_no"], input[name="Udyam_No"], input[name="udyamNo"], input[placeholder*="Udyam" i], input[placeholder*="Registration Number" i], input[maxlength="19"], input#ctl00_ContentPlaceHolder1_txtUdyamReNo',
    passwordSelector: 'input#ctl00_ContentPlaceHolder1_txtMobileNo, input[name*="Mobile" i], input[type="password"]',
    otpSelector: 'input#ctl00_ContentPlaceHolder1_txtOtp, input[name*="otp" i]',
  },
  GMAIL: {
    usernameSelector: 'input#identifierId, input[name="identifier"], input[type="email"]',
    passwordSelector: 'input[name="Passwd"], input[name="password"], input[type="password"]',
    otpSelector: 'input[type="tel"], input[name="Pin"], input[autocomplete="one-time-code"]',
  },
  GOOGLE_ADS: {
    usernameSelector: 'input[type="email"], input[name="identifier"], input#identifierId',
    passwordSelector: 'input[name="Passwd"], input[name="password"], input[type="password"]',
    otpSelector: 'input[type="tel"], input[name="Pin"], input[autocomplete="one-time-code"]',
  },
};

export const PLATFORM_HIDE_CSS: Record<string, string[]> = {
  GITHUB: [
    'a[data-tab-item="actions"]',
    'a[data-tab-item="projects"]:not([href^="/orgs/"])',
    'a[data-tab-item="security-and-quality"]',
    'a[data-tab-item="wiki"]',
    'a[data-tab-item="insights"]',
    'a[data-tab-item="settings"]',
    'a[data-tab-item="people"]',
    'a[data-tab-item="projects"][href^="/orgs/"]',
  ],
  VERCEL: [
    'a[data-sidebar-link-key="Domains"]',
    'a[data-sidebar-link-key="Analytics"]',
    'a[data-sidebar-link-key="Environment Variables"]',
    'a[data-sidebar-link-key="Storage"]',
    'a[data-sidebar-link-key="Integrations"]',
    'a[data-sidebar-link-key="Settings"]',
  ],
  GODADDY: [
    'button[aria-label="Show password" i]',
    'button[aria-label="Hide password" i]',
    'button[aria-label*="password" i]',
    'button[data-eid*="password" i]',
    '[data-eid*="password_toggle" i]',
    '[data-eid*="show_password" i]',
    '[data-eid*="hide_password" i]',
    'button:has(svg[data-testid*="eye" i])',
    'button:has(svg[data-testid*="visibility" i])',
    '[data-eid="pandc.vnext_dashboard.header/domain.menu_item.click"]',
    '[data-eid="pandc.vnext_dashboard.header/website.menu_item.click"]',
    '[data-eid="pandc.vnext_dashboard.header/email.menu_item.click"]',
    '[data-eid="pandc.vnext_dashboard.header/store.menu_item.click"]',
    '[data-eid="pandc.vnext_dashboard.header/billing.menu_item"]',
    'a[href*="billing"]',
    '[data-eid="pandc.vnext_dashboard.header/account_settings.menu_item.click"]',
  ],
  SHOPIFY: [
    'button.js-password-button',
    'button[aria-controls="account_password"]',
    'a[href$="/orders"]',
    'a[href$="/products"]',
    'a[href$="/customers"]',
    'a[href$="/analytics"]',
    'a[href$="/settings"]',
  ],
  STRIPE: [
    'button[aria-label="Show password" i]',
    'button[aria-label="Hide password" i]',
    'form:has(input[type="password"]) button:has(svg path[d^="M8 6a2 2 0 1 0 0 4"])',
    'form:has(input[type="password"]) svg:has(path[d^="M8 6a2 2 0 1 0 0 4"])',
    'li[data-testid="core-nav-item-payments"]',
    'li[data-testid="core-nav-item-customers"]',
    'a[data-testid="toggle-workload-billing"]',
    'section#developer-nav',
  ],
  RAZORPAY: [
    'button[aria-label="Show password" i]',
    'button[data-blade-component="icon-button"] svg',
    'a[href="/app/payments"]',
    'a[href="/app/settlements"]',
    'a[href="/app/reports"]',
    'a[href="/app/account-settings"]',
  ],
  LINKEDIN: [
    'button[aria-label="Show password" i]',
    'button:has(svg#visibility-small)',
    '#password-visibility-toggle',
    '.button__password-visibility',
    'span#password-visibility-toggle',
    '[id="password-visibility-toggle"]',
    'button[data-id="sign-in-form__password-visibility-toggle"]',
    'input#newPassword',
    '#newPassword',
    'input[name="newPassword"]',
    'div:has(> input#newPassword)',
    'div:has(> #newPassword)',
    'a[href^="https://www.linkedin.com/mynetwork"]',
    'a[href^="https://www.linkedin.com/jobs"]',
    'a[href^="https://www.linkedin.com/messaging"]',
    'a[href^="https://www.linkedin.com/notifications"]',
    '[data-test-org-menu-item="SETTINGS"]',
  ],
  MCA: [
    'li.level-1:has(> a[href$="/mca/master-data.html"])',
    'li.level-1:has(> a[href$="/mca/company-llp-filing.html"])',
    'li.level-1:has(> a[href$="/mca/complaints.html"])',
  ],
  GST: [
    'a[href*="/services/auth/quicklinks/registration"]',
  ],
  UDYAM: [
    'a[href="Udyam_Cancellation.aspx"]',
  ],
  GMAIL: [
    'div[jsname="wQNmvb"]',
    'a[href*="app.goo.gl"]',
    'a[href*="goo.gl"]',
    'div[data-smartbanner]',
    'header a[href*="goo.gl"]',
  ],
  GOOGLE_ADS: [],
};

// Generic password reveal eye-toggle selectors applied across login forms
const GENERIC_PASSWORD_TOGGLE_SELECTORS = [
  'button[aria-label="Show password" i]',
  'button[aria-label="Hide password" i]',
  'button[aria-label*="password" i]',
  '[data-testid*="eye" i]',
  '[data-testid*="visibility" i]',
  'button:has(svg[data-testid*="eye" i])',
  'button:has(svg[data-testid*="visibility" i])',
];

const GENERIC_SELECTORS: PlatformAutofillSelectors = {
  usernameSelector: 'input[autocomplete="username"], input[name="username"], input[name="login"], input[type="email"], input[type="text"]',
  passwordSelector: 'input[autocomplete="current-password"], input[type="password"], input[name="password"]',
  otpSelector: 'input[autocomplete="one-time-code"], input[name*="otp" i], input[id*="otp" i], input[name*="code" i], input[inputmode="numeric"]',
};

export class AutofillService {
  /**
   * Get platform selectors matching verified WITHUS platform configs
   */
  static getSelectorsForPlatform(platformKey: string): PlatformAutofillSelectors {
    const key = (platformKey || '').toUpperCase().trim();
    return PLATFORM_SELECTORS[key] || GENERIC_SELECTORS;
  }

  /**
   * Ported from Extension: Generate platform-specific and generic CSS rules to hide show-password buttons
   * and unallowed dashboard/navigation elements.
   */
  static getHideRulesForPlatform(platformKey: string): string[] {
    const key = (platformKey || '').toUpperCase().trim();
    const platformRules = PLATFORM_HIDE_CSS[key] || [];
    const combined = [...platformRules, ...GENERIC_PASSWORD_TOGGLE_SELECTORS];
    return Array.from(new Set(combined.filter(Boolean)));
  }

  /**
   * Build self-executing JavaScript that injects and maintains the DOM hiding styles
   * without duplicate style tags and with dynamic DOM change handling.
   */
  static buildDomHidingScript(platformKey: string): string {
    const rules = this.getHideRulesForPlatform(platformKey);
    const escapedRulesJson = JSON.stringify(rules);

    return `
(function() {
  // Gracefully polyfill Web Notification API to prevent webmail notification errors in embedded runtime
  try {
    if (typeof window !== 'undefined') {
      var DummyNotification = function(title, options) {
        this.title = title;
        this.options = options;
      };
      DummyNotification.permission = 'granted';
      DummyNotification.requestPermission = function() {
        return Promise.resolve('granted');
      };
      DummyNotification.maxActions = 2;
      window.Notification = DummyNotification;
    }
  } catch (_) {}

  var styleId = 'withus-capability-enforcer-css';
  var rules = ${escapedRulesJson};
  if (!rules || rules.length === 0) return;

  function applyStyles() {
    var existing = document.getElementById(styleId);
    if (!existing) {
      existing = document.createElement('style');
      existing.id = styleId;
      var head = document.head || document.documentElement;
      if (head) {
        head.appendChild(existing);
      }
    }
    existing.textContent = rules.map(function(sel) {
      return sel + ' { display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }';
    }).join('\\n');
  }

  applyStyles();

  if (!window.__WITHUS_MUTATION_OBSERVER__) {
    try {
      var observer = new MutationObserver(function() {
        if (!document.getElementById(styleId)) {
          applyStyles();
        }
      });
      var target = document.documentElement || document.body;
      if (target) {
        observer.observe(target, { childList: true, subtree: true });
        window.__WITHUS_MUTATION_OBSERVER__ = true;
      }
    } catch(e) {}
  }
})();
true;
    `.trim();
  }

  /**
   * Generate self-executing JavaScript to fill username and password fields.
   * Supports:
   * - Both username and password on same screen
   * - Multi-step: Username only (without error)
   * - Multi-step: Password only (without requiring username on DOM)
   * - OTP screen detection
   * - Shadow DOM traversal
   * - Password input type locking
   */
  static buildAutofillScript(
    platformKey: string,
    username: string,
    password: string,
  ): string {
    const selectors = this.getSelectorsForPlatform(platformKey);
    const escapedUsername = CredentialService.escapeForScript(username);
    const escapedPassword = CredentialService.escapeForScript(password);
    const usernameSel = CredentialService.escapeForScript(selectors.usernameSelector);
    const passwordSel = CredentialService.escapeForScript(selectors.passwordSelector);

    return `
(function() {
  var u = ${escapedUsername};
  var p = ${escapedPassword};
  var uSel = ${usernameSel};
  var pSel = ${passwordSel};

  function isVisible(el) {
    if (!el) return false;
    if (el.type === 'hidden') return false;
    if (el.disabled) return false;
    var style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function queryElementsWithShadow(selector) {
    var out = [];
    if (!selector) return out;
    try {
      var direct = document.querySelectorAll(selector);
      for (var d = 0; d < direct.length; d++) out.push(direct[d]);
    } catch(e) {}

    var allNodes = document.querySelectorAll('*');
    for (var i = 0; i < allNodes.length; i++) {
      var node = allNodes[i];
      if (node.shadowRoot) {
        try {
          var inside = node.shadowRoot.querySelectorAll(selector);
          for (var j = 0; j < inside.length; j++) out.push(inside[j]);
        } catch(e) {}
      }
    }
    return out;
  }

  function findFirstVisible(selector) {
    var elements = queryElementsWithShadow(selector);
    for (var i = 0; i < elements.length; i++) {
      if (isVisible(elements[i])) return elements[i];
    }
    return null;
  }

  function fillField(el, value, skipFocus) {
    if (!el || !value) return false;
    try {
      if (!skipFocus) el.focus();

      var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
      try {
        if (nativeSetter && nativeSetter.set) {
          nativeSetter.set.call(el, value);
        }
      } catch(e) {}
      el.value = value;

      var tracker = el._valueTracker;
      if (tracker && typeof tracker.setValue === 'function') {
        tracker.setValue('');
      }

      el.dispatchEvent(new InputEvent('input', { bubbles: true, data: value, inputType: 'insertText' }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: value.slice(-1) }));
      el.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, key: value.slice(-1) }));
      el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: value.slice(-1) }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
      return true;
    } catch (err) {
      el.value = value;
      return true;
    }
  }

  var uEl = findFirstVisible(uSel);
  var pEl = findFirstVisible(pSel);

  // Fallback to generic visible fields if platform-specific didn't match
  if (!uEl && u) {
    uEl = findFirstVisible('input[autocomplete="username"], input[name="username"], input[name="login"], input[type="email"], input[type="text"][name*="user" i]');
  }
  if (!pEl && p) {
    pEl = findFirstVisible('input[autocomplete="current-password"], input[type="password"], input[name="password"]');
  }

  // Check if this is an OTP-only screen (e.g. only OTP/verification fields present, no username or password)
  var isOtpScreen = !uEl && !pEl && !!findFirstVisible('input[autocomplete="one-time-code"], input[name*="otp" i], input[id*="otp" i], input[inputmode="numeric"]');

  var uFilled = false;
  var pFilled = false;
  var step = 'UNKNOWN';

  if (uEl && pEl && u && p) {
    step = 'BOTH';
    uFilled = fillField(uEl, u, false);
    pFilled = fillField(pEl, p, false);
  } else if (uEl && u && !pEl) {
    step = 'USERNAME_ONLY';
    uFilled = fillField(uEl, u, false);
  } else if (pEl && p && !uEl) {
    step = 'PASSWORD_ONLY';
    pFilled = fillField(pEl, p, false);
  }

  // Security lock on password element: prevent script inspection or reveal
  if (pEl) {
    try {
      Object.defineProperty(pEl, 'type', {
        get: function() { return 'password'; },
        set: function() {},
        configurable: true
      });
    } catch(e) {}
  }

  // Clear in-memory variables immediately
  u = null;
  p = null;

  var success = uFilled || pFilled;
  var errorMessage = null;
  if (!success) {
    if (isOtpScreen) {
      errorMessage = 'Verification screen detected. Please tap "Fetch OTP" to enter your security code.';
    } else {
      errorMessage = 'No compatible login fields detected on this screen.';
    }
  }

  var result = {
    type: 'AUTOFILL_RESULT',
    payload: {
      success: success,
      step: step,
      isOtpScreen: isOtpScreen,
      usernameFilled: uFilled,
      passwordFilled: pFilled,
      missingUsernameField: !uEl && !!${escapedUsername},
      missingPasswordField: !pEl && !!${escapedPassword},
      uTag: uEl ? (uEl.tagName + '#' + uEl.id + '[name=' + uEl.name + ']') : 'NONE',
      pTag: pEl ? (pEl.tagName + '#' + pEl.id + '[name=' + pEl.name + ']') : 'NONE',
      error: errorMessage
    }
  };

  if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
    window.ReactNativeWebView.postMessage(JSON.stringify(result));
  }
})();
true;
    `.trim();
  }

  /**
   * Generate self-executing JavaScript to fill OTP fields.
   * Supports single-box and multi-box numeric OTP inputs.
   */
  static buildOtpFillScript(platformKey: string, otpCode: string): string {
    const selectors = this.getSelectorsForPlatform(platformKey);
    const escapedOtp = CredentialService.escapeForScript(otpCode);
    const escapedOtpSelector = CredentialService.escapeForScript(selectors.otpSelector);

    return `
(function() {
  var code = ${escapedOtp};
  var sel = ${escapedOtpSelector};

  function isVisible(el) {
    if (!el) return false;
    if (el.type === 'hidden') return false;
    if (el.disabled) return false;
    var style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function queryElementsWithShadow(selector) {
    var out = [];
    try {
      var direct = document.querySelectorAll(selector);
      for (var d = 0; d < direct.length; d++) out.push(direct[d]);
    } catch(e) {}

    var allNodes = document.querySelectorAll('*');
    for (var i = 0; i < allNodes.length; i++) {
      var node = allNodes[i];
      if (node.shadowRoot) {
        try {
          var inside = node.shadowRoot.querySelectorAll(selector);
          for (var j = 0; j < inside.length; j++) out.push(inside[j]);
        } catch(e) {}
      }
    }
    return out;
  }

  function setNativeValue(el, val) {
    var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    if (nativeSetter && nativeSetter.set) {
      nativeSetter.set.call(el, val);
    } else {
      el.value = val;
    }
    var tracker = el._valueTracker;
    if (tracker && typeof tracker.setValue === 'function') {
      tracker.setValue('');
    }
  }

  // Discover matching visible inputs
  var matches = queryElementsWithShadow(sel).filter(isVisible);

  if (matches.length === 0) {
    // Fallback to generic code/otp inputs
    matches = queryElementsWithShadow('input[autocomplete="one-time-code"], input[name*="otp" i], input[id*="otp" i], input[name*="code" i], input[inputmode="numeric"]').filter(isVisible);
  }

  var success = false;
  var isMultiBox = false;

  if (matches.length > 1 && code.length === matches.length) {
    // Multi-box OTP (e.g. 6 separate single-digit inputs)
    isMultiBox = true;
    for (var k = 0; k < matches.length; k++) {
      var box = matches[k];
      var digit = code[k];
      box.focus();
      box.dispatchEvent(new KeyboardEvent('keydown', { key: digit, bubbles: true }));
      setNativeValue(box, digit);
      box.dispatchEvent(new InputEvent('input', { bubbles: true, data: digit, inputType: 'insertText' }));
      box.dispatchEvent(new Event('change', { bubbles: true }));
      box.dispatchEvent(new KeyboardEvent('keyup', { key: digit, bubbles: true }));
    }
    success = true;
  } else if (matches.length > 0) {
    // Single-box OTP (GitHub, Vercel, Shopify single field)
    var target = matches[0];
    target.focus();
    setNativeValue(target, code);
    target.dispatchEvent(new InputEvent('input', { bubbles: true, data: code, inputType: 'insertText' }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
    target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: code.slice(-1) }));
    target.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: code.slice(-1) }));
    success = true;
  }

  // Clear in-memory OTP variable immediately
  code = null;

  var result = {
    type: 'OTP_FILL_RESULT',
    payload: {
      success: success,
      count: matches.length,
      isMultiBox: isMultiBox,
      error: success ? null : 'Could not locate visible OTP input fields on page.'
    }
  };

  if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
    window.ReactNativeWebView.postMessage(JSON.stringify(result));
  }
})();
true;
    `.trim();
  }
}
