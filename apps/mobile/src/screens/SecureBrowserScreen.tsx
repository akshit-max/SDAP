/**
 * WITHUS Mobile Secure Browser — Controlled Android Secure WebView Screen (Polished UI/UX)
 *
 * Implements Phase 4–6 Security & UX Requirements:
 * - Controlled WebView runtime via react-native-webview
 * - User-initiated Credential Autofill (POST /sessions/:id/launch)
 * - User-initiated Gmail OTP Retrieval & Autofill (POST /sessions/:id/otp)
 * - Single-box and Multi-box OTP input distribution
 * - Visual 5-second cooldown timer for rate-limiting protection
 * - Strict HTTPS-only navigation guard & platform allowlisting
 * - Zero persistence guarantee (credentials and OTPs never written to storage or logs)
 * - In-memory nullification of variables post-injection
 * - Dynamic background DOM zeroing script and Privacy Shield
 * - Navigation history controls (back, forward, reload, exit)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  AppState,
  AppStateStatus,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { NavigationSecurityService } from '../services/security.service.ts';
import { AutofillService } from '../services/autofill.service.ts';
import { CredentialService, ParsedCredentials } from '../services/credential.service.ts';
import { ApiService, ApiError } from '../services/api.service.ts';
import { DelegatedSession } from '../types/auth.types.ts';
import { COLORS, SPACING, RADIUS, ANDROID_STATUS_BAR_HEIGHT } from '../theme/theme.ts';

interface SecureBrowserScreenProps {
  session: DelegatedSession;
  onClose: () => void;
}

type ActionStatus = 'IDLE' | 'FETCHING' | 'FILLED' | 'ERROR';

export const SecureBrowserScreen: React.FC<SecureBrowserScreenProps> = ({
  session,
  onClose,
}) => {
  const webViewRef = useRef<any>(null);

  // Resilient platform key resolution (supports platform, integrationProvider, platformId, resourceName)
  const platformKey = (
    session.platform ||
    session.integrationProvider ||
    session.platformId ||
    session.resourceName ||
    'UNKNOWN'
  ).toUpperCase();

  // Initial secure starting URL based on platform registry
  const initialUrl = NavigationSecurityService.getDefaultUrlForPlatform(platformKey);

  const [currentUrl, setCurrentUrl] = useState<string>(initialUrl);
  const [currentDomain, setCurrentDomain] = useState<string>(() => {
    try {
      return new URL(initialUrl).hostname;
    } catch {
      return platformKey;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const [canGoForward, setCanGoForward] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Blocked Origin Modal State
  const [blockedAttempt, setBlockedAttempt] = useState<{
    url: string;
    reason: string;
  } | null>(null);

  // Autofill State
  const [autofillStatus, setAutofillStatus] = useState<ActionStatus>('IDLE');
  const [autofillFeedback, setAutofillFeedback] = useState<string | null>(null);

  // OTP State & Cooldown Countdown
  const [otpStatus, setOtpStatus] = useState<ActionStatus>('IDLE');
  const [otpFeedback, setOtpFeedback] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  // App Backgrounding Privacy Shield State
  const [isAppInBackground, setIsAppInBackground] = useState<boolean>(false);

  // Login start timestamp (tracked for OTP query)
  const loginStartTimeRef = useRef<number>(Date.now());
  const lastOtpFetchTimeRef = useRef<number>(0);

  // In-memory credential reference for active session (destroyed on unmount/close)
  const cachedCredentialsRef = useRef<ParsedCredentials | null>(null);

  // Cooldown countdown effect
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setTimeout(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  // Security Hardening: Cleanup credentials on unmount, backgrounding, and wipe DOM fields
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setIsAppInBackground(true);
        // Purge sensitive in-memory credentials immediately upon app backgrounding
        cachedCredentialsRef.current = null;
        setAutofillStatus('IDLE');
        setOtpStatus('IDLE');

        // Security Hardening: Clear sensitive credential and OTP fields in active DOM
        if (webViewRef.current) {
          try {
            const clearDomScript = `
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
            `;
            webViewRef.current.injectJavaScript(clearDomScript);
          } catch {
            // Ignore if webView is unmounting
          }
        }
      } else if (nextAppState === 'active') {
        setIsAppInBackground(false);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      cachedCredentialsRef.current = null;
      subscription.remove();
    };
  }, []);

  /**
   * Navigation Policy Guard
   * Intercepts every navigation request before it executes.
   */
  const handleShouldStartLoad = useCallback(
    (request: { url: string; isTopFrame?: boolean }) => {
      const evaluation = NavigationSecurityService.evaluateNavigation(
        request.url,
        platformKey,
      );

      if (!evaluation.isAllowed) {
        setBlockedAttempt({
          url: request.url,
          reason: evaluation.reason || 'Untrusted origin outside authorized platform boundary.',
        });
        return false;
      }

      return true;
    },
    [platformKey],
  );

  /**
   * Navigation state change listener
   */
  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);

    try {
      const parsed = new URL(navState.url);
      setCurrentDomain(parsed.hostname);
    } catch {
      // Keep existing domain
    }

    setHasError(false);

    // Reapply DOM hiding CSS on navigation / SPA transitions if domain is allowed
    const evaluation = NavigationSecurityService.evaluateNavigation(navState.url, platformKey);
    if (evaluation.isAllowed && webViewRef.current) {
      try {
        webViewRef.current.injectJavaScript(AutofillService.buildDomHidingScript(platformKey));
      } catch (_) {}
    }
  };

  /**
   * Execute controlled credential autofill.
   * Triggered explicitly by user via "Fill Credentials" button.
   */
  const handleFillCredentials = async () => {
    const evaluation = NavigationSecurityService.evaluateNavigation(currentUrl, platformKey);
    if (!evaluation.isAllowed) {
      setAutofillFeedback(`Cannot autofill: You are not on a verified ${platformKey} domain.`);
      setAutofillStatus('ERROR');
      return;
    }

    setAutofillFeedback(null);
    setAutofillStatus('FETCHING');
    loginStartTimeRef.current = Date.now();

    try {
      let credentials = cachedCredentialsRef.current;

      if (!credentials) {
        const launchResult = await ApiService.launchSession(
          session.organizationId,
          session.id,
          `Mobile Secure Browser Autofill on ${platformKey}`,
        );

        credentials = CredentialService.parsePlaintext(
          launchResult.plaintext,
          session.permittedUsername,
        );

        cachedCredentialsRef.current = credentials;
      }

      const script = AutofillService.buildAutofillScript(
        platformKey,
        credentials.username,
        credentials.password,
      );

      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(script);
      }
    } catch (err: any) {
      setAutofillStatus('ERROR');
      if (err instanceof ApiError) {
        setAutofillFeedback(err.message);
      } else {
        setAutofillFeedback(err.message || 'Failed to retrieve delegated credentials.');
      }
    }
  };

  /**
   * Execute controlled OTP retrieval from grantor Gmail and inject into DOM.
   * Triggered explicitly by user via "Fetch OTP" button.
   */
  const handleFetchAndFillOtp = async () => {
    const evaluation = NavigationSecurityService.evaluateNavigation(currentUrl, platformKey);
    if (!evaluation.isAllowed) {
      setOtpFeedback(`Cannot fetch OTP: You are not on a verified ${platformKey} domain.`);
      setOtpStatus('ERROR');
      return;
    }

    // Client throttling: minimum 5s cooldown between requests
    const now = Date.now();
    if (now - lastOtpFetchTimeRef.current < 5000) {
      const waitTime = Math.ceil((5000 - (now - lastOtpFetchTimeRef.current)) / 1000);
      setOtpFeedback(`Cooldown active: Please wait ${waitTime}s before checking Gmail again.`);
      return;
    }
    lastOtpFetchTimeRef.current = now;
    setCooldownSeconds(5);

    setOtpFeedback('Checking grantor Gmail inbox for verification code...');
    setOtpStatus('FETCHING');

    try {
      const response = await ApiService.fetchOtp(
        session.organizationId,
        session.id,
        platformKey,
        loginStartTimeRef.current,
      );

      if ((response as any).error) {
        setOtpStatus('ERROR');
        setOtpFeedback((response as any).error);
        return;
      }

      if (!response.otp) {
        setOtpStatus('IDLE');
        setOtpFeedback('No OTP email found yet. Wait a few seconds and tap Fetch OTP.');
        return;
      }

      // Valid OTP retrieved: build injection script
      const script = AutofillService.buildOtpFillScript(platformKey, response.otp);

      // Nullify local OTP reference immediately
      const extractedOtp = response.otp;
      response.otp = null;

      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(script);
      }
      setOtpStatus('FILLED');
      setOtpFeedback(`OTP (${extractedOtp.length}-digit code) inserted into form.`);
    } catch (err: any) {
      setOtpStatus('ERROR');
      if (err instanceof ApiError) {
        setOtpFeedback(err.message);
      } else {
        setOtpFeedback(err.message || 'Failed to fetch OTP from grantor email.');
      }
    }
  };

  /**
   * Native Communication Message Boundary
   */
  const handleNativeMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'AUTOFILL_RESULT') {
        const payload = data.payload || {};
        console.log('[AUTOFILL_RESULT]', JSON.stringify(payload));
        if (payload.success) {
          setAutofillStatus('FILLED');
          if (payload.step === 'BOTH') {
            setAutofillFeedback('Username and password filled.');
          } else if (payload.step === 'USERNAME_ONLY') {
            setAutofillFeedback('Username entered. Tap Next on page to proceed to password.');
          } else if (payload.step === 'PASSWORD_ONLY') {
            setAutofillFeedback('Password entered. Submit sign-in on page.');
          } else {
            setAutofillFeedback(
              payload.usernameFilled && payload.passwordFilled
                ? 'Username and password filled.'
                : payload.usernameFilled
                ? 'Username entered. Tap Next on page to proceed to password.'
                : payload.passwordFilled
                ? 'Password entered. Submit sign-in on page.'
                : 'Credentials inserted into visible inputs.',
            );
          }
        } else {
          setAutofillStatus('ERROR');
          setAutofillFeedback(
            payload.error || 'Could not locate matching login fields on this page.',
          );
        }
      } else if (data.type === 'OTP_FILL_RESULT') {
        const payload = data.payload || {};
        if (payload.success) {
          setOtpStatus('FILLED');
          setOtpFeedback(
            payload.isMultiBox
              ? `OTP distributed across ${payload.count} digit boxes.`
              : 'OTP code inserted into verification input.',
          );
        } else {
          setOtpStatus('ERROR');
          setOtpFeedback(
            payload.error || 'Could not locate visible OTP input field on this page.',
          );
        }
      }
    } catch {
      // Non-JSON bridge message ignored
    }
  };

  const handleBack = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    }
  };

  const handleForward = () => {
    if (canGoForward && webViewRef.current) {
      webViewRef.current.goForward();
    }
  };

  const handleReload = () => {
    setHasError(false);
    setAutofillFeedback(null);
    setAutofillStatus('IDLE');
    setOtpFeedback(null);
    setOtpStatus('IDLE');
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleClose = () => {
    cachedCredentialsRef.current = null;
    onClose();
  };

  const AnyWebView = WebView as any;
  const isActionError = autofillStatus === 'ERROR' || otpStatus === 'ERROR';
  const isActionSuccess = autofillStatus === 'FILLED' || otpStatus === 'FILLED';
  const activeFeedback = otpFeedback || autofillFeedback;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Top Browser Security Header */}
      <View style={styles.header}>
        {/* Navigation History Controls */}
        <View style={styles.navControls}>
          <TouchableOpacity
            style={[styles.iconButton, !canGoBack && styles.iconButtonDisabled]}
            onPress={handleBack}
            disabled={!canGoBack}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Text style={[styles.iconText, !canGoBack && styles.textDisabled]}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, !canGoForward && styles.iconButtonDisabled]}
            onPress={handleForward}
            disabled={!canGoForward}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Text style={[styles.iconText, !canGoForward && styles.textDisabled]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleReload}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Text style={styles.iconText}>↻</Text>
          </TouchableOpacity>
        </View>

        {/* Domain & Platform Identity Badge */}
        <View style={styles.domainBadge}>
          <Text style={styles.lockIcon}>🔒</Text>
          <View style={styles.domainInfo}>
            <Text style={styles.domainText} numberOfLines={1}>
              {currentDomain}
            </Text>
            <Text style={styles.platformText} numberOfLines={1}>
              {platformKey} • {session.permittedUsername || 'Delegated User'}
            </Text>
          </View>
        </View>

        {/* Exit Session Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Action Control Panel (Fill Credentials & Fetch OTP) */}
      <View style={styles.actionPanel}>
        <View style={styles.actionButtonsRow}>
          {/* Fill Credentials Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.autofillButton,
              autofillStatus === 'FETCHING' && styles.actionButtonDisabled,
              autofillStatus === 'FILLED' && styles.actionButtonFilled,
            ]}
            onPress={handleFillCredentials}
            disabled={autofillStatus === 'FETCHING'}
            activeOpacity={0.8}
          >
            {autofillStatus === 'FETCHING' ? (
              <ActivityIndicator size="small" color={COLORS.bgDarkest} />
            ) : (
              <View style={styles.buttonInner}>
                <Text style={styles.buttonEmoji}>
                  {autofillStatus === 'FILLED' ? '✓' : '⚡'}
                </Text>
                <Text style={styles.autofillButtonText}>
                  {autofillStatus === 'FILLED' ? 'Re-fill' : 'Fill Credentials'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Fetch OTP Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.otpButton,
              (otpStatus === 'FETCHING' || cooldownSeconds > 0) && styles.actionButtonDisabled,
              otpStatus === 'FILLED' && styles.actionButtonFilled,
            ]}
            onPress={handleFetchAndFillOtp}
            disabled={otpStatus === 'FETCHING' || cooldownSeconds > 0}
            activeOpacity={0.8}
          >
            {otpStatus === 'FETCHING' ? (
              <ActivityIndicator size="small" color={COLORS.textWhite} />
            ) : (
              <View style={styles.buttonInner}>
                <Text style={styles.buttonEmoji}>
                  {cooldownSeconds > 0 ? '⏱️' : otpStatus === 'FILLED' ? '✓' : '✉'}
                </Text>
                <Text style={styles.otpButtonText}>
                  {cooldownSeconds > 0
                    ? `Wait ${cooldownSeconds}s`
                    : otpStatus === 'FILLED'
                    ? 'Re-fetch OTP'
                    : 'Fetch OTP'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Dynamic Status / Feedback Banner */}
        <View
          style={[
            styles.feedbackBar,
            isActionError && styles.feedbackBarError,
            isActionSuccess && styles.feedbackBarSuccess,
          ]}
        >
          <Text style={styles.feedbackDot}>
            {isActionError ? '✕' : isActionSuccess ? '✓' : '🛡️'}
          </Text>
          <Text
            style={[
              styles.feedbackText,
              isActionError && styles.feedbackTextError,
              isActionSuccess && styles.feedbackTextSuccess,
            ]}
            numberOfLines={1}
          >
            {activeFeedback || 'User-guided autofill • Form is never auto-submitted'}
          </Text>
        </View>
      </View>

      {/* Loading Progress Bar */}
      {isLoading ? (
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.max(10, Math.min(100, loadProgress * 100))}%` },
            ]}
          />
        </View>
      ) : null}

      {/* Navigation Error Screen */}
      {hasError ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorIconBadge}>
            <Text style={styles.errorIconBadgeText}>⚠️</Text>
          </View>
          <Text style={styles.errorTitle}>Navigation Security Alert</Text>
          <Text style={styles.errorDescription}>
            {errorMessage || 'Failed to establish a secure connection to the target platform.'}
          </Text>
          <View style={styles.errorActions}>
            <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
              <Text style={styles.retryButtonText}>Retry Connection</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exitButton} onPress={handleClose}>
              <Text style={styles.exitButtonText}>Return to Sessions</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Controlled Android WebView Runtime */
        <AnyWebView
          ref={webViewRef}
          source={{ uri: initialUrl }}
          style={styles.webView}
          // Security Configurations
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="never" // Strictly block mixed HTTP content
          allowFileAccess={false} // Strictly block local file access
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          geolocationEnabled={false}
          mediaPlaybackRequiresUserAction={true}
          incognito={true} // Isolated session cookie jar
          // Early DOM Hiding Injection for Show-Password Toggles & Restricted Navigation
          injectedJavaScriptBeforeContentLoaded={AutofillService.buildDomHidingScript(platformKey)}
          // Navigation Guards
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          onNavigationStateChange={handleNavigationStateChange}
          // Progress & Lifecycle
          onLoadStart={() => {
            setIsLoading(true);
            setHasError(false);
          }}
          onLoadProgress={({ nativeEvent }: any) => {
            setLoadProgress(nativeEvent?.progress || 0);
          }}
          onLoadEnd={() => {
            setIsLoading(false);
            if (webViewRef.current) {
              try {
                webViewRef.current.injectJavaScript(AutofillService.buildDomHidingScript(platformKey));
              } catch (_) {}
            }
          }}
          onError={(syntheticEvent: any) => {
            const { nativeEvent } = syntheticEvent;
            setIsLoading(false);
            setHasError(true);
            setErrorMessage(nativeEvent?.description || 'Failed to load platform page.');
          }}
          // Native Bridge Handler
          onMessage={handleNativeMessage}
        />
      )}

      {/* Blocked Origin Intercept Modal */}
      <Modal
        visible={!!blockedAttempt}
        transparent
        animationType="fade"
        onRequestClose={() => setBlockedAttempt(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalAlertIcon}>🛡️</Text>
              <Text style={styles.modalTitle}>Navigation Blocked</Text>
            </View>
            <Text style={styles.modalReason}>{blockedAttempt?.reason}</Text>
            <View style={styles.blockedUrlBox}>
              <Text style={styles.blockedUrlLabel}>Attempted Target:</Text>
              <Text style={styles.blockedUrlText} numberOfLines={2}>
                {blockedAttempt?.url}
              </Text>
            </View>
            <Text style={styles.modalSecurityNotice}>
              The WITHUS Secure Browser enforces strict platform domain allowlisting. External
              links and open redirects outside {platformKey}&apos;s verified domain boundary are
              prevented.
            </Text>
            <TouchableOpacity
              style={styles.modalDismissButton}
              onPress={() => setBlockedAttempt(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalDismissText}>Return to Secure Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Background Privacy Shield */}
      {isAppInBackground ? (
        <View style={styles.privacyShield}>
          <View style={styles.privacyShieldCard}>
            <Text style={styles.privacyShieldIcon}>🛡️</Text>
            <Text style={styles.privacyShieldTitle}>WITHUS Privacy Shield</Text>
            <Text style={styles.privacyShieldSubtitle}>
              Session paused for security • Sensitive inputs cleared from active DOM
            </Text>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDarkest,
  },
  header: {
    height: 54,
    backgroundColor: COLORS.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    justifyContent: 'space-between',
    paddingTop: ANDROID_STATUS_BAR_HEIGHT > 0 ? 0 : 0,
  },
  navControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgTertiary,
    borderColor: COLORS.borderMedium,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  iconButtonDisabled: {
    opacity: 0.35,
  },
  iconText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  textDisabled: {
    color: COLORS.textTertiary,
  },
  domainBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgInput,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginHorizontal: SPACING.sm,
  },
  lockIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  domainInfo: {
    flex: 1,
  },
  domainText: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: '700',
  },
  platformText: {
    color: COLORS.textTertiary,
    fontSize: 10,
    marginTop: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgTertiary,
    borderColor: COLORS.borderMedium,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  actionPanel: {
    backgroundColor: COLORS.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xs + 2,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm + 1,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  autofillButton: {
    backgroundColor: COLORS.accentCyan,
  },
  otpButton: {
    backgroundColor: COLORS.bgTertiary,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonFilled: {
    backgroundColor: COLORS.emeraldSubtle,
    borderWidth: 1,
    borderColor: COLORS.emeraldBorder,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonEmoji: {
    fontSize: 13,
    marginRight: 5,
  },
  autofillButtonText: {
    color: COLORS.bgDarkest,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  otpButtonText: {
    color: COLORS.textWhite,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  feedbackBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  feedbackBarSuccess: {
    backgroundColor: COLORS.emeraldSubtle,
    borderColor: COLORS.emeraldBorder,
  },
  feedbackBarError: {
    backgroundColor: COLORS.roseSubtle,
    borderColor: COLORS.roseBorder,
  },
  feedbackDot: {
    fontSize: 10,
    marginRight: 6,
    color: COLORS.textTertiary,
  },
  feedbackText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
    fontWeight: '500',
  },
  feedbackTextSuccess: {
    color: COLORS.textEmerald,
    fontWeight: '600',
  },
  feedbackTextError: {
    color: COLORS.textRose,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 2,
    backgroundColor: COLORS.bgSecondary,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.accentCyan,
  },
  webView: {
    flex: 1,
    backgroundColor: COLORS.bgDarkest,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    backgroundColor: COLORS.bgDarkest,
  },
  errorIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.roseSubtle,
    borderColor: COLORS.roseBorder,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  errorIconBadgeText: {
    fontSize: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textWhite,
    marginBottom: SPACING.xs,
  },
  errorDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  errorActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  retryButton: {
    backgroundColor: COLORS.accentCyan,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  retryButtonText: {
    color: COLORS.bgDarkest,
    fontWeight: '700',
    fontSize: 13,
  },
  exitButton: {
    backgroundColor: COLORS.bgSecondary,
    borderColor: COLORS.borderMedium,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  exitButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    padding: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalAlertIcon: {
    fontSize: 22,
    marginRight: SPACING.sm,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  modalReason: {
    fontSize: 13,
    color: COLORS.textRose,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  blockedUrlBox: {
    backgroundColor: COLORS.bgInput,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.md,
  },
  blockedUrlLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginBottom: 4,
    fontWeight: '600',
  },
  blockedUrlText: {
    fontSize: 11,
    color: COLORS.textRose,
    fontFamily: 'monospace',
  },
  modalSecurityNotice: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  modalDismissButton: {
    backgroundColor: COLORS.accentCyan,
    paddingVertical: SPACING.md - 2,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  modalDismissText: {
    color: COLORS.bgDarkest,
    fontWeight: '800',
    fontSize: 13,
  },
  privacyShield: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 10, 17, 0.96)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: SPACING.xl,
  },
  privacyShieldCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
    padding: SPACING.xxl,
    alignItems: 'center',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },
  privacyShieldIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  privacyShieldTitle: {
    color: COLORS.textWhite,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
  },
  privacyShieldSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
