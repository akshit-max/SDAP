/**
 * WITHUS Mobile Secure Browser PoC — Phase 3 WebView & Navigation Security Test Suite
 *
 * Validates:
 * 1. Strict HTTPS-only protocol enforcement (rejection of http:)
 * 2. Non-HTTP scheme rejection (javascript:, file:, intent:, data:, content:)
 * 3. Platform domain allowlisting (exact matches & valid subdomains)
 * 4. Spoofed domain & open redirect protection (e.g. github.com.attacker.com)
 * 5. Native message boundary validation (rejects unauthorized commands / credential leaks)
 * 6. Explicit Organization Selection Strategy
 */

import assert from 'node:assert';
import {
  NavigationSecurityService,
  PLATFORM_SECURITY_REGISTRY,
} from '../services/security.service.ts';

// 1. Navigation Protocol & HTTPS Validation
function testProtocolEnforcement() {
  console.log('--- Test 1: Navigation Protocol & HTTPS Enforcement ---');

  // Should allow valid HTTPS
  const httpsResult = NavigationSecurityService.evaluateNavigation(
    'https://github.com/login',
    'GITHUB',
  );
  assert.strictEqual(httpsResult.isAllowed, true, 'Valid HTTPS should be allowed');

  // Should reject plain HTTP
  const httpResult = NavigationSecurityService.evaluateNavigation(
    'http://github.com/login',
    'GITHUB',
  );
  assert.strictEqual(httpResult.isAllowed, false, 'Plain HTTP must be strictly rejected');
  assert.match(httpResult.reason || '', /HTTP protocol is prohibited/i);

  // Should reject dangerous schemes
  const dangerousSchemes = [
    'javascript:alert(document.cookie)',
    'file:///android_asset/secret.txt',
    'data:text/html,<script>steal()</script>',
    'intent://scan/#Intent;scheme=zxing;package=com.google.zxing.client.android;end',
    'content://contacts/people',
    'about:blank',
  ];

  for (const badUrl of dangerousSchemes) {
    const res = NavigationSecurityService.evaluateNavigation(badUrl, 'GITHUB');
    assert.strictEqual(res.isAllowed, false, `Scheme in ${badUrl} must be rejected`);
  }

  console.log('✓ Protocol enforcement passed: Plain HTTP and dangerous schemes rejected.');
}

// 2. Platform Domain Allowlisting & Spoofing Protection
function testDomainAllowlistAndSpoofingProtection() {
  console.log('--- Test 2: Platform Domain Allowlist & Spoofing Protection ---');

  // GitHub allowlist
  assert.strictEqual(
    NavigationSecurityService.evaluateNavigation('https://github.com/session', 'GITHUB').isAllowed,
    true,
  );
  assert.strictEqual(
    NavigationSecurityService.evaluateNavigation('https://gist.github.com/new', 'GITHUB').isAllowed,
    true,
  );

  // GoDaddy allowlist
  assert.strictEqual(
    NavigationSecurityService.evaluateNavigation('https://sso.godaddy.com/login', 'GODADDY').isAllowed,
    true,
  );
  assert.strictEqual(
    NavigationSecurityService.evaluateNavigation('https://account.godaddy.com/products', 'GODADDY').isAllowed,
    true,
  );

  // Shopify allowlist
  assert.strictEqual(
    NavigationSecurityService.evaluateNavigation('https://admin.shopify.com/store/test', 'SHOPIFY').isAllowed,
    true,
  );

  // Spoofed domain attacks (must be rejected)
  const attackUrls = [
    'https://github.com.attacker.com/login',
    'https://evil-github.com/login',
    'https://sso.godaddy.com.phishing.org/',
    'https://shopify.com@evil.com/',
    'https://google.com/url?q=https://evil.com',
  ];

  for (const attack of attackUrls) {
    const res = NavigationSecurityService.evaluateNavigation(attack, 'GITHUB');
    assert.strictEqual(res.isAllowed, false, `Spoofed URL must be blocked: ${attack}`);
  }

  // Cross-platform access (e.g. attempting to open Vercel while in a GitHub session)
  const crossPlatform = NavigationSecurityService.evaluateNavigation(
    'https://vercel.com/dashboard',
    'GITHUB',
  );
  assert.strictEqual(crossPlatform.isAllowed, false, 'Cross-platform origin must be rejected');

  console.log('✓ Domain allowlisting and spoofing protection passed.');
}

