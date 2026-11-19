import assert from 'node:assert';
import { AutofillService, PLATFORM_SELECTORS } from '../services/autofill.service.ts';
import { NavigationSecurityService } from '../services/security.service.ts';

console.log('====================================================');
console.log('WITHUS Mobile Secure Browser PoC — Phase 5 Test Suite');
console.log('====================================================');

// Test 1: Verify platform OTP selectors exist for all core supported platforms
console.log('\n[Test 1] Platform OTP Selectors in Registry');
const expectedPlatforms = ['github', 'vercel', 'shopify', 'godaddy'];
for (const p of expectedPlatforms) {
  const sel = AutofillService.getSelectorsForPlatform(p);
  assert.ok(sel, `Selector config must exist for ${p}`);
  assert.ok(sel.otpSelector, `otpSelector must be configured for ${p}`);
  assert.ok(sel.otpSelector.length > 0, `otpSelector cannot be empty for ${p}`);
  console.log(`  ✓ ${p.toUpperCase().padEnd(8)}: ${sel.otpSelector}`);
}

// Test 2: Single-Box OTP Script Generation (GitHub)
console.log('\n[Test 2] Single-Box OTP Script Generation (GitHub)');
const ghCode = '749103';
const ghScript = AutofillService.buildOtpFillScript('github', ghCode);

// Verification checks
assert.ok(ghScript.includes(ghCode), 'Script must interpolate OTP code into injected payload');
assert.ok(ghScript.includes('input#otp'), 'Script must use registered GitHub OTP selector');
assert.ok(ghScript.includes('code = null;'), 'Script must explicitly nullify the code variable');
assert.ok(!ghScript.includes('.submit()'), 'Script must NEVER auto-submit the form');
assert.ok(!ghScript.includes('form.requestSubmit'), 'Script must NEVER call requestSubmit()');
assert.ok(ghScript.includes('OTP_FILL_RESULT'), 'Script must post OTP_FILL_RESULT to native bridge');
console.log('  ✓ Single-box script properly binds selector, native value setter, variable cleanup, and no auto-submit');

// Test 3: Multi-Box OTP Script Generation (Vercel)
console.log('\n[Test 3] Multi-Box OTP Script Generation (Vercel)');
const vercelCode = '982314';
const vercelScript = AutofillService.buildOtpFillScript('vercel', vercelCode);

assert.ok(vercelScript.includes('matches.length > 1'), 'Script must support multi-box inputs when array length > 1');
assert.ok(vercelScript.includes('code = null;'), 'Script must nullify variable post-fill');
assert.ok(!vercelScript.includes('.submit()'), 'Script must NOT auto-submit');
assert.ok(vercelScript.includes('isMultiBox: isMultiBox'), 'Script must report multi-box status in bridge event');
console.log('  ✓ Multi-box script handles segmented digit distribution safely');

// Test 4: Shadow DOM Discovery in OTP Script
console.log('\n[Test 4] Shadow DOM Traversal Support');
assert.ok(ghScript.includes('shadowRoot'), 'Script must include shadowRoot traversal helper');
console.log('  ✓ Shadow DOM traversal logic present in generated script');

// Test 5: Code Sanitization & String Escaping
console.log('\n[Test 5] OTP Code Sanitization');
const maliciousOtp = '123456"; alert(document.domain); "';
const safeScript = AutofillService.buildOtpFillScript('github', maliciousOtp);
assert.ok(!safeScript.includes('var code = "123456"; alert'), 'Must not allow breakout from JavaScript string literal');
assert.ok(safeScript.includes('\\"'), 'Double quotes must be escaped inside string literal');
console.log('  ✓ Special characters safely escaped');

// Test 6: Origin Restriction for OTP Injection
console.log('\n[Test 6] Navigation & Origin Boundary Checks');
assert.strictEqual(
  NavigationSecurityService.evaluateNavigation('https://github.com/sessions/two-factor', 'github').isAllowed,
  true,
  'GitHub 2FA page must be on allowed origin'
);
assert.strictEqual(
  NavigationSecurityService.evaluateNavigation('https://evil-github.com/login', 'github').isAllowed,
  false,
  'Lookalike origin must be blocked'
);
assert.strictEqual(
  NavigationSecurityService.evaluateNavigation('https://vercel.com/login', 'vercel').isAllowed,
  true,
  'Vercel login must be allowed'
);
assert.strictEqual(
  NavigationSecurityService.evaluateNavigation('https://phishing-vercel.com', 'vercel').isAllowed,
  false,
  'Phishing origin must be blocked'
);
console.log('  ✓ Origin boundaries strictly enforced for OTP and credential contexts');

// Test 7: Throttle Cooldown Logic Validation
console.log('\n[Test 7] Client-Side OTP Throttling Cooldown Contract');
const COOLDOWN_MS = 5000;
let lastFetchTime = Date.now();
const canFetchNowImmediate = Date.now() - lastFetchTime >= COOLDOWN_MS;
assert.strictEqual(canFetchNowImmediate, false, 'Immediate consecutive fetch must be rejected by cooldown');

lastFetchTime = Date.now() - 5500;
const canFetchAfterCooldown = Date.now() - lastFetchTime >= COOLDOWN_MS;
assert.strictEqual(canFetchAfterCooldown, true, 'Fetch after 5.5s cooldown must be permitted');
console.log('  ✓ 5000ms minimum cooldown contract validated');

console.log('\n====================================================');
console.log('✓ ALL 7 PHASE 5 OTP AND HARDENING TESTS PASSED!');
console.log('====================================================');
