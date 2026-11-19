/**
 * WITHUS Mobile Secure Browser PoC — Controlled Autofill & OTP Engine
 *
 * Implements Phase 4 & Phase 5 Autofill:
 * - Platform-specific username, password, and OTP selectors from WITHUS platform registry
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
    usernameSelector: 'input#email, input[type="email"]',
    passwordSelector: 'input#password, input[type="password"]',
    otpSelector: 'input#prompt-code, input[name="code"], input[autocomplete="one-time-code"]',
  },
  RAZORPAY: {
    usernameSelector: 'input#email, input[type="email"]',
    passwordSelector: 'input#password, input[type="password"]',
    otpSelector: 'input[data-testid="otp-input"], input[autocomplete="one-time-code"], input[inputmode="numeric"]',
  },
  LINKEDIN: {
    usernameSelector: 'input[name="session_key"], #session_key, input[type="email"]',
    passwordSelector: 'input[name="session_password"], #session_password, input[type="password"]',
    otpSelector: 'input#input__email_verification_pin, input[name="pin"], input[autocomplete="one-time-code"]',
  },
  MCA: {
    usernameSelector: 'input[name="user_name"], input#user_name',
    passwordSelector: 'input[name="password"], input#password',
    otpSelector: 'input#otp, input[name="otp"]',
  },
  GST: {
    usernameSelector: 'input#username, input[name="username"]',
    passwordSelector: 'input#user_pass, input[name="user_pass"], input[type="password"]',
    otpSelector: 'input#otp, input[name="otp"]',
  },
  UDYAM: {
    usernameSelector: 'input#ctl00_ContentPlaceHolder1_txtUdyamReNo',
    passwordSelector: 'input#ctl00_ContentPlaceHolder1_txtMobileNo',
    otpSelector: 'input#ctl00_ContentPlaceHolder1_txtOtp',
  },
  GMAIL: {
    usernameSelector: 'input[type="email"], input[name="identifier"]',
    passwordSelector: 'input[type="password"], input[name="Passwd"]',
    otpSelector: 'input[type="tel"], input[name="Pin"], input[autocomplete="one-time-code"]',
  },
  GOOGLE_ADS: {
    usernameSelector: 'input[type="email"], input[name="identifier"]',
    passwordSelector: 'input[type="password"], input[name="Passwd"]',
    otpSelector: 'input[type="tel"], input[name="Pin"], input[autocomplete="one-time-code"]',
  },
};

const GENERIC_SELECTORS: PlatformAutofillSelectors = {
  usernameSelector: 'input[autocomplete="username"], input[name="username"], input[name="login"], input[type="email"]',
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
   * Generate self-executing JavaScript to fill username and password fields.
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

  function queryElementWithShadow(selector) {
    try {
      var direct = document.querySelector(selector);
      if (direct) return direct;
    } catch(e) {}

    var allNodes = document.querySelectorAll('*');
    for (var i = 0; i < allNodes.length; i++) {
      var node = allNodes[i];
      if (node.shadowRoot) {
        try {
          var inside = node.shadowRoot.querySelector(selector);
          if (inside) return inside;
        } catch(e) {}
      }
    }
    return null;
  }

  function fillField(el, value, skipFocus) {
    if (!el || !value) return false;
    try {
      if (!skipFocus) el.focus();

      var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
      if (nativeSetter && nativeSetter.set) {
        nativeSetter.set.call(el, value);
      } else {
        el.value = value;
      }

      var tracker = el._valueTracker;
      if (tracker && typeof tracker.setValue === 'function') {
        tracker.setValue('');
      }

      el.dispatchEvent(new InputEvent('input', { bubbles: true, data: value, inputType: 'insertText' }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: value.slice(-1) }));
      el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: value.slice(-1) }));
      return true;
    } catch (err) {
      el.value = value;
      return true;
    }
  }

  var uEl = queryElementWithShadow(uSel);
  var pEl = queryElementWithShadow(pSel);

  if (!uEl && u) {
    uEl = document.querySelector('input[type="email"], input[name="email"], input[name="username"], input[name="login"]');
  }
  if (!pEl && p) {
    pEl = document.querySelector('input[type="password"]');
  }

  var uFilled = false;
  var pFilled = false;

  if (uEl && u) {
    uFilled = fillField(uEl, u, false);
  }
  if (pEl && p) {
    pFilled = fillField(pEl, p, uFilled);
  }

  // Clear in-memory variables immediately
  u = null;
  p = null;

  var result = {
    type: 'AUTOFILL_RESULT',
    payload: {
      success: uFilled || pFilled,
      usernameFilled: uFilled,
      passwordFilled: pFilled,
      missingUsernameField: !uEl && !!${escapedUsername},
      missingPasswordField: !pEl && !!${escapedPassword}
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
    matches = queryElementsWithShadow('input[autocomplete="one-time-code"], input[name*="otp" i], input[id*="otp" i], input[inputmode="numeric"]').filter(isVisible);
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
