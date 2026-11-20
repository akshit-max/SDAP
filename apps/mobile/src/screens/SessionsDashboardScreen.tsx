/**
 * WITHUS Mobile Secure Browser — Delegated Sessions Dashboard (Polished UI/UX)
 *
 * Implements:
 * - Explicit Organization Selection & Workspace Switching
 * - Incoming delegated session listing (GET /api/v1/organizations/:orgId/sessions/incoming)
 * - Launching controlled Phase 3-5 Secure Browser runtime
 * - Platform badges, permitted username identifier, status, and expiry
 * - Polished enterprise cards, pull-to-refresh, empty states, and modal switcher
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Modal,
} from 'react-native';
import { ApiService, ApiError } from '../services/api.service.ts';
import { SecureStorageService } from '../services/storage.service.ts';
import { UserProfile, Organization, DelegatedSession } from '../types/auth.types.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { PlatformBadge } from '../components/PlatformBadge.tsx';
import { FeedbackBanner } from '../components/FeedbackBanner.tsx';
import { COLORS, SPACING, RADIUS, ANDROID_STATUS_BAR_HEIGHT } from '../theme/theme.ts';

interface SessionsDashboardScreenProps {
  user: UserProfile;
  organization: Organization | null;
  onSelectOrganization: (org: Organization) => void;
  onLaunchSession: (session: DelegatedSession) => void;
  onLogout: () => void;
  onOpenDrawer?: () => void;
}

export const SessionsDashboardScreen: React.FC<SessionsDashboardScreenProps> = ({
  user,
  organization,
  onSelectOrganization,
  onLaunchSession,
  onLogout,
  onOpenDrawer,
}) => {
  const [sessions, setSessions] = useState<DelegatedSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Organization Switching State
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [showOrgSwitchModal, setShowOrgSwitchModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    loadOrganizationsList();
  }, []);

  const loadOrganizationsList = async () => {
    try {
      const orgs = await SecureStorageService.getAllOrganizations();
      setAllOrganizations(orgs);
    } catch {
      // Non-blocking
    }
  };

  const fetchSessions = useCallback(async () => {
    if (!organization || !organization.id) {
      setErrorMessage(
        'No organization workspace selected. Please select an organization.',
      );
      setIsLoading(false);
      return;
    }

    setErrorMessage(null);
    try {
      const data = await ApiService.getIncomingSessions(organization.id);
      setSessions(data || []);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err.message || 'Failed to load incoming delegated sessions');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [organization]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchSessions();
  };

  const handleSelectOrg = async (selected: Organization) => {
    await SecureStorageService.setOrganization(selected);
    onSelectOrganization(selected);
    setShowOrgSwitchModal(false);
    setIsLoading(true);
  };

  const handleLogout = async () => {
    try {
      await ApiService.logout();
    } catch {
      // Non-blocking logout failure
    } finally {
      setShowLogoutConfirm(false);
      onLogout();
    }
  };

  const formatExpiry = (isoDate: string) => {
    try {
      const exp = new Date(isoDate);
      const now = new Date();
      const diffMs = exp.getTime() - now.getTime();
      if (diffMs <= 0) return { text: 'Expired', isUrgent: true };
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return { text: `${days}d ${hours % 24}h remaining`, isUrgent: false };
      }
      return { text: `${hours}h ${minutes}m remaining`, isUrgent: hours < 4 };
    } catch {
      return { text: isoDate, isUrgent: false };
    }
  };

  const renderSessionItem = ({ item }: { item: DelegatedSession }) => {
    const isActive = item.status === 'ACTIVE';
    const expiry = formatExpiry(item.expiresAt);
    const platformKey = (
      item.platform ||
      item.integrationProvider ||
      item.platformId ||
      item.resourceName ||
      'General Platform'
    ).toUpperCase();

    return (
      <View style={styles.sessionCard}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.platformRow}>
            <PlatformBadge platform={platformKey} size="medium" />
            <View style={styles.platformMeta}>
              <Text style={styles.platformName}>
                {platformKey}
              </Text>
              <View style={styles.permittedUserPill}>
                <Text style={styles.permittedUserLabel}>ID:</Text>
                <Text style={styles.permittedUserText} numberOfLines={1}>
                  {item.permittedUsername || 'Default Grantee'}
                </Text>
              </View>
            </View>
          </View>
          <StatusBadge status={item.status} size="small" />
        </View>

        {/* Card Metadata Chips */}
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Text style={styles.metaIcon}>⏱️</Text>
            <Text
              style={[
                styles.expiryText,
                expiry.isUrgent && styles.expiryTextUrgent,
              ]}
            >
              {expiry.text}
            </Text>
          </View>

          {item.secretName ? (
            <View style={styles.secretChip}>
              <Text style={styles.metaIcon}>🔐</Text>
              <Text style={styles.secretTag} numberOfLines={1}>
                {item.secretName}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Capabilities Chips */}
        {item.capabilities && item.capabilities.length > 0 ? (
          <View style={styles.capabilitiesContainer}>
            {item.capabilities.map((cap, idx) => (
              <View key={idx} style={styles.capabilityBadge}>
                <Text style={styles.capabilityText}>{cap}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Launch Secure Browser Button */}
        <TouchableOpacity
          style={[styles.launchButton, !isActive && styles.launchButtonDisabled]}
          onPress={() => onLaunchSession(item)}
          disabled={!isActive}
          activeOpacity={0.8}
        >
          <Text style={styles.launchButtonIcon}>{isActive ? '⚡' : '🔒'}</Text>
          <Text style={styles.launchButtonText}>
            {isActive ? 'Launch Secure Browser' : `Session ${item.status}`}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const activeCount = sessions.filter((s) => s.status === 'ACTIVE').length;

  return (
    <View style={styles.container}>
      {/* Top Application Bar */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          {onOpenDrawer ? (
            <TouchableOpacity
              style={styles.drawerTriggerButton}
              onPress={onOpenDrawer}
              accessibilityLabel="Open Navigation Menu"
              activeOpacity={0.7}
            >
              <Text style={styles.drawerTriggerIcon}>☰</Text>
            </TouchableOpacity>
          ) : null}

          {/* Brand & User Avatar */}
          <View style={styles.userSection}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {(user.fullName || user.email || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.userNameText}>{user.fullName || 'WITHUS Operator'}</Text>
              <Text style={styles.userEmailText} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => setShowLogoutConfirm(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Workspace / Organization Switcher Pill */}
        <TouchableOpacity
          style={styles.orgSwitchButton}
          onPress={() => setShowOrgSwitchModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.orgSwitchLeft}>
            <Text style={styles.orgIcon}>🏢</Text>
            <Text style={styles.orgLabel}>Workspace:</Text>
            <Text style={styles.orgText} numberOfLines={1}>
              {organization?.name || 'Select Workspace'}
            </Text>
          </View>
          {allOrganizations.length > 1 ? (
            <View style={styles.orgCountBadge}>
              <Text style={styles.orgCountText}>▾ {allOrganizations.length}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* Main Body */}
      <View style={styles.body}>
        {/* Title Bar with Count & Refresh */}
        <View style={styles.titleRow}>
          <View style={styles.titleGroup}>
            <Text style={styles.sectionTitle}>Delegated Sessions</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{activeCount} Active</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            disabled={isLoading || isRefreshing}
            activeOpacity={0.7}
          >
            <Text style={styles.refreshIcon}>↻</Text>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Error Feedback */}
        {errorMessage ? (
          <View style={styles.errorWrapper}>
            <FeedbackBanner
              type="error"
              message={errorMessage}
              onDismiss={() => setErrorMessage(null)}
            />
          </View>
        ) : null}

        {/* Loading State */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.accentCyan} />
            <Text style={styles.loadingTitle}>Connecting to Vault...</Text>
            <Text style={styles.loadingSubtitle}>
              Retrieving incoming session authorizations
            </Text>
          </View>
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            renderItem={renderSessionItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.accentCyan}
                colors={[COLORS.accentCyan]}
              />
            }
            ListEmptyComponent={
              !errorMessage ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconContainer}>
                    <Text style={styles.emptyIcon}>🛡️</Text>
                  </View>
                  <Text style={styles.emptyTitle}>No Active Sessions</Text>
                  <Text style={styles.emptyDescription}>
                    There are currently no delegated sessions assigned to you for &quot;
                    {organization?.name || 'this workspace'}&quot;. When an administrator grants
                    you access, sessions will appear here automatically.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyActionButton}
                    onPress={onRefresh}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.emptyActionText}>Check for Incoming Sessions</Text>
                  </TouchableOpacity>
                </View>
              ) : undefined
            }
          />
        )}
      </View>

      {/* Organization Switcher Modal */}
      <Modal
        visible={showOrgSwitchModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOrgSwitchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Workspace</Text>
                <Text style={styles.modalSubtitle}>
                  Switch between organizations you belong to
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowOrgSwitchModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.orgList}>
              {allOrganizations.map((org) => {
                const isSelected = org.id === organization?.id;
                return (
                  <TouchableOpacity
                    key={org.id}
                    style={[
                      styles.orgOption,
                      isSelected && styles.orgOptionSelected,
                    ]}
                    onPress={() => handleSelectOrg(org)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.orgOptionContent}>
                      <View
                        style={[
                          styles.orgOptionIcon,
                          isSelected && styles.orgOptionIconSelected,
                        ]}
                      >
                        <Text style={styles.orgOptionIconText}>🏢</Text>
                      </View>
                      <View style={styles.orgOptionTextGroup}>
                        <Text
                          style={[
                            styles.orgOptionName,
                            isSelected && styles.orgOptionNameSelected,
                          ]}
                        >
                          {org.name}
                        </Text>
                        <Text style={styles.orgOptionSlug}>
                          Role: {org.role || 'Member'}
                        </Text>
                      </View>
                    </View>
                    {isSelected ? (
                      <View style={styles.selectedCheckBadge}>
                        <Text style={styles.selectedCheckText}>✓ Active</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Dialog */}
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalDescription}>
              Are you sure you want to sign out? This will clear all cached tokens from the
              device Keystore.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDangerButton}
                onPress={handleLogout}
              >
                <Text style={styles.modalDangerText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDarkest,
  },
  header: {
    backgroundColor: COLORS.bgSecondary,
    paddingTop: ANDROID_STATUS_BAR_HEIGHT + SPACING.sm,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  drawerTriggerButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgTertiary,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 2,
  },
  drawerTriggerIcon: {
    fontSize: 18,
    color: COLORS.textWhite,
    fontWeight: 'bold',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cyanSubtle,
    borderColor: COLORS.cyanBorder,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 2,
  },
  userAvatarText: {
    color: COLORS.textCyan,
    fontWeight: '800',
    fontSize: 15,
  },
  userNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  userEmailText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  logoutButton: {
    backgroundColor: COLORS.bgTertiary,
    borderColor: COLORS.borderMedium,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.md,
  },
  logoutButtonText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  orgSwitchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgInput,
    borderColor: COLORS.borderSubtle,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  orgSwitchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orgIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  orgLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginRight: 6,
    fontWeight: '600',
  },
  orgText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textCyan,
    flex: 1,
  },
  orgCountBadge: {
    backgroundColor: COLORS.cyanSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  orgCountText: {
    color: COLORS.textCyan,
    fontSize: 10,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textWhite,
    marginRight: SPACING.sm,
  },
  countBadge: {
    backgroundColor: COLORS.emeraldSubtle,
    borderColor: COLORS.emeraldBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textEmerald,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 2,
  },
  refreshIcon: {
    fontSize: 14,
    color: COLORS.textCyan,
    marginRight: 4,
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textCyan,
  },
  errorWrapper: {
    marginBottom: SPACING.md,
  },
  listContent: {
    paddingBottom: SPACING.xxxl,
  },
  sessionCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  platformMeta: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  platformName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  permittedUserPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  permittedUserLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '600',
    marginRight: 4,
  },
  permittedUserText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgInput,
    borderColor: COLORS.borderSubtle,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  metaIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  expiryText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  expiryTextUrgent: {
    color: COLORS.textAmber,
    fontWeight: '700',
  },
  secretChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgInput,
    borderColor: COLORS.borderSubtle,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    maxWidth: '50%',
  },
  secretTag: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  capabilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  capabilityBadge: {
    backgroundColor: COLORS.bgTertiary,
    borderColor: COLORS.borderMedium,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  capabilityText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  launchButton: {
    backgroundColor: COLORS.accentCyan,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md - 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  launchButtonDisabled: {
    backgroundColor: COLORS.bgTertiary,
    opacity: 0.6,
  },
  launchButtonIcon: {
    fontSize: 14,
    marginRight: SPACING.xs + 2,
  },
  launchButtonText: {
    color: COLORS.bgDarkest,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  loadingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textWhite,
    marginTop: SPACING.md,
  },
  loadingSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.cyanSubtle,
    borderColor: COLORS.cyanBorder,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textWhite,
    marginBottom: SPACING.xs,
  },
  emptyDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.xl,
  },
  emptyActionButton: {
    backgroundColor: COLORS.bgSecondary,
    borderColor: COLORS.borderMedium,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md - 2,
    borderRadius: RADIUS.md,
  },
  emptyActionText: {
    color: COLORS.textCyan,
    fontSize: 13,
    fontWeight: '700',
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
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalCloseText: {
    color: COLORS.textTertiary,
    fontSize: 18,
    fontWeight: '600',
    padding: SPACING.xs,
  },
  modalDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  orgList: {
    gap: SPACING.sm,
  },
  orgOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgInput,
    borderColor: COLORS.borderSubtle,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  orgOptionSelected: {
    borderColor: COLORS.borderFocus,
    backgroundColor: COLORS.bgElevated,
  },
  orgOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orgOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  orgOptionIconSelected: {
    backgroundColor: COLORS.cyanSubtle,
  },
  orgOptionIconText: {
    fontSize: 14,
  },
  orgOptionTextGroup: {
    flex: 1,
  },
  orgOptionName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
  orgOptionNameSelected: {
    color: COLORS.textCyan,
    fontWeight: '700',
  },
  orgOptionSlug: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  selectedCheckBadge: {
    backgroundColor: COLORS.cyanSubtle,
    borderColor: COLORS.cyanBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  selectedCheckText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textCyan,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  modalCancelButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  modalCancelText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  modalDangerButton: {
    backgroundColor: COLORS.accentRose,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  modalDangerText: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
});
