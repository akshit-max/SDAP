/**
 * WITHUS Mobile Secure Browser — Login Screen (Polished UI/UX)
 *
 * Implements:
 * - Email & Password authentication via POST /api/v1/auth/login
 * - Keystore token persistence
 * - Biometric quick-unlock when valid refresh token is stored
 * - Server URL configuration modal with testing presets
 * - Polished enterprise security theme, responsive layout, and input focus states
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { ApiService, ApiError } from '../services/api.service.ts';
import { SecureStorageService, DEFAULT_API_BASE_URL } from '../services/storage.service.ts';
import { BiometricsService } from '../services/biometrics.service.ts';
import { UserProfile, Organization, BiometricStatus } from '../types/auth.types.ts';
import { FeedbackBanner } from '../components/FeedbackBanner.tsx';
import { COLORS, SPACING, RADIUS, ANDROID_STATUS_BAR_HEIGHT } from '../theme/theme.ts';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile, org: Organization | null) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);

  // Biometrics & saved session state
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);

  // Server URL Configuration state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_BASE_URL);

  useEffect(() => {
    checkInitialState();
  }, []);

  const checkInitialState = async () => {
    try {
      const savedUrl = await SecureStorageService.getApiBaseUrl();
      setApiUrl(savedUrl);

      const saved = await SecureStorageService.hasSavedSession();
      setHasSavedSession(saved);

      const bio = await BiometricsService.checkStatus();
      setBiometricStatus(bio);
    } catch {
      // Non-blocking initialization check
    }
  };

  const handleLogin = async () => {
    setErrorMessage(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await ApiService.login(trimmedEmail, password);
      onLoginSuccess(response.user, response.organization);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err.message || 'An unexpected error occurred during login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricUnlock = async () => {
    setErrorMessage(null);
    setIsBiometricLoading(true);
    try {
      const result = await BiometricsService.authenticate(
        'Unlock WITHUS Secure Browser with biometrics',
      );
      if (!result.success) {
        if (result.error) setErrorMessage(result.error);
        return;
      }

      // Biometrics succeeded: refresh token safely through API
      await ApiService.refreshTokenSafely();
      const user = await SecureStorageService.getUserProfile();
      const org = await SecureStorageService.getOrganization();

      if (user) {
        onLoginSuccess(user, org);
      } else {
        const me = await ApiService.getCurrentUser();
        onLoginSuccess(me, org);
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Biometric unlock failed. Please sign in with your password.',
      );
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const handleSaveApiUrl = async (urlToSave: string = apiUrl) => {
    try {
      await SecureStorageService.setApiBaseUrl(urlToSave.trim());
      setApiUrl(urlToSave.trim());
      setShowSettingsModal(false);
    } catch {
      setErrorMessage('Failed to save API endpoint setting');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>🛡️ SECURE DELEGATION</Text>
          </View>
          <Text style={styles.logoTitle}>WITHUS</Text>
          <Text style={styles.subtitle}>Mobile Secure Browser</Text>
          <View style={styles.securityPill}>
            <Text style={styles.securityPillDot}>•</Text>
            <Text style={styles.securityPillText}>Android Keystore Protected</Text>
          </View>
        </View>

        {/* Error Feedback Banner */}
        {errorMessage ? (
          <View style={styles.errorWrapper}>
            <FeedbackBanner
              type="error"
              message={errorMessage}
              onDismiss={() => setErrorMessage(null)}
            />
          </View>
        ) : null}

        {/* Credentials Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSubtitle}>
            Authenticate with your authorized WITHUS credentials
          </Text>

          {/* Email input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedInput === 'email' && styles.inputWrapperFocused,
              ]}
            >
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="name@enterprise.com"
                placeholderTextColor={COLORS.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          {/* Password input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedInput === 'password' && styles.inputWrapperFocused,
              ]}
            >
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter account password"
                placeholderTextColor={COLORS.textTertiary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🔒'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Primary Submit Button */}
          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.bgDarkest} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In to Workspace</Text>
            )}
          </TouchableOpacity>

          {/* Biometric Quick-Unlock Button */}
          {hasSavedSession && biometricStatus?.isAvailable ? (
            <TouchableOpacity
              style={[styles.biometricButton, isBiometricLoading && styles.buttonDisabled]}
              onPress={handleBiometricUnlock}
              disabled={isBiometricLoading}
              activeOpacity={0.8}
            >
              {isBiometricLoading ? (
                <ActivityIndicator color={COLORS.accentCyan} size="small" />
              ) : (
                <View style={styles.biometricContent}>
                  <Text style={styles.biometricIcon}>👆</Text>
                  <Text style={styles.biometricButtonText}>
                    Unlock with {biometricStatus.biometryType || 'Biometrics'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Footer / Server Configuration Drawer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.settingsPill}
            onPress={() => setShowSettingsModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.settingsPillIcon}>⚙️</Text>
            <Text style={styles.settingsPillText} numberOfLines={1}>
              API: {apiUrl.replace('http://', '').replace('/api/v1', '')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Settings Modal */}
        <Modal
          visible={showSettingsModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSettingsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Backend API Endpoint</Text>
                <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDescription}>
                Select a preset or enter the active WITHUS backend URL.
              </Text>

              {/* Presets */}
              <View style={styles.presetsContainer}>
                <TouchableOpacity
                  style={styles.presetButton}
                  onPress={() => handleSaveApiUrl('http://10.0.2.2:4000/api/v1')}
                >
                  <Text style={styles.presetTitle}>Emulator Loopback</Text>
                  <Text style={styles.presetUrl}>http://10.0.2.2:4000/api/v1</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.presetButton}
                  onPress={() => handleSaveApiUrl('http://localhost:4000/api/v1')}
                >
                  <Text style={styles.presetTitle}>USB ADB Reverse</Text>
                  <Text style={styles.presetUrl}>http://localhost:4000/api/v1</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Custom Endpoint URL</Text>
                <TextInput
                  style={styles.modalInput}
                  value={apiUrl}
                  onChangeText={setApiUrl}
                  placeholder="http://192.168.1.X:4000/api/v1"
                  placeholderTextColor={COLORS.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowSettingsModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={() => handleSaveApiUrl()}
                >
                  <Text style={styles.modalSaveText}>Save Endpoint</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDarkest,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: ANDROID_STATUS_BAR_HEIGHT + SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  badgeContainer: {
    backgroundColor: COLORS.cyanSubtle,
    borderColor: COLORS.cyanBorder,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
  },
  badgeText: {
    color: COLORS.textCyan,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  logoTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.textWhite,
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  securityPillDot: {
    color: COLORS.accentEmerald,
    fontSize: 14,
    marginRight: 4,
  },
  securityPillText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  errorWrapper: {
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textWhite,
    marginBottom: SPACING.xs,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs + 2,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapperFocused: {
    borderColor: COLORS.borderFocus,
    backgroundColor: COLORS.bgElevated,
  },
  input: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md - 1,
    color: COLORS.textWhite,
    fontSize: 14,
  },
  passwordInput: {
    paddingRight: SPACING.xl + SPACING.md,
  },
  eyeButton: {
    position: 'absolute',
    right: SPACING.md,
    padding: SPACING.xs,
  },
  eyeIcon: {
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: COLORS.accentCyan,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: COLORS.bgDarkest,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  biometricButton: {
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    backgroundColor: COLORS.bgTertiary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    minHeight: 46,
  },
  biometricContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  biometricIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  biometricButtonText: {
    color: COLORS.textCyan,
    fontWeight: '600',
    fontSize: 13,
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  settingsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    borderColor: COLORS.borderSubtle,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  settingsPillIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  settingsPillText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  modalCloseText: {
    color: COLORS.textTertiary,
    fontSize: 18,
    fontWeight: '600',
    padding: SPACING.xs,
  },
  modalDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  presetsContainer: {
    marginBottom: SPACING.lg,
  },
  presetButton: {
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.xs + 2,
  },
  presetTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textCyan,
  },
  presetUrl: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  modalInput: {
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    color: COLORS.textWhite,
    fontSize: 13,
    fontFamily: 'monospace',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.lg,
  },
  modalCancelButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    marginRight: SPACING.sm,
    justifyContent: 'center',
  },
  modalCancelText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  modalSaveButton: {
    backgroundColor: COLORS.accentCyan,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
  },
  modalSaveText: {
    color: COLORS.bgDarkest,
    fontSize: 13,
    fontWeight: '700',
  },
});
