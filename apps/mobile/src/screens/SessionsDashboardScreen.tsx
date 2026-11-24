/**
 * WITHUS Mobile Secure Browser — Delegated Sessions Dashboard
 * Structured, responsive enterprise management matching WITHUS web application
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Modal,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { ApiService, ApiError } from '../services/api.service.ts';
import { UserProfile, Organization, DelegatedSession } from '../types/auth.types.ts';
import { VaultResponse, SecretMetadata, OrganizationMember } from '../types/module.types.ts';
import { AppHeader } from '../components/AppHeader.tsx';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { PlatformBadge } from '../components/PlatformBadge.tsx';
import { FeedbackBanner } from '../components/FeedbackBanner.tsx';
import { COLORS, SPACING, RADIUS } from '../theme/theme.ts';

interface SessionsDashboardScreenProps {
  user: UserProfile;
  organization: Organization | null;
  onSelectOrganization: (org: Organization) => void;
  onLaunchSession: (session: DelegatedSession) => void;
  onLogout: () => void;
  onOpenDrawer?: () => void;
  onOpenOrgPicker?: () => void;
}

export const SessionsDashboardScreen: React.FC<SessionsDashboardScreenProps> = ({
  user,
  organization,
  onLaunchSession,
  onLogout,
  onOpenDrawer = () => {},
  onOpenOrgPicker = () => {},
}) => {
  const [sessionTab, setSessionTab] = useState<'INCOMING' | 'OUTGOING'>('INCOMING');
  const [incomingSessions, setIncomingSessions] = useState<DelegatedSession[]>([]);
  const [outgoingSessions, setOutgoingSessions] = useState<DelegatedSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Grant Access Modal State
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [vaults, setVaults] = useState<VaultResponse[]>([]);
  const [vaultSecrets, setVaultSecrets] = useState<SecretMetadata[]>([]);
  const [selectedGranteeId, setSelectedGranteeId] = useState('');
  const [selectedVaultId, setSelectedVaultId] = useState('');
  const [selectedSecretId, setSelectedSecretId] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('GITHUB');
  const [selectedHours, setSelectedHours] = useState('24');
  const [grantJustification, setGrantJustification] = useState('');
  const [isSubmittingGrant, setIsSubmittingGrant] = useState(false);
  const [isLoadingSecretsForGrant, setIsLoadingSecretsForGrant] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!organization?.id) {
      setErrorMessage('No organization workspace selected. Please select a workspace.');
      setIsLoading(false);
      return;
    }

    setErrorMessage(null);
    try {
      const [incoming, outgoing] = await Promise.all([
        ApiService.getIncomingSessions(organization.id).catch(() => []),
        ApiService.getOutgoingSessions(organization.id).catch(() => []),
      ]);
      setIncomingSessions(incoming || []);
      setOutgoingSessions(outgoing || []);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err.message || 'Failed to load delegated sessions');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchSessions();
  };

  const handleRevokeSession = (sessionId: string) => {
    if (!organization?.id) return;
    Alert.alert(
      'Revoke Delegated Session',
      'Are you sure you want to terminate this delegated session immediately? The grantee will lose access instantly.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke Access',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.revokeSession(organization.id, sessionId);
              setSuccessBanner('Session revoked successfully.');
              fetchSessions();
            } catch (err: any) {
              setErrorMessage(err.message || 'Failed to revoke session.');
            }
          },
        },
      ],
    );
  };

  const handleOpenGrantModal = async () => {
    if (!organization?.id) return;
    setShowGrantModal(true);
    try {
      const [membersData, vaultsData] = await Promise.all([
        ApiService.getMembers(organization.id).catch(() => []),
        ApiService.getVaults(organization.id, 1, 50).catch(() => ({ items: [], total: 0 })),
      ]);
      setMembers(membersData || []);
      setVaults(vaultsData.items || []);
      if (membersData?.length > 0) setSelectedGranteeId(membersData[0].userId || membersData[0].id);
      if (vaultsData.items?.length > 0) {
        const vId = vaultsData.items[0].id;
        setSelectedVaultId(vId);
        handleSelectVaultForGrant(vId);
      }
    } catch {
      // Non-blocking
    }
  };

  const handleSelectVaultForGrant = async (vId: string) => {
    if (!organization?.id) return;
    setSelectedVaultId(vId);
    setIsLoadingSecretsForGrant(true);
    try {
      const secrets = await ApiService.getVaultSecrets(organization.id, vId);
      setVaultSecrets(secrets || []);
      if (secrets?.length > 0) setSelectedSecretId(secrets[0].id);
    } catch {
      setVaultSecrets([]);
    } finally {
      setIsLoadingSecretsForGrant(false);
    }
  };

  const handleGrantSession = async () => {
    if (!organization?.id || !selectedGranteeId || !selectedSecretId || isSubmittingGrant) {
      Alert.alert('Incomplete Form', 'Please select a grantee member, vault, and credential secret.');
      return;
    }
    setIsSubmittingGrant(true);

    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + Number(selectedHours || 24));

      await ApiService.createSession(organization.id, {
        granteeId: selectedGranteeId,
        scope: 'SECRET',
        resourceId: selectedSecretId,
        permission: 'EXTENSION',
        integrationProvider: selectedPlatform.toUpperCase(),
        expiresAt: expiresAt.toISOString(),
        justification: grantJustification.trim() || undefined,
      });

      setShowGrantModal(false);
      setGrantJustification('');
      setSuccessBanner('Delegated session granted successfully.');
      fetchSessions();
    } catch (err: any) {
      Alert.alert('Grant Failed', err.message || 'Failed to create delegated session.');
    } finally {
      setIsSubmittingGrant(false);
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
        return { text: `Expires in ${days}d ${hours % 24}h`, isUrgent: false };
      }
      return { text: `Expires in ${hours}h ${minutes}m`, isUrgent: hours < 4 };
    } catch {
      return { text: isoDate, isUrgent: false };
    }
  };

  // Filtered sessions based on active tab and search query
  const rawSessions = sessionTab === 'INCOMING' ? incomingSessions : outgoingSessions;
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return rawSessions;
    const q = searchQuery.toLowerCase().trim();
    return rawSessions.filter((s) => {
      const p = (s.platform || s.integrationProvider || s.platformId || '').toLowerCase();
      const u = (s.permittedUsername || '').toLowerCase();
      const sec = (s.secretName || '').toLowerCase();
      return p.includes(q) || u.includes(q) || sec.includes(q);
    });
  }, [rawSessions, searchQuery]);

  const activeCount = rawSessions.filter((s) => s.status === 'ACTIVE').length;

  const renderSessionCard = ({ item }: { item: DelegatedSession }) => {
    const isActive = item.status === 'ACTIVE';
    const expiry = formatExpiry(item.expiresAt);
    const platformKey = (
      item.platform ||
      item.integrationProvider ||
      item.platformId ||
      item.resourceName ||
      'GENERAL'
    ).toUpperCase();

    return (
      <View style={styles.sessionCard}>
        {/* Card Header: Platform + Title + Status */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <PlatformBadge platform={platformKey} size="medium" />
            <View style={styles.platformMeta}>
              <Text style={styles.platformName}>{platformKey}</Text>
              <Text style={styles.permittedUserText} numberOfLines={1}>
                {item.permittedUsername ? `Grantee: ${item.permittedUsername}` : 'Delegated Operator'}
              </Text>
            </View>
          </View>
          <View style={styles.cardHeaderRight}>
            <StatusBadge status={item.status} size="small" />
            {sessionTab === 'INCOMING' && isActive && (
              <TouchableOpacity
                style={styles.miniRevokeBtn}
                onPress={() => handleRevokeSession(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
                accessibilityLabel="Revoke Session"
              >
                <Text style={styles.miniRevokeText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Metadata Chips: Expiry, Vault, Security */}
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Text style={styles.metaIcon}>⏱️</Text>
            <Text style={[styles.metaText, expiry.isUrgent && styles.metaTextUrgent]}>
              {expiry.text}
            </Text>
          </View>

          {item.secretName ? (
            <View style={styles.metaChip}>
              <Text style={styles.metaIcon}>🔑</Text>
              <Text style={styles.metaText} numberOfLines={1}>
                {item.secretName}
              </Text>
            </View>
          ) : null}

          <View style={styles.metaChip}>
            <Text style={styles.metaIcon}>🛡️</Text>
            <Text style={styles.metaText}>Isolated Autofill</Text>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionRow}>
          {sessionTab === 'INCOMING' ? (
            <TouchableOpacity
              style={[
                styles.launchButton,
                !isActive && styles.launchButtonDisabled,
              ]}
              onPress={() => onLaunchSession(item)}
              disabled={!isActive}
              activeOpacity={0.8}
            >
              <Text style={styles.launchButtonIcon}>{isActive ? '⚡' : '🔒'}</Text>
              <Text
                style={styles.launchButtonText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {isActive ? 'Launch Secure Browser' : `Session ${item.status}`}
              </Text>
            </TouchableOpacity>
          ) : (
            isActive && (
              <TouchableOpacity
                style={styles.revokeButtonFull}
                onPress={() => handleRevokeSession(item.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.revokeButtonText}>🚫 Revoke Session Access</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Sessions"
        subtitle="TEMPORARY ALLOCATIONS"
        organization={organization}
        onOpenDrawer={onOpenDrawer}
        onOpenOrgPicker={onOpenOrgPicker}
      />

      <View style={styles.body}>
        {/* Banner matching WITHUS Web */}
        <View style={styles.headerBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerCaption}>LIVE CREDENTIAL ALLOCATIONS</Text>
            <Text style={styles.bannerTitle}>Delegated Sessions</Text>
            <Text style={styles.bannerSubtitle}>
              Manage time-bound credential sessions with instant kill-switch revocation.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.grantAccessBtn}
            onPress={handleOpenGrantModal}
            activeOpacity={0.8}
          >
            <Text style={styles.grantAccessBtnIcon}>＋</Text>
            <Text style={styles.grantAccessBtnText}>Grant Access</Text>
          </TouchableOpacity>
        </View>

        {/* Apple Segmented Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabSegment, sessionTab === 'INCOMING' && styles.tabSegmentActive]}
            onPress={() => setSessionTab('INCOMING')}
            activeOpacity={0.8}
          >
            <Text style={styles.tabIcon}>🛡️</Text>
            <Text style={[styles.tabLabel, sessionTab === 'INCOMING' && styles.tabLabelActive]}>
              My Access ({incomingSessions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabSegment, sessionTab === 'OUTGOING' && styles.tabSegmentActive]}
            onPress={() => setSessionTab('OUTGOING')}
            activeOpacity={0.8}
          >
            <Text style={styles.tabIcon}>👥</Text>
            <Text style={[styles.tabLabel, sessionTab === 'OUTGOING' && styles.tabLabelActive]}>
              Team Grants ({outgoingSessions.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by platform or username..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.clearSearchIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Success Banner */}
        {successBanner ? (
          <View style={{ marginBottom: SPACING.md }}>
            <FeedbackBanner
              type="success"
              message={successBanner}
              onDismiss={() => setSuccessBanner(null)}
            />
          </View>
        ) : null}

        {/* Error Feedback */}
        {errorMessage ? (
          <View style={{ marginBottom: SPACING.md }}>
            <FeedbackBanner
              type="error"
              message={errorMessage}
              onDismiss={() => setErrorMessage(null)}
            />
          </View>
        ) : null}

        {/* Loading State */}
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.accentCyan} />
            <Text style={styles.loadingTitle}>Connecting to Secure Vault...</Text>
            <Text style={styles.loadingSubtitle}>Retrieving delegated session authorizations</Text>
          </View>
        ) : (
          <FlatList
            data={filteredSessions}
            keyExtractor={(item) => item.id}
            renderItem={renderSessionCard}
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
                  <View style={styles.emptyIconBox}>
                    <Text style={styles.emptyEmoji}>🛡️</Text>
                  </View>
                  <Text style={styles.emptyTitle}>
                    {searchQuery
                      ? 'No Matching Sessions'
                      : sessionTab === 'INCOMING'
                      ? 'No Incoming Delegated Sessions'
                      : 'No Outgoing Session Grants'}
                  </Text>
                  <Text style={styles.emptyDescription}>
                    {searchQuery
                      ? `No sessions found matching "${searchQuery}".`
                      : sessionTab === 'INCOMING'
                      ? `There are currently no delegated sessions assigned to you for "${organization?.name || 'this workspace'}". Sessions will appear automatically when access is granted.`
                      : `You have not granted delegated access to any team members in "${organization?.name || 'this workspace'}". Tap "+ Grant Access" above to delegate credentials without exposing plaintext.`}
                  </Text>

                  {sessionTab === 'OUTGOING' && !searchQuery ? (
                    <TouchableOpacity
                      style={styles.emptyActionButton}
                      onPress={handleOpenGrantModal}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.emptyActionText}>＋ Grant Access Now</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.emptyActionButton}
                      onPress={onRefresh}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.emptyActionText}>↻ Refresh Sessions</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : undefined
            }
          />
        )}
      </View>

      {/* Grant Access Modal */}
      <Modal
        visible={showGrantModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGrantModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Grant Delegated Access</Text>
                <Text style={styles.modalSubtitle}>
                  Delegate a credential without exposing plaintext secrets
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowGrantModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Step 1: Member */}
              <Text style={styles.stepLabel}>1. Select Grantee Team Member *</Text>
              {members.length === 0 ? (
                <Text style={styles.fieldHint}>No members found</Text>
              ) : (
                <View style={styles.pillContainer}>
                  {members.map((m) => {
                    const mId = m.userId || m.id;
                    const isSel = selectedGranteeId === mId;
                    return (
                      <TouchableOpacity
                        key={mId}
                        style={[styles.chipOption, isSel && styles.chipOptionSelected]}
                        onPress={() => setSelectedGranteeId(mId)}
                      >
                        <Text style={[styles.chipText, isSel && styles.chipTextSelected]}>
                          👤 {m.user?.fullName || m.user?.email || m.id.substring(0, 8)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Step 2: Vault */}
              <Text style={styles.stepLabel}>2. Select Source Vault *</Text>
              {vaults.length === 0 ? (
                <Text style={styles.fieldHint}>No vaults found in workspace</Text>
              ) : (
                <View style={styles.pillContainer}>
                  {vaults.map((v) => {
                    const isSel = selectedVaultId === v.id;
                    return (
                      <TouchableOpacity
                        key={v.id}
                        style={[styles.chipOption, isSel && styles.chipOptionSelected]}
                        onPress={() => handleSelectVaultForGrant(v.id)}
                      >
                        <Text style={[styles.chipText, isSel && styles.chipTextSelected]}>
                          🗄️ {v.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Step 3: Secret */}
              <Text style={styles.stepLabel}>3. Select Credential Secret *</Text>
              {isLoadingSecretsForGrant ? (
                <ActivityIndicator size="small" color={COLORS.accentCyan} style={{ marginVertical: 8 }} />
              ) : vaultSecrets.length === 0 ? (
                <Text style={styles.fieldHint}>No credentials in selected vault. Add credentials first.</Text>
              ) : (
                <View style={styles.pillContainer}>
                  {vaultSecrets.map((s) => {
                    const isSel = selectedSecretId === s.id;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.chipOption, isSel && styles.chipOptionSelected]}
                        onPress={() => setSelectedSecretId(s.id)}
                      >
                        <Text style={[styles.chipText, isSel && styles.chipTextSelected]}>
                          🔑 {s.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Step 4: Platform */}
              <Text style={styles.stepLabel}>4. Target Platform *</Text>
              <View style={styles.pillContainer}>
                {[
                  'GITHUB',
                  'VERCEL',
                  'GODADDY',
                  'SHOPIFY',
                  'STRIPE',
                  'RAZORPAY',
                  'LINKEDIN',
                  'MCA',
                  'GST',
                  'UDYAM',
                  'INCOMETAX',
                  'GMAIL',
                ].map((p) => {
                  const isSel = selectedPlatform === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[styles.chipOption, isSel && styles.chipOptionSelected]}
                      onPress={() => setSelectedPlatform(p)}
                    >
                      <Text style={[styles.chipText, isSel && styles.chipTextSelected]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Step 5: Duration */}
              <Text style={styles.stepLabel}>5. Access Duration *</Text>
              <View style={styles.pillContainer}>
                {[
                  { label: '1 Hour', hours: '1' },
                  { label: '4 Hours', hours: '4' },
                  { label: '8 Hours', hours: '8' },
                  { label: '24 Hours', hours: '24' },
                  { label: '7 Days', hours: '168' },
                ].map((d) => {
                  const isSel = selectedHours === d.hours;
                  return (
                    <TouchableOpacity
                      key={d.hours}
                      style={[styles.chipOption, isSel && styles.chipOptionSelected]}
                      onPress={() => setSelectedHours(d.hours)}
                    >
                      <Text style={[styles.chipText, isSel && styles.chipTextSelected]}>
                        ⏱️ {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Step 6: Justification */}
              <Text style={styles.stepLabel}>6. Justification (Optional)</Text>
              <TextInput
                style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Reason for delegation (immutable audit record)"
                placeholderTextColor={COLORS.textTertiary}
                multiline
                numberOfLines={2}
                value={grantJustification}
                onChangeText={setGrantJustification}
              />

              {/* Modal Buttons */}
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={() => setShowGrantModal(false)}
                  disabled={isSubmittingGrant}
                >
                  <Text style={styles.btnSecondaryText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.btnPrimary,
                    (!selectedGranteeId || !selectedSecretId || isSubmittingGrant) && styles.btnDisabled,
                  ]}
                  onPress={handleGrantSession}
                  disabled={!selectedGranteeId || !selectedSecretId || isSubmittingGrant}
                >
                  {isSubmittingGrant ? (
                    <ActivityIndicator size="small" color={COLORS.bgDarkest} />
                  ) : (
                    <Text style={styles.btnPrimaryText}>Grant Access</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  body: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  headerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.xs,
  },
  bannerCaption: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textWhite,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  bannerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  grantAccessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentCyan,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginLeft: SPACING.sm,
    flexShrink: 0,
  },
  grantAccessBtnIcon: {
    fontSize: 14,
    color: COLORS.textWhite,
    fontWeight: 'bold',
    marginRight: 4,
  },
  grantAccessBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.md,
  },
  tabSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  tabSegmentActive: {
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.borderFocus,
  },
  tabIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabLabelActive: {
    color: COLORS.textCyan,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    marginBottom: SPACING.md,
  },
  searchIcon: {
    fontSize: 13,
    marginRight: SPACING.xs + 2,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textWhite,
    fontSize: 13,
    padding: 0,
  },
  clearSearchIcon: {
    fontSize: 14,
    color: COLORS.textTertiary,
    padding: 4,
  },
  listContent: {
    paddingBottom: SPACING.xxxl + 20,
  },
  sessionCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardHeaderLeft: {
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
  permittedUserText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
    marginBottom: SPACING.md,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  metaIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  metaTextUrgent: {
    color: COLORS.textAmber,
    fontWeight: '700',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  miniRevokeBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniRevokeText: {
    color: COLORS.textRose,
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 12,
  },
  actionRow: {
    marginTop: SPACING.xs,
    width: '100%',
  },
  launchButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentCyan,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md - 2,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  launchButtonDisabled: {
    backgroundColor: COLORS.bgTertiary,
    opacity: 0.6,
  },
  launchButtonIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  launchButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textWhite,
    textAlign: 'center',
  },
  revokeButtonFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.35)',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md - 2,
    paddingHorizontal: SPACING.lg,
    minHeight: 46,
  },
  revokeButtonText: {
    color: COLORS.textRose,
    fontSize: 13,
    fontWeight: '700',
  },
  centerBox: {
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
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.cyanSubtle,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyEmoji: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 16,
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
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  emptyActionText: {
    color: COLORS.textCyan,
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    padding: SPACING.xl,
    maxHeight: '88%',
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
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textWhite,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs + 2,
  },
  fieldHint: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
    marginBottom: SPACING.xs,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
    marginBottom: SPACING.xs,
  },
  chipOption: {
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  chipOptionSelected: {
    backgroundColor: COLORS.cyanSubtle,
    borderColor: COLORS.accentCyan,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.textCyan,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textWhite,
    fontSize: 13,
    marginTop: 4,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  btnSecondary: {
    backgroundColor: COLORS.bgTertiary,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
  },
  btnSecondaryText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: COLORS.accentCyan,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
  },
  btnPrimaryText: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
