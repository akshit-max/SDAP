/**
 * WITHUS Mobile Secure Browser PoC — Main Application Shell
 *
 * Phase 3 Implementation:
 * - Authentication State Lifecycle & Keystore Session Restoration
 * - Explicit Organization Selection
 * - Controlled Secure WebView Browser Integration
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen } from './src/screens/LoginScreen';
import { SessionsDashboardScreen } from './src/screens/SessionsDashboardScreen';
import { SecureBrowserScreen } from './src/screens/SecureBrowserScreen';
import { SecureStorageService } from './src/services/storage.service';
import { ApiService } from './src/services/api.service';
import { UserProfile, Organization, DelegatedSession } from './src/types/auth.types';
import { COLORS, SPACING, RADIUS } from './src/theme/theme';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);

  // Phase 3 Active Secure Browser Session State
  const [activeSession, setActiveSession] = useState<DelegatedSession | null>(null);

  useEffect(() => {
    restoreSessionFromKeystore();
  }, []);

  const restoreSessionFromKeystore = async () => {
    try {
      const hasSession = await SecureStorageService.hasSavedSession();
      if (!hasSession) {
        setIsInitializing(false);
        return;
      }

      // Fast-path: Instant restoration from local Keystore cache (under 15ms)
      const cachedUser = await SecureStorageService.getUserProfile();
      const cachedOrg = await SecureStorageService.getOrganization();

      if (cachedUser) {
        setCurrentUser(cachedUser);
        setCurrentOrg(cachedOrg);
        setIsAuthenticated(true);
        setIsInitializing(false); // Unblock splash screen instantly

        // Validate/refresh session in background asynchronously without blocking UI
        ApiService.refreshTokenSafely().catch(async () => {
          // If refresh token is expired or revoked: clear and prompt login
          await SecureStorageService.clearAllAuthData();
          setCurrentUser(null);
          setCurrentOrg(null);
          setIsAuthenticated(false);
        });
        return;
      }

      // Fallback path if profile was not cached
      try {
        await ApiService.refreshTokenSafely();
        const profile = await ApiService.getCurrentUser();
        setCurrentUser(profile);
        setCurrentOrg(cachedOrg);
        setIsAuthenticated(true);
      } catch {
        // Stored refresh token is expired or revoked: clear and prompt login
        await SecureStorageService.clearAllAuthData();
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleLoginSuccess = (user: UserProfile, org: Organization | null) => {
    setCurrentUser(user);
    setCurrentOrg(org);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentOrg(null);
    setActiveSession(null);
    setIsAuthenticated(false);
  };

  const handleLaunchSession = (session: DelegatedSession) => {
    setActiveSession(session);
  };

  const handleCloseBrowser = () => {
    setActiveSession(null);
  };

  if (isInitializing) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" />
        <View style={styles.splashBrandCard}>
          <Text style={styles.splashIcon}>🛡️</Text>
          <ActivityIndicator size="large" color={COLORS.accentCyan} style={styles.splashSpinner} />
          <Text style={styles.splashText}>WITHUS</Text>
          <Text style={styles.splashTitle}>Secure Browser</Text>
          <Text style={styles.splashSubtext}>Verifying Keystore Session...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {isAuthenticated && currentUser ? (
        activeSession ? (
          <SecureBrowserScreen
            session={activeSession}
            onClose={handleCloseBrowser}
          />
        ) : (
          <SessionsDashboardScreen
            user={currentUser}
            organization={currentOrg}
            onSelectOrganization={setCurrentOrg}
            onLaunchSession={handleLaunchSession}
            onLogout={handleLogout}
          />
        )
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDarkest,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: COLORS.bgDarkest,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  splashBrandCard: {
    alignItems: 'center',
  },
  splashIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  splashSpinner: {
    marginBottom: SPACING.md,
  },
  splashText: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.textWhite,
    letterSpacing: 2,
  },
  splashTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  splashSubtext: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: SPACING.lg,
  },
});
