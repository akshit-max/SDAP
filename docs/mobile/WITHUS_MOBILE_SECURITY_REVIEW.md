# WITHUS Mobile Secure Browser — Security Review & Hardening Report

**Version:** 1.1 (Proof of Concept — Phase 6 Final Verification)  
**Date:** November 18, 2026  
**Security Status:** Hardened, Audited & Documented  
**Branch:** `feat/withus-mobile-secure-browser-poc`  

---

## 1. Threat Model & Mobile Attack Surface

Mobile environments introduce unique attack vectors distinct from desktop browser extensions:

| Threat Vector | Target Severity | Mitigation Mechanism | Residual Risk / Limitation |
| :--- | :---: | :--- | :--- |
| **System Screenshots** | High | Native `WindowManager.LayoutParams.FLAG_SECURE` | External physical cameras |
| **Screen Recording & Screen Cast** | High | Native `WindowManager.LayoutParams.FLAG_SECURE` | Rooted device kernel frame scraping |
| **Recent Apps (Task Switcher) Snapshot** | High | Native `FLAG_SECURE` + `isAppInBackground` Privacy Curtain | System-level OS vulnerabilities |
| **Active DOM Password/OTP Retention** | Critical | Automated DOM input zeroing via `injectJavaScript` on backgrounding | Memory traces in V8 render heap prior to GC |
| **In-Memory RAM Inspection** | Critical | Ephemeral React Native `useRef` purged on backgrounding/unmount | Non-deterministic Hermes/V8 garbage collection |
| **Token Theft from Disk** | Critical | Keystore-backed AES-GCM (`expo-secure-store`) | Root-level hardware key extraction |
| **Arbitrary Navigation / Open Redirects** | High | Strict HTTPS + Exact Hostname / Subdomain Allowlist | None (Blocked at WebView policy hook) |
| **Cross-Tenant Credential Decryption** | Critical | Server-side Grantee + Active Membership RBAC verification | None (Enforced by backend) |

---

## 2. Hardening Measures Implemented

### 2.1 Native Screen-Capture Protection (`FLAG_SECURE`)
In `apps/mobile/android/app/src/main/java/com/withus/securebrowser/MainActivity.kt`:
```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    setTheme(R.style.AppTheme)
    
    // Enforce FLAG_SECURE on the application window
    window.setFlags(
        WindowManager.LayoutParams.FLAG_SECURE,
        WindowManager.LayoutParams.FLAG_SECURE
    )
    
    super.onCreate(null)
}
```
**Protection Scope**:
1. **Hardware Screenshots**: Intercepted by Android OS window compositor (`SurfaceFlinger`), producing: *"Can't take screenshot due to security policy."*
2. **Screen Recording**: Third-party screen recorders, Android Studio screen recording, and Google Cast stream solid black pixels for the secure window.
3. **Task Switcher / Recent Apps**: When the user swipes up or presses the app switcher, Android blanks the preview card, preventing visual credential capture.

### 2.2 Dual-Layer App Backgrounding Security

When the application is minimized, switches tasks, or receives an incoming phone call (`AppState` changes to `'background'` or `'inactive'`), two security operations execute simultaneously:

#### Layer 1: Active DOM Credential & OTP Zeroing
Merely clearing a JavaScript variable in React Native does NOT wipe HTML input elements already rendered on a web page. To prevent DOM-level persistence, a self-executing zeroing script is injected immediately into the active WebView:
```javascript
(function() {
  try {
    var sensitiveInputs = document.querySelectorAll(
      'input[type="password"], input[autocomplete="current-password"], input[autocomplete="one-time-code"], input[name*="otp" i], input[id*="otp" i]'
    );
    for (var i = 0; i < sensitiveInputs.length; i++) {
      var el = sensitiveInputs[i];
      var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
      if (nativeSetter && nativeSetter.set) {
        nativeSetter.set.call(el, '');
      } else {
        el.value = '';
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  } catch(e) {}
})();
true;
```
* **Result**: Any password or OTP value sitting in an unsubmitted form is instantly replaced with an empty string `''` in the DOM, and input events are triggered to notify front-end frameworks (React/Vue/Angular).
* **Session Preservation**: Web cookies, session storage, and navigation state remain intact. The user does not lose their page. When they return to the app, they can simply tap "Fill Credentials" again.

#### Layer 2: In-Memory Cache Purge & Visual Privacy Shield
* `cachedCredentialsRef.current = null;` purges the ephemeral plaintext credential reference from React Native memory.
* `isAppInBackground = true` renders a full-screen, opaque privacy shield (`#0B0F19`) displaying: *"Session Paused for Security — Sensitive fields cleared from active DOM"*.

### 2.3 Android Keystore Token Protection
* Access tokens and refresh tokens are stored exclusively via `expo-secure-store` backed by the Android Keystore system.
* Tokens are never stored in `AsyncStorage`, SQLite, SharedPreferences, or unencrypted files.
* Refresh-token rotation is guarded by a concurrency-safe promise mutex to prevent concurrent refresh calls from triggering family reuse revoking.

### 2.4 Strict HTTPS & Origin Boundaries
* `NavigationSecurityService.evaluateNavigation()` enforces strict HTTPS (`http:`, `javascript:`, `file:`, `data:`, `intent:` are blocked).
* Navigation and autofill are restricted to platform-approved hostnames and registered subdomains.

---

## 3. Truthful Security Assessment & Residual Risks

### 3.1 Why JavaScript Nullification Is Not Instant Memory Erasure
* In high-level managed runtimes (V8 in Chromium and Hermes in React Native), assigning `variable = null;` merely removes the variable's reference pointer.
* The underlying memory allocated on the heap remains until a garbage collection (GC) sweep occurs, which is asynchronous, non-deterministic, and triggered by heap pressure.
* **Neither V8 nor Hermes provides an API to cryptographically zero raw heap bytes in RAM.** Therefore, claims of "guaranteed instant memory wiping" in JavaScript are technically inaccurate.

### 3.2 WebView DOM Retention Prior to Backgrounding
* Once credentials or OTP codes are injected into DOM `<input>` elements, they remain resident in Chromium's render process until:
  1. The user submits the form and navigates to the next page.
  2. The app is backgrounded (triggering our DOM-zeroing script).
  3. The user closes the browser (unmounting the WebView and destroying its process).

### 3.3 Rooted Devices & Physical Attack Vectors
* **Physical Camera**: `FLAG_SECURE` prevents software screenshots, but cannot prevent someone from photographing the physical display with a secondary device.
* **Rooted OS / Unlocked Bootloaders**: On a rooted Android device (`su`), an adversary with kernel privileges can bypass `FLAG_SECURE` via custom Magisk modules (e.g. `DisableFlagSecure`), hook native libc methods, or dump process memory via `/proc/<pid>/mem`.
* **Recommendation for Production**: Integrate Google Play Integrity API in production release builds to detect rooted devices, unlocked bootloaders, and untrusted environments.

---

## 4. Remaining Real-Device Verification Requirements

Before enterprise deployment, the following live verification tests must be conducted on a physical Android device:
1. **Physical Fingerprint / Biometric Authenticator**: Confirm biometric prompt behavior and Keystore hardware binding on physical hardware.
2. **Third-Party Login Endpoints**: Conduct live logins using dedicated test sandbox credentials to verify whether third-party CDNs (Akamai, Cloudflare, Arkose) challenge the app's specific Android WebView user agent.
3. **Live Gmail OTP Relay**: Execute a real-time login on a platform configured with a test Gmail account to measure real-world email arrival latency against the 5-second client throttling cooldown.
