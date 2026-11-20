/**
 * WITHUS Mobile — Dashboard Overview Screen
 * Displays organization summary metrics, quick actions, active session status,
 * and pending approval highlights.
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
}

export const DashboardOverviewScreen: React.FC<DashboardOverviewScreenProps> = ({
  user,
  organization,
  onNavigate,
  onLaunchSession,
  onOpenDrawer,
  onOpenOrgPicker,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [vaultCount, setVaultCount] = useState<number>(0);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [recentSessions, setRecentSessions] = useState<DelegatedSession[]>([]);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!organization?.id) {
      setIsLoading(false);
      return;
    }

    setErrorMessage(null);
    try {
      // Parallel fetch for non-blocking aggregated dashboard metrics
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
          <Text style={styles.greetingSubtext}>WORKSPACE: {organization?.name || 'WithUs'}</Text>
          <Text style={styles.greetingTitle}>
            {getGreeting()}, {user.fullName || user.email.split('@')[0]} 👋
          </Text>
          <Text style={styles.greetingDescription}>
            Manage your credentials, vaults, and live delegated access sessions with zero raw exposure.
          </Text>
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

        {/* Quick Actions Bar */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>QUICK NAVIGATION</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => onNavigate('SESSIONS')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionChipIcon}>⚡</Text>
              <Text style={styles.actionChipText}>Launch Sessions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => onNavigate('VAULTS')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionChipIcon}>🔐</Text>
              <Text style={styles.actionChipText}>Credential Vaults</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => onNavigate('APPROVALS')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionChipIcon}>📋</Text>
              <Text style={styles.actionChipText}>Review Approvals</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Delegated Sessions Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>DELEGATED SESSIONS</Text>
            <TouchableOpacity onPress={() => onNavigate('SESSIONS')}>
              <Text style={styles.seeAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={COLORS.accentCyan} />
              <Text style={styles.loadingText}>Loading sessions...</Text>
            </View>
          ) : recentSessions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🛡️</Text>
              <Text style={styles.emptyTitle}>No Delegated Sessions</Text>
              <Text style={styles.emptyText}>
                No sessions have been granted to your account in this organization yet.
              </Text>
            </View>
          ) : (
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
          )}
        </View>

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
    backgroundColor: COLORS.bgPrimary,
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
    letterSpacing: 0.2,
  },
  greetingDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs + 2,
    lineHeight: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricEmoji: {
    fontSize: 16,
  },
  metricBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgTertiary,
  },
  metricBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
  },
  metricBadgeLive: {
    backgroundColor: COLORS.emeraldSubtle,
    borderWidth: 1,
    borderColor: COLORS.emeraldBorder,
  },
  metricBadgeLiveText: {
    color: COLORS.textEmerald,
  },
  metricBadgeAlert: {
    backgroundColor: COLORS.amberSubtle,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  metricBadgeAlertText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textAmber,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.textWhite,
    letterSpacing: 0.5,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  metricSubtext: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  sectionContainer: {
    marginBottom: SPACING.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accentCyan,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionChip: {
    flex: 1,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionChipIcon: {
    fontSize: 18,
    marginBottom: SPACING.xs,
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  loadingBox: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
  },
  emptyBox: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 18,
  },
  sessionsList: {
    gap: SPACING.sm,
  },
  sessionCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  quickLaunchButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.cyanSubtle,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  quickLaunchText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textCyan,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
    marginTop: SPACING.sm,
  },
  securityBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
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
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  securityBannerSub: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 2,
    lineHeight: 14,
  },
});

