# WITHUS Mobile Secure Browser — Developer Setup & Build Guide

**Version:** 1.0 (Proof of Concept — Phase 6)  
**Date:** November 18, 2026  
**Target:** Android (API 24–36, compileSdk 37)  
**Package Path:** `apps/mobile/`  

---

## 1. Prerequisites

Before building or running the mobile application locally, ensure the following tools are installed:

1. **Node.js**: v20 or higher (v24 recommended).
2. **Java Development Kit (JDK)**: JDK 17 or JDK 21.
3. **Android SDK**:
   * Android SDK Platforms: `android-36`, `android-37` (located at `%LOCALAPPDATA%\Android\Sdk\platforms`).
   * Android SDK Build-Tools: `36.1.0`.
   * Android NDK: `28.2.13676358` (or configured via Gradle).
4. **Environment Variables**:
   * `ANDROID_HOME`: `C:\Users\<username>\AppData\Local\Android\Sdk`
   * `JAVA_HOME`: Path to JDK 17/21 installation.
   * `PATH`: Include `%ANDROID_HOME%\platform-tools` and `%JAVA_HOME%\bin`.

---

## 2. Directory Isolation & Monorepo Structure

All mobile code is completely isolated within `apps/mobile/` to avoid polluting existing web, API, extension, or package configurations:

```
apps/mobile/
├── android/                   # Native Android project (Gradle, Kotlin, C++ JNI)
│   ├── app/
│   │   ├── build.gradle       # Android application build configuration
│   │   └── src/main/java/     # MainActivity.kt (with FLAG_SECURE)
│   ├── build.gradle           # Root Gradle build configuration
│   ├── gradle.properties      # JVM memory & SDK path configuration
│   └── gradlew.bat            # Gradle wrapper executable
├── src/
│   ├── screens/               # React Native UI screens (LoginScreen, DashboardScreen, SecureBrowserScreen)
│   ├── services/              # API, Storage, Autofill, and Security services
│   ├── types/                 # Shared TypeScript interfaces
│   └── __tests__/             # Automated unit and security verification suites
├── app.json                   # Expo configuration
├── package.json               # Mobile-specific dependencies
└── tsconfig.json              # TypeScript configuration
```

---

## 3. Running Unit & Security Tests

Run the focused test suites from the repository root:

```bash
# Phase 2: Auth, Storage & Mutex
node --experimental-strip-types apps/mobile/src/__tests__/phase2-auth.test.ts

# Phase 3: WebView Navigation Security
node --experimental-strip-types apps/mobile/src/__tests__/phase3-webview-security.test.ts

# Phase 4: Controlled Autofill & Sanitization
node --experimental-strip-types apps/mobile/src/__tests__/phase4-autofill.test.ts

# Phase 5: Gmail OTP Extraction & Cooldown
node --experimental-strip-types apps/mobile/src/__tests__/phase5-otp.test.ts

# Phase 6: Full 11-Platform Compatibility
node --experimental-strip-types apps/mobile/src/__tests__/phase6-compatibility.test.ts
```

---

## 4. Building the Android Debug APK

To compile and package the native Android debug APK:

```bash
cd apps/mobile/android
.\gradlew.bat :app:assembleDebug
```

Upon completion, the installable APK will be generated at:
```
apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 5. Installing on an Android Device or Emulator

With an Android device connected via USB (with Developer Options & USB Debugging enabled) or an emulator running:

```bash
# Check connected devices
adb devices

# Install the APK
adb install -r apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk

# Launch the application
adb shell am start -n com.withus.securebrowser/.MainActivity
```

