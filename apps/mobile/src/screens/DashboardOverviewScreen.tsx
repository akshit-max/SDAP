/**
 * WITHUS Mobile — Dashboard Overview Screen
 * Displays organization summary metrics, all sidebar modules directory,
 * active delegated sessions, and hardware security posture.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { UserProfile, Organization, DelegatedSession } from '../types/auth.types';
import { NavigationModule } from '../types/module.types';
import { ApiService } from '../services/api.service';
import { AppHeader } from '../components/AppHeader';
import { PlatformBadge } from '../components/PlatformBadge';
import { StatusBadge } from '../components/StatusBadge';
import { COLORS, SPACING, RADIUS } from '../theme/theme';

interface DashboardOverviewScreenProps {
  user: UserProfile;
  organization: Organization | null;
  onNavigate: (module: NavigationModule) => void;
  onLaunchSession: (session: DelegatedSession) => void;
  onOpenDrawer: () => void;
  onOpenOrgPicker: () => void;
  onLogout?: () => void;
}

export const DashboardOverviewScreen: React.FC<DashboardOverviewScreenProps> = ({
  user,
  organization,
  onNavigate,
  onLaunchSession,
  onOpenDrawer,
  onOpenOrgPicker,
  onLogout,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [vaultCount, setVaultCount] = useState<number>(0);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [recentSessions, setRecentSessions] = useState<DelegatedSession[]>([]);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirmLogout = () => {
    if (!onLogout) return;
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your WITHUS workspace session? You will need to authenticate again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: onLogout },
      ],
    );
  };

  const fetchDashboardData = useCallback(async () => {
    if (!organization?.id) {
      setIsLoading(false);
      return;
    }

    setErrorMessage(null);
    try {
      const [vaultsRes, pendingRes, sessionsRes, membersRes] = await Promise.allSettled([
        ApiService.getVaults(organization.id, 1, 10),
        ApiService.getPendingApprovals(organization.id),
        ApiService.getIncomingSessions(organization.id),
        ApiService.getMembers(organization.id),
      ]);

      if (vaultsRes.status === 'fulfilled') {
        setVaultCount(vaultsRes.value.total || 0);
      }
      if (pendingRes.status === 'fulfilled') {
        const pending = pendingRes.value || [];
        setPendingApprovalsCount(pending.length);
      }
      if (sessionsRes.status === 'fulfilled') {
        const sessions = sessionsRes.value || [];
        setRecentSessions(sessions);
      }
      if (membersRes.status === 'fulfilled') {
        const members = membersRes.value || [];
        setMemberCount(members.length);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to refresh dashboard');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const activeSessions = recentSessions.filter((s) => s.status === 'ACTIVE');

  return (
    <View style={styles.container}>
      <AppHeader
        title="Dashboard"
        subtitle="WORKSPACE OVERVIEW"
        organization={organization}
        onOpenDrawer={onOpenDrawer}
        onOpenOrgPicker={onOpenOrgPicker}
        onLogout={onLogout ? handleConfirmLogout : undefined}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accentCyan}
            colors={[COLORS.accentCyan]}
          />
        }
      >
        {/* Welcome Greeting Banner */}
        <View style={styles.greetingCard}>
          <Text style={styles.greetingSubtext}>
            WORKSPACE: {organization?.name?.toUpperCase() || 'WITHUS'}
          </Text>
          <Text style={styles.greetingTitle}>
            {getGreeting()}, {user.fullName || user.email.split('@')[0]} 👋
          </Text>
          <Text style={styles.greetingDescription}>
            Manage your credentials, vaults, and live delegated access sessions with zero raw exposure.
          </Text>

          {/* Quick Action Buttons */}
          <View style={styles.quickActionButtons}>
            <TouchableOpacity
              style={styles.btnActionPrimary}
              onPress={() => onNavigate('VAULTS')}
              activeOpacity={0.8}
            >
              <Text style={styles.btnActionPrimaryIcon}>＋</Text>
              <Text style={styles.btnActionPrimaryText}>New Vault</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnActionSecondary}
              onPress={() => onNavigate('SESSIONS')}
              activeOpacity={0.8}
            >
              <Text style={styles.btnActionSecondaryIcon}>⚡</Text>
              <Text style={styles.btnActionSecondaryText}>Sessions</Text>
            </TouchableOpacity>

            {onLogout && (
              <TouchableOpacity
                style={styles.btnActionLogout}
                onPress={handleConfirmLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.btnActionLogoutIcon}>🚪</Text>
                <Text style={styles.btnActionLogoutText}>Sign Out</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Metric Cards Grid */}
        <View style={styles.metricsGrid}>
          {/* Vaults Card */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => onNavigate('VAULTS')}
            activeOpacity={0.8}
          >
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconBox, { backgroundColor: COLORS.cyanSubtle }]}>
                <Text style={styles.metricEmoji}>🔐</Text>
              </View>
              <View style={styles.metricBadge}>
                <Text style={styles.metricBadgeText}>PROTECTED</Text>
              </View>
            </View>
            <Text style={styles.metricValue}>{isLoading ? '-' : vaultCount}</Text>
            <Text style={styles.metricLabel}>Secure Vaults</Text>
            <Text style={styles.metricSubtext}>
              {vaultCount === 1 ? '1 active vault' : `${vaultCount} active vaults`}
            </Text>
          </TouchableOpacity>

          {/* Active Sessions Card */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => onNavigate('SESSIONS')}
            activeOpacity={0.8}
          >
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconBox, { backgroundColor: COLORS.emeraldSubtle }]}>
                <Text style={styles.metricEmoji}>🛡️</Text>
              </View>
              <View
                style={[
                  styles.metricBadge,
                  activeSessions.length > 0 && styles.metricBadgeLive,
                ]}
              >
                <Text
                  style={[
                    styles.metricBadgeText,
                    activeSessions.length > 0 && styles.metricBadgeLiveText,
                  ]}
                >
                  {activeSessions.length > 0 ? 'LIVE' : 'IDLE'}
                </Text>
              </View>
            </View>
            <Text style={styles.metricValue}>{isLoading ? '-' : activeSessions.length}</Text>
            <Text style={styles.metricLabel}>Active Sessions</Text>
            <Text style={styles.metricSubtext}>
              {activeSessions.length > 0
                ? `${activeSessions.length} active sessions`
                : 'No active sessions'}
            </Text>
          </TouchableOpacity>

          {/* Pending Approvals Card */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => onNavigate('APPROVALS')}
            activeOpacity={0.8}
          >
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconBox, { backgroundColor: COLORS.amberSubtle }]}>
                <Text style={styles.metricEmoji}>📋</Text>
              </View>
              {pendingApprovalsCount > 0 ? (
                <View style={styles.metricBadgeAlert}>
                  <Text style={styles.metricBadgeAlertText}>ATTENTION</Text>
                </View>
              ) : (
                <View style={styles.metricBadge}>
                  <Text style={styles.metricBadgeText}>RESOLVED</Text>
                </View>
              )}
            </View>
            <Text style={styles.metricValue}>{isLoading ? '-' : pendingApprovalsCount}</Text>
            <Text style={styles.metricLabel}>Pending Approvals</Text>
            <Text style={styles.metricSubtext}>
              {pendingApprovalsCount > 0 ? 'Requires attention' : 'All requests resolved'}
            </Text>
          </TouchableOpacity>

          {/* Team Members Card */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => onNavigate('TEAM')}
            activeOpacity={0.8}
          >
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconBox, { backgroundColor: COLORS.purpleSubtle }]}>
                <Text style={styles.metricEmoji}>👥</Text>
              </View>
              <View style={styles.metricBadge}>
                <Text style={styles.metricBadgeText}>ORG</Text>
              </View>
            </View>
            <Text style={styles.metricValue}>{isLoading ? '-' : memberCount}</Text>
            <Text style={styles.metricLabel}>Team Members</Text>
            <Text style={styles.metricSubtext}>
              {memberCount === 1 ? '1 member' : `${memberCount} members`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Complete Sidebar Modules Directory */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>WORKSPACE MODULES & SERVICES</Text>

          {/* 1. Workspace Group */}
          <View style={styles.moduleCategory}>
            <Text style={styles.categoryTitle}>WORKSPACE</Text>
            <View style={styles.moduleList}>
              <TouchableOpacity
                style={styles.moduleCard}
                onPress={() => onNavigate('VAULTS')}
                activeOpacity={0.8}
              >
                <View style={[styles.moduleIconBox, { backgroundColor: COLORS.cyanSubtle }]}>
                  <Text style={styles.moduleIcon}>🔐</Text>
                </View>
                <View style={styles.moduleMeta}>
                  <View style={styles.moduleTitleRow}>
                    <Text style={styles.moduleName}>Vaults</Text>
                    <View style={styles.modulePill}>
                      <Text style={styles.modulePillText}>{vaultCount} active</Text>
                    </View>
                  </View>
                  <Text style={styles.moduleDesc}>Encrypted credential storage & password secrets</Text>
                </View>
                <Text style={styles.chevronIcon}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.moduleCard}
                onPress={() => onNavigate('SESSIONS')}
                activeOpacity={0.8}
              >
                <View style={[styles.moduleIconBox, { backgroundColor: COLORS.emeraldSubtle }]}>
                  <Text style={styles.moduleIcon}>🛡️</Text>
                </View>
                <View style={styles.moduleMeta}>
                  <View style={styles.moduleTitleRow}>
                    <Text style={styles.moduleName}>Sessions</Text>
                    <View style={[styles.modulePill, activeSessions.length > 0 && styles.modulePillGreen]}>
                      <Text style={[styles.modulePillText, activeSessions.length > 0 && styles.modulePillGreenText]}>
                        {activeSessions.length} live
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.moduleDesc}>Delegated access & controlled browser</Text>
                </View>
                <Text style={styles.chevronIcon}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.moduleCard}
                onPress={() => onNavigate('ACTIVITY')}
                activeOpacity={0.8}
              >
                <View style={[styles.moduleIconBox, { backgroundColor: COLORS.purpleSubtle }]}>
                  <Text style={styles.moduleIcon}>⚡</Text>
                </View>
                <View style={styles.moduleMeta}>
                  <View style={styles.moduleTitleRow}>
                    <Text style={styles.moduleName}>Activity</Text>
                    <View style={styles.modulePill}>
                      <Text style={styles.modulePillText}>Telemetry</Text>
                    </View>
                  </View>
                  <Text style={styles.moduleDesc}>Live team presence & login event history</Text>
                </View>
                <Text style={styles.chevronIcon}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.moduleCard}
                onPress={() => onNavigate('APPROVALS')}
                activeOpacity={0.8}
              >
                <View style={[styles.moduleIconBox, { backgroundColor: COLORS.amberSubtle }]}>
                  <Text style={styles.moduleIcon}>📋</Text>
                </View>
                <View style={styles.moduleMeta}>
                  <View style={styles.moduleTitleRow}>
                    <Text style={styles.moduleName}>Approvals</Text>
                    {pendingApprovalsCount > 0 ? (
                      <View style={[styles.modulePill, styles.modulePillAmber]}>
                        <Text style={[styles.modulePillText, styles.modulePillAmberText]}>
                          {pendingApprovalsCount} pending
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.modulePill}>
                        <Text style={styles.modulePillText}>Resolved</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.moduleDesc}>Access request governance & approvals</Text>
                </View>
                <Text style={styles.chevronIcon}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. Platform & Security Group */}
          <View style={styles.moduleCategory}>
            <Text style={styles.categoryTitle}>PLATFORM & SECURITY</Text>
            <View style={styles.moduleList}>
              <TouchableOpacity
                style={styles.moduleCard}
                onPress={() => onNavigate('INTEGRATIONS')}
                activeOpacity={0.8}
              >
                <View style={[styles.moduleIconBox, { backgroundColor: COLORS.cyanSubtle }]}>
                  <Text style={styles.moduleIcon}>🔌</Text>
                </View>
                <View style={styles.moduleMeta}>
                  <View style={styles.moduleTitleRow}>
                    <Text style={styles.moduleName}>Integrations</Text>
                    <View style={styles.modulePill}>
                      <Text style={styles.modulePillText}>12 Platforms</Text>
                    </View>
                  </View>
                  <Text style={styles.moduleDesc}>GitHub, Vercel, Shopify, Stripe, MCA, GST...</Text>
                </View>
                <Text style={styles.chevronIcon}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.moduleCard}
                onPress={() => onNavigate('AUDIT')}
                activeOpacity={0.8}
              >
                <View style={[styles.moduleIconBox, { backgroundColor: 'rgba(142, 142, 147, 0.15)' }]}>
                  <Text style={styles.moduleIcon}>📜</Text>
                </View>
                <View style={styles.moduleMeta}>
                  <View style={styles.moduleTitleRow}>
                    <Text style={styles.moduleName}>Audit Log</Text>
                    <View style={styles.modulePill}>
                      <Text style={styles.modulePillText}>Immutable</Text>
                    </View>
                  </View>
                  <Text style={styles.moduleDesc}>Tamper-evident security ledger & event audit</Text>
                </View>
                <Text style={styles.chevronIcon}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. Organization Group */}
          <View style={styles.moduleCategory}>
            <Text style={styles.categoryTitle}>ORGANIZATION</Text>
            <View style={styles.moduleList}>
              <TouchableOpacity
                style={styles.moduleCard}
                onPress={() => onNavigate('TEAM')}
                activeOpacity={0.8}
              >
                <View style={[styles.moduleIconBox, { backgroundColor: COLORS.purpleSubtle }]}>
                  <Text style={styles.moduleIcon}>👥</Text>
                </View>
                <View style={styles.moduleMeta}>
                  <View style={styles.moduleTitleRow}>
                    <Text style={styles.moduleName}>Team</Text>
                    <View style={styles.modulePill}>
                      <Text style={styles.modulePillText}>{memberCount} members</Text>
                    </View>
                  </View>
                  <Text style={styles.moduleDesc}>Organization member roster & roles</Text>
                </View>
                <Text style={styles.chevronIcon}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.moduleCard}
                onPress={() => onNavigate('SETTINGS')}
                activeOpacity={0.8}
              >
                <View style={[styles.moduleIconBox, { backgroundColor: COLORS.cyanSubtle }]}>
                  <Text style={styles.moduleIcon}>⚙️</Text>
                </View>
                <View style={styles.moduleMeta}>
                  <View style={styles.moduleTitleRow}>
                    <Text style={styles.moduleName}>Settings</Text>
                    <View style={[styles.modulePill, styles.modulePillGreen]}>
                      <Text style={[styles.modulePillText, styles.modulePillGreenText]}>Enforced</Text>
                    </View>
                  </View>
                  <Text style={styles.moduleDesc}>Hardware Keystore, FLAG_SECURE & profile</Text>
                </View>
                <Text style={styles.chevronIcon}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Recent Delegated Sessions Section */}
        {recentSessions.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>RECENT DELEGATED SESSIONS</Text>
              <TouchableOpacity onPress={() => onNavigate('SESSIONS')}>
                <Text style={styles.seeAllText}>View All →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sessionsList}>
              {recentSessions.slice(0, 3).map((session) => {
                const isActive = session.status === 'ACTIVE';
                const platformKey = (
                  session.platform ||
                  session.integrationProvider ||
                  session.platformId ||
                  session.resourceName ||
                  'UNKNOWN'
                ).toUpperCase();

                return (
                  <View key={session.id} style={styles.sessionCard}>
                    <View style={styles.sessionCardHeader}>
                      <View style={styles.sessionCardLeft}>
                        <PlatformBadge platform={platformKey} size="small" />
                        <View style={styles.sessionTitleGroup}>
                          <Text style={styles.sessionPlatformName}>{platformKey}</Text>
                          <Text style={styles.sessionPermittedUser} numberOfLines={1}>
                            {session.permittedUsername || 'Default User'}
                          </Text>
                        </View>
                      </View>
                      <StatusBadge status={session.status} size="small" />
                    </View>

                    {isActive && (
                      <TouchableOpacity
                        style={styles.quickLaunchButton}
                        onPress={() => onLaunchSession(session)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.quickLaunchText}>⚡ Launch Secure Browser</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Security Summary Banner */}
        <View style={styles.securityBanner}>
          <View style={styles.securityBannerIcon}>
            <Text style={styles.securityShieldEmoji}>🛡️</Text>
          </View>
          <View style={styles.securityBannerText}>
            <Text style={styles.securityBannerTitle}>Hardware Keystore Protection</Text>
            <Text style={styles.securityBannerSub}>
              Mobile runtime is strictly guarded by Android Keystore, FLAG_SECURE screen shielding, and credential isolation.
            </Text>
          </View>
        </View>

        {/* User Account & Session Sign Out Card */}
        {onLogout && (
          <View style={styles.accountCard}>
            <View style={styles.accountCardRow}>
              <View style={styles.accountAvatar}>
                <Text style={styles.accountAvatarText}>
                  {(user.fullName || user.email || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.accountDetails}>
                <Text style={styles.accountName}>{user.fullName || 'Enterprise Operator'}</Text>
                <Text style={styles.accountEmail}>{user.email}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.btnLogoutDashboard}
              onPress={handleConfirmLogout}
              activeOpacity={0.8}
            >
              <Text style={styles.btnLogoutDashboardIcon}>🚪</Text>
              <Text style={styles.btnLogoutDashboardText}>Sign Out of WITHUS</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDarkest,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  greetingCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.lg,
  },
  greetingSubtext: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textWhite,
    letterSpacing: -0.3,
  },
  greetingDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    lineHeight: 18,
  },
  quickActionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  btnActionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentCyan,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  btnActionPrimaryIcon: {
    fontSize: 14,
    color: COLORS.textWhite,
    fontWeight: 'bold',
    marginRight: 4,
  },
  btnActionPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  btnActionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgTertiary,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  btnActionSecondaryIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  btnActionSecondaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
  btnActionLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  btnActionLogoutIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  btnActionLogoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF453A',
  },
  accountCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginTop: SPACING.lg,
  },
  accountCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accentCyan,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  accountAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textWhite,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  accountEmail: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  btnLogoutDashboard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
  },
  btnLogoutDashboardIcon: {
    fontSize: 15,
    marginRight: SPACING.xs,
  },
  btnLogoutDashboardText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF453A',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  metricCard: {
    width: '47.5%',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricEmoji: {
    fontSize: 14,
  },
  metricBadge: {
    backgroundColor: COLORS.bgTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  metricBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
  },
  metricBadgeLive: {
    backgroundColor: COLORS.emeraldSubtle,
    borderColor: COLORS.emeraldBorder,
    borderWidth: 1,
  },
  metricBadgeLiveText: {
    color: COLORS.textEmerald,
  },
  metricBadgeAlert: {
    backgroundColor: COLORS.amberSubtle,
    borderColor: COLORS.amberBorder,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  metricBadgeAlertText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textAmber,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textWhite,
    letterSpacing: -0.5,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textWhite,
    marginTop: 2,
  },
  metricSubtext: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionContainer: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  seeAllText: {
    fontSize: 12,
    color: COLORS.textCyan,
    fontWeight: '600',
  },
  moduleCategory: {
    marginBottom: SPACING.lg,
  },
  categoryTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs + 2,
    paddingLeft: 2,
  },
  moduleList: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    overflow: 'hidden',
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  moduleIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  moduleIcon: {
    fontSize: 18,
  },
  moduleMeta: {
    flex: 1,
  },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: SPACING.xs,
  },
  moduleName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  modulePill: {
    backgroundColor: COLORS.bgTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  modulePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modulePillGreen: {
    backgroundColor: COLORS.emeraldSubtle,
  },
  modulePillGreenText: {
    color: COLORS.textEmerald,
    fontWeight: '700',
  },
  modulePillAmber: {
    backgroundColor: COLORS.amberSubtle,
  },
  modulePillAmberText: {
    color: COLORS.textAmber,
    fontWeight: '700',
  },
  moduleDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chevronIcon: {
    fontSize: 20,
    color: COLORS.textTertiary,
    marginLeft: SPACING.xs,
  },
  sessionsList: {
    gap: SPACING.sm,
  },
  sessionCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sessionTitleGroup: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  sessionPlatformName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  sessionPermittedUser: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  quickLaunchButton: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.accentCyan,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.xs + 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLaunchText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginTop: SPACING.xs,
  },
  securityBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.cyanSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  securityShieldEmoji: {
    fontSize: 18,
  },
  securityBannerText: {
    flex: 1,
  },
  securityBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  securityBannerSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 14,
  },
});