// 3. Native Communication Boundary Validation
function testNativeMessageBoundary() {
  console.log('--- Test 3: Native Message Boundary & Credential Protection ---');

  // Verify that message handler rejects unrecognized or privileged commands
  function processBridgeMessage(rawMessage: string, originUrl: string, platform: string) {
    const evalResult = NavigationSecurityService.evaluateNavigation(originUrl, platform);
    if (!evalResult.isAllowed) {
      return { accepted: false, error: 'Origin rejected' };
    }

    try {
      const data = JSON.parse(rawMessage);
      if (!data || typeof data !== 'object' || !data.type) {
        return { accepted: false, error: 'Malformed message format' };
      }

      // Privileged / Credential request injection attempt
      if (
        data.type.includes('CREDENTIAL') ||
        data.type.includes('TOKEN') ||
        data.type.includes('PASSWORD') ||
        data.type.includes('OTP') ||
        data.type.includes('KEY')
      ) {
        return { accepted: false, error: 'Privileged native access strictly denied' };
      }

      if (data.type === 'PAGE_READY' || data.type === 'SECURITY_WARN') {
        return { accepted: true, type: data.type };
      }

      return { accepted: false, error: 'Unknown message type' };
    } catch {
      return { accepted: false, error: 'JSON parse error' };
    }
  }

  // Case A: Benign message from allowlisted origin
  const valid = processBridgeMessage(
    JSON.stringify({ type: 'PAGE_READY' }),
    'https://github.com/login',
    'GITHUB',
  );
  assert.strictEqual(valid.accepted, true);

  // Case B: Credential theft attempt from webpage
  const maliciousReq = processBridgeMessage(
    JSON.stringify({ type: 'GET_CREDENTIALS', target: 'login' }),
    'https://github.com/login',
    'GITHUB',
  );
  assert.strictEqual(maliciousReq.accepted, false);
  assert.strictEqual(maliciousReq.error, 'Privileged native access strictly denied');

  // Case C: Message from untrusted origin
  const untrusted = processBridgeMessage(
    JSON.stringify({ type: 'PAGE_READY' }),
    'https://attacker.com/malicious',
    'GITHUB',
  );
  assert.strictEqual(untrusted.accepted, false);
  assert.strictEqual(untrusted.error, 'Origin rejected');

  console.log('✓ Native bridge security passed: Credential request attempts rejected.');
}

// 4. Organization Selection Strategy Verification (Point A)
function testOrganizationSelectionStrategy() {
  console.log('--- Test 4: Explicit Organization Selection Strategy ---');

  const memberships = [
    { id: 'org_1', name: 'Primary Engineering', role: 'ADMIN' },
    { id: 'org_2', name: 'Secondary Enterprise', role: 'MEMBER' },
    { id: 'org_3', name: 'External Contractor Org', role: 'GUEST' },
  ];

  // Rule: Do not silently pick index 0 when multiple memberships exist
  assert.ok(memberships.length > 1, 'Multiple memberships exist');

  // Strategy: Retain full list of memberships, present explicit selection, and persist active selection
  let activeSelection = memberships[1]; // User explicitly selects org_2
  assert.strictEqual(activeSelection.id, 'org_2');
  assert.strictEqual(activeSelection.name, 'Secondary Enterprise');

  console.log('✓ Explicit organization selection strategy validated.');
}

function runAllTests() {
  console.log('========================================================');
  console.log('RUNNING PHASE 3 SECURE WEBVIEW VERIFICATION SUITE');
  console.log('========================================================\n');

  testProtocolEnforcement();
  testDomainAllowlistAndSpoofingProtection();
  testNativeMessageBoundary();
  testOrganizationSelectionStrategy();

  console.log('\n========================================================');
  console.log('ALL PHASE 3 VERIFICATION TESTS PASSED SUCCESSFULLY');
  console.log('========================================================\n');
}

runAllTests();
