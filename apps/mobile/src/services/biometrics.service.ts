/**
 * WITHUS Mobile Secure Browser PoC — Biometrics Service
 *
 * Evaluates and manages native biometric authentication via expo-local-authentication.
 * Security notice: Biometrics provide local device unlock for Keystore access.
 * Authorization enforcement remains strictly on the backend via JWT / Bearer tokens.
 */

import * as LocalAuthentication from 'expo-local-authentication';
import { BiometricStatus } from '../types/auth.types';

export class BiometricsService {
  /**
   * Check hardware support and enrollment for biometrics
   */
  static async checkStatus(): Promise<BiometricStatus> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometryType = 'None';
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometryType = 'Face Recognition';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometryType = 'Fingerprint';
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometryType = 'Iris';
      }

      return {
        isAvailable: hasHardware && isEnrolled,
        hasHardware,
        isEnrolled,
        biometryType,
      };
    } catch {
      return {
        isAvailable: false,
        hasHardware: false,
        isEnrolled: false,
        biometryType: 'Unavailable',
      };
    }
  }

  /**
   * Prompt the user for biometric authentication
   */
  static async authenticate(
    promptMessage: string = 'Authenticate to access WITHUS Secure Browser',
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const status = await this.checkStatus();
      if (!status.hasHardware) {
        return { success: false, error: 'Biometric hardware not available on this device' };
      }
      if (!status.isEnrolled) {
        return { success: false, error: 'No biometric credentials enrolled in system settings' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        return { success: true };
      }

      return {
        success: false,
        error: result.error ? `Biometric authentication failed: ${result.error}` : 'Authentication cancelled',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Biometric authentication encountered an error',
      };
    }
  }
}

