/**
 * WITHUS Mobile Secure Browser PoC — Secure Token Storage Service
 *
 * Backed strictly by Android Keystore via expo-secure-store.
 * NEVER uses AsyncStorage or unencrypted storage for tokens.
 */

import * as SecureStore from 'expo-secure-store';
import { UserProfile, Organization } from '../types/auth.types';

const KEYS = {
  ACCESS_TOKEN: 'withus_access_token',
  REFRESH_TOKEN: 'withus_refresh_token',
  USER_PROFILE: 'withus_user_profile',
  ORGANIZATION: 'withus_organization',
  ALL_ORGANIZATIONS: 'withus_all_organizations',
  API_BASE_URL: 'withus_api_base_url',
  BIOMETRIC_ENABLED: 'withus_biometric_enabled',
} as const;

// Default API URL: Android emulator loopback to host port 4000
export const DEFAULT_API_BASE_URL = 'http://10.0.2.2:4000/api/v1';

export class SecureStorageService {
  /**
   * Save Access Token into Android Keystore-backed storage
   */
  static async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
  }

  /**
   * Retrieve Access Token from Android Keystore-backed storage
   */
  static async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  }

  /**
   * Save Refresh Token into Android Keystore-backed storage
   */
  static async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
  }

  /**
   * Retrieve Refresh Token from Android Keystore-backed storage
   */
  static async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  }

  /**
   * Save authenticated user profile
   */
  static async setUserProfile(user: UserProfile): Promise<void> {
    await SecureStore.setItemAsync(KEYS.USER_PROFILE, JSON.stringify(user));
  }

  /**
   * Retrieve stored user profile
   */
  static async getUserProfile(): Promise<UserProfile | null> {
    const raw = await SecureStore.getItemAsync(KEYS.USER_PROFILE);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  }

  /**
   * Save user's active organization
   */
  static async setOrganization(org: Organization): Promise<void> {
    await SecureStore.setItemAsync(KEYS.ORGANIZATION, JSON.stringify(org));
  }

  /**
   * Retrieve stored active organization
   */
  static async getOrganization(): Promise<Organization | null> {
    const raw = await SecureStore.getItemAsync(KEYS.ORGANIZATION);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Organization;
    } catch {
      return null;
    }
  }

  /**
   * Save all user organizations
   */
  static async setAllOrganizations(orgs: Organization[]): Promise<void> {
    await SecureStore.setItemAsync(KEYS.ALL_ORGANIZATIONS, JSON.stringify(orgs));
  }

  /**
   * Retrieve all stored user organizations
   */
  static async getAllOrganizations(): Promise<Organization[]> {
    const raw = await SecureStore.getItemAsync(KEYS.ALL_ORGANIZATIONS);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Organization[];
    } catch {
      return [];
    }
  }

  /**
   * Configure custom API Base URL (e.g. for testing against local dev server, LAN IP, or staging)
   */
  static async setApiBaseUrl(url: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.API_BASE_URL, url);
  }

  /**
   * Retrieve configured API Base URL
   */
  static async getApiBaseUrl(): Promise<string> {
    const saved = await SecureStore.getItemAsync(KEYS.API_BASE_URL);
    return saved && saved.trim().length > 0 ? saved.trim() : DEFAULT_API_BASE_URL;
  }

  /**
   * Set biometric unlock preference
   */
  static async setBiometricEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(KEYS.BIOMETRIC_ENABLED, enabled ? 'true' : 'false');
  }

  /**
   * Check if biometric unlock is enabled
   */
  static async isBiometricEnabled(): Promise<boolean> {
    const val = await SecureStore.getItemAsync(KEYS.BIOMETRIC_ENABLED);
    return val === 'true';
  }

  /**
   * Check if an active or renewable session exists in secure storage
   */
  static async hasSavedSession(): Promise<boolean> {
    const refreshToken = await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
    return !!refreshToken;
  }

  /**
   * Wipe all credentials and sensitive session data on logout or auth failure
   */
  static async clearAllAuthData(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(KEYS.USER_PROFILE),
      SecureStore.deleteItemAsync(KEYS.ORGANIZATION),
      SecureStore.deleteItemAsync(KEYS.ALL_ORGANIZATIONS),
    ]);
  }
}
