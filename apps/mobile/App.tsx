/**
 * WITHUS Mobile Secure Browser PoC — Main Application Shell
 *
 * Implements:
 * - Authentication State Lifecycle & Keystore Session Restoration
 * - Slide-out Enterprise Navigation Drawer
 * - Complete Sidebar Modules:
 *   1. Dashboard (Overview, metrics, quick actions)
 *   2. Vaults (Encrypted vaults & credential metadata)
 *   3. Sessions (Incoming delegated sessions & controlled browser launch)
 *   4. Activity (Live member telemetry & platform presence)
 *   5. Approvals (Access request governance, Approve/Reject)
 *   6. Audit Log (Immutable security ledger)
 *   7. Integrations (Connected platform states & health)
 *   8. Team (Organization member roster & roles)
 *   9. Settings (Profile, Keystore diagnostics & security posture)
 * - Controlled Secure WebView Browser Integration
 * - Android Back-Button Hierarchical Handling
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  Modal,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen } from './src/screens/LoginScreen';
import { SessionsDashboardScreen } from './src/screens/SessionsDashboardScreen';
import { SecureBrowserScreen } from './src/screens/SecureBrowserScreen';
import { DashboardOverviewScreen } from './src/screens/DashboardOverviewScreen';
import { VaultsScreen } from './src/screens/VaultsScreen';
import { ActivityScreen } from './src/screens/ActivityScreen';
import { ApprovalsScreen } from './src/screens/ApprovalsScreen';
import { AuditLogScreen } from './src/screens/AuditLogScreen';
import { IntegrationsScreen } from './src/screens/IntegrationsScreen';
import { TeamScreen } from './src/screens/TeamScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { NavigationDrawer } from './src/components/NavigationDrawer';
import { BottomNavBar } from './src/components/BottomNavBar';
import { SecureStorageService } from './src/services/storage.service';
import { ApiService } from './src/services/api.service';
import { UserProfile, Organization, DelegatedSession } from './src/types/auth.types';
import { NavigationModule } from './src/types/module.types';
import { COLORS, SPACING, RADIUS } from './src/theme/theme';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);

  // Navigation & Drawer State
  const [activeModule, setActiveModule] = useState<NavigationModule>('DASHBOARD');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showOrgSwitchModal, setShowOrgSwitchModal] = useState(false);

  // Badge Telemetry
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [activeSessionsCount, setActiveSessionsCount] = useState(0);

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
      const cachedOrgsList = await SecureStorageService.getAllOrganizations();

      if (cachedUser) {
        setCurrentUser(cachedUser);
        setCurrentOrg(cachedOrg);
        setAllOrganizations(cachedOrgsList || []);
        setIsAuthenticated(true);
        setIsInitializing(false); // Unblock splash screen instantly

        // Validate/refresh session in background asynchronously without blocking UI
        ApiService.refreshTokenSafely()
          .then(async () => {
            if (cachedOrg?.id) {
              refreshBadgeCounts(cachedOrg.id);
            }
          })
          .catch(async () => {
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
        const orgs = await ApiService.getUserOrganizations();
        setCurrentUser(profile);
        setAllOrganizations(orgs);
        const selected = cachedOrg || (orgs.length > 0 ? orgs[0] : null);
        setCurrentOrg(selected);
        setIsAuthenticated(true);
        if (selected?.id) {
          refreshBadgeCounts(selected.id);
        }
      } catch {
        await SecureStorageService.clearAllAuthData();
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsInitializing(false);
    }
  };

  const refreshBadgeCounts = useCallback(async (orgId: string) => {
    try {
      const [pendingRes, sessionsRes] = await Promise.allSettled([
        ApiService.getPendingApprovals(orgId),
        ApiService.getIncomingSessions(orgId),
      ]);

      if (pendingRes.status === 'fulfilled') {
        setPendingApprovalsCount(pendingRes.value.length);
      }
      if (sessionsRes.status === 'fulfilled') {
        const active = sessionsRes.value.filter((s) => s.status === 'ACTIVE');
        setActiveSessionsCount(active.length);
      }
    } catch {
      // Non-blocking telemetry
    }
  }, []);

  useEffect(() => {
    if (currentOrg?.id) {
      refreshBadgeCounts(currentOrg.id);
    }
  }, [currentOrg?.id, refreshBadgeCounts]);

  // Android Back Button Navigation Handling
  useEffect(() => {
    const handleBackPress = () => {
      if (activeSession) {
        setActiveSession(null);
        return true;
      }
      if (isDrawerOpen) {
        setIsDrawerOpen(false);
        return true;
      }
      if (showOrgSwitchModal) {
        setShowOrgSwitchModal(false);
        return true;
      }
      if (activeModule !== 'DASHBOARD') {
        setActiveModule('DASHBOARD');
        return true;
      }
      return false; // let OS handle back (exit app)
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [activeSession, isDrawerOpen, showOrgSwitchModal, activeModule]);

  const handleLoginSuccess = async (user: UserProfile, org: Organization | null) => {
    setCurrentUser(user);
    setCurrentOrg(org);
    setActiveModule('DASHBOARD');
    setIsAuthenticated(true);
    const orgs = await SecureStorageService.getAllOrganizations();
    setAllOrganizations(orgs);
    if (org?.id) {
      refreshBadgeCounts(org.id);
    }
  };

  const handleLogout = async () => {
    try {
      await ApiService.logout();
    } catch {
      // Non-blocking
    } finally {
      setCurrentUser(null);
      setCurrentOrg(null);
      setActiveSession(null);
      setActiveModule('DASHBOARD');
      setIsAuthenticated(false);
    }
  };

  const handleLaunchSession = (session: DelegatedSession) => {
    setActiveSession(session);
  };

  const handleCloseBrowser = () => {
    setActiveSession(null);
  };

  const handleSelectOrganization = async (selected: Organization) => {
    await SecureStorageService.setOrganization(selected);
    setCurrentOrg(selected);
    setShowOrgSwitchModal(false);
    refreshBadgeCounts(selected.id);
  };

  if (isInitializing) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" />
        <View style={styles.splashBrandCard}>
          <Text style={styles.splashIcon}>🛡️</Text>
          <ActivityIndicator size="large" color={COLORS.accentCyan} style={styles.splashSpinner} />
          <Text style={styles.splashText}>WITHUS</Text>
          <Text style={styles.splashTitle}>Secure Enterprise Client</Text>
          <Text style={styles.splashSubtext}>Verifying Keystore Session...</Text>
        </View>
      </View>
    );
  }

  // Active Screen Renderer based on activeModule
  const renderCurrentScreen = () => {
    if (!currentUser) return null;

    switch (activeModule) {
      case 'DASHBOARD':
        return (
          <DashboardOverviewScreen
            user={currentUser}
            organization={currentOrg}
            onNavigate={(mod) => setActiveModule(mod)}
            onLaunchSession={handleLaunchSession}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenOrgPicker={() => setShowOrgSwitchModal(true)}
            onLogout={handleLogout}
          />
        );

      case 'VAULTS':
        return (
          <VaultsScreen
            organization={currentOrg}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenOrgPicker={() => setShowOrgSwitchModal(true)}
          />
        );

      case 'SESSIONS':
        return (
          <SessionsDashboardScreen
            user={currentUser}
            organization={currentOrg}
            onSelectOrganization={handleSelectOrganization}
            onLaunchSession={handleLaunchSession}
            onLogout={handleLogout}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenOrgPicker={() => setShowOrgSwitchModal(true)}
          />
        );

      case 'ACTIVITY':
        return (
          <ActivityScreen
            organization={currentOrg}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenOrgPicker={() => setShowOrgSwitchModal(true)}
          />
        );

      case 'APPROVALS':
        return (
          <ApprovalsScreen
            user={currentUser}
            organization={currentOrg}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenOrgPicker={() => setShowOrgSwitchModal(true)}
          />
        );

      case 'AUDIT':
        return (
          <AuditLogScreen
            organization={currentOrg}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenOrgPicker={() => setShowOrgSwitchModal(true)}
          />
        );

      case 'INTEGRATIONS':
        return (
          <IntegrationsScreen
            organization={currentOrg}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenOrgPicker={() => setShowOrgSwitchModal(true)}
          />
        );

      case 'TEAM':
        return (
          <TeamScreen
            organization={currentOrg}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenOrgPicker={() => setShowOrgSwitchModal(true)}
          />
        );

      case 'SETTINGS':
        return (
          <SettingsScreen
            user={currentUser}
            organization={currentOrg}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenOrgPicker={() => setShowOrgSwitchModal(true)}
            onLogout={handleLogout}
          />
        );

      default:
        return (
          <DashboardOverviewScreen
            user={currentUser}
            organization={currentOrg}
            onNavigate={(mod) => setActiveModule(mod)}
            onLaunchSession={handleLaunchSession}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenOrgPicker={() => setShowOrgSwitchModal(true)}
          />
        );
    }
  };

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
          <View style={styles.appShell}>
            <View style={styles.screenWrapper}>
              {renderCurrentScreen()}
            </View>

            {/* Persistent Enterprise Bottom Navigation Bar */}
            <BottomNavBar
              activeModule={activeModule}
              pendingApprovalsCount={pendingApprovalsCount}
              onSelectModule={(mod) => {
                if (mod === 'MORE') {
                  setIsDrawerOpen(true);
                } else {
                  setActiveModule(mod);
                }
              }}
            />

            {/* Slide-out Navigation Drawer */}
            <NavigationDrawer
              isOpen={isDrawerOpen}
              activeModule={activeModule}
              user={currentUser}
              organization={currentOrg}
              pendingApprovalsCount={pendingApprovalsCount}
              activeSessionsCount={activeSessionsCount}
              onSelectModule={(mod) => setActiveModule(mod)}
              onOpenOrgPicker={() => setShowOrgSwitchModal(true)}
              onClose={() => setIsDrawerOpen(false)}
              onLogout={handleLogout}
            />

            {/* Global Workspace / Organization Switcher Modal */}
            <Modal
              visible={showOrgSwitchModal}
              transparent
              animationType="fade"
              onRequestClose={() => setShowOrgSwitchModal(false)}
            >
              <View style={styles.orgModalBackdrop}>
                <View style={styles.orgModalCard}>
                  <View style={styles.orgModalHeader}>
                    <Text style={styles.orgModalTitle}>Switch Workspace</Text>
                    <TouchableOpacity
                      onPress={() => setShowOrgSwitchModal(false)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.orgModalClose}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.orgModalSubtitle}>
                    Select an organization workspace to switch credential and session contexts:
                  </Text>

                  <View style={styles.orgList}>
                    {allOrganizations.map((org) => {
                      const isSelected = org.id === currentOrg?.id;
                      return (
                        <TouchableOpacity
                          key={org.id}
                          style={[
                            styles.orgOptionItem,
                            isSelected && styles.orgOptionItemSelected,
                          ]}
                          onPress={() => handleSelectOrganization(org)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.orgOptionLeft}>
                            <View
                              style={[
                                styles.orgOptionDot,
                                isSelected && styles.orgOptionDotSelected,
                              ]}
                            />
                            <View style={styles.orgOptionTextGroup}>
                              <Text
                                style={[
                                  styles.orgOptionName,
                                  isSelected && styles.orgOptionNameSelected,
                                ]}
                                numberOfLines={1}
                              >
                                {org.name}
                              </Text>
                              <Text style={styles.orgOptionRole}>
                                Role: {(org.role || 'MEMBER').toUpperCase()}
                              </Text>
                            </View>
                          </View>
                          {isSelected && (
                            <View style={styles.activePill}>
                              <Text style={styles.activePillText}>✓ ACTIVE</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            </Modal>
          </View>
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
  appShell: {
    flex: 1,
    backgroundColor: COLORS.bgDarkest,
  },
  screenWrapper: {
    flex: 1,
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
  orgModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  orgModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  orgModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  orgModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textWhite,
  },
  orgModalClose: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    padding: SPACING.xs,
  },
  orgModalSubtitle: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginBottom: SPACING.lg,
    lineHeight: 16,
  },
  orgList: {
    gap: SPACING.sm,
  },
  orgOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  orgOptionItemSelected: {
    backgroundColor: COLORS.cyanSubtle,
    borderColor: COLORS.cyanBorder,
  },
  orgOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orgOptionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.borderHighlight,
    marginRight: SPACING.md,
  },
  orgOptionDotSelected: {
    backgroundColor: COLORS.accentCyan,
  },
  orgOptionTextGroup: {
    flex: 1,
  },
  orgOptionName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  orgOptionNameSelected: {
    color: COLORS.textWhite,
  },
  orgOptionRole: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  activePill: {
    backgroundColor: COLORS.cyanBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textCyan,
  },
});
