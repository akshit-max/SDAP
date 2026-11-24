/**
 * WITHUS Mobile — Team Members Screen
 * Full parity with WITHUS Web Team Management:
 * - List organization members and roles (OWNER, ADMIN, MEMBER)
 * - Send email invitations to new team members
 * - Remove members with confirmation
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Organization } from '../types/auth.types';
import { OrganizationMember } from '../types/module.types';
import { ApiService, ApiError } from '../services/api.service';
import { AppHeader } from '../components/AppHeader';
import { COLORS, SPACING, RADIUS } from '../theme/theme';

interface TeamScreenProps {
  organization: Organization | null;
  onOpenDrawer: () => void;
  onOpenOrgPicker: () => void;
}

export const TeamScreen: React.FC<TeamScreenProps> = ({
  organization,
  onOpenDrawer,
  onOpenOrgPicker,
}) => {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Invite Member Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!organization?.id) {
      setErrorMessage('No organization selected.');
      setIsLoading(false);
      return;
    }

    setErrorMessage(null);
    try {
      const data = await ApiService.getMembers(organization.id);
      setMembers(data || []);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err.message || 'Failed to load team members');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchMembers();
  };

  const handleSendInvite = async () => {
    if (!organization?.id || !inviteEmail.trim() || isSendingInvite) return;
    setIsSendingInvite(true);
    setErrorMessage(null);

    try {
      await ApiService.inviteMember(organization.id, inviteEmail.trim(), inviteRole);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('MEMBER');
      setSuccessBanner(`Invitation sent to ${inviteEmail.trim()}.`);
      fetchMembers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send invitation.');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleRemoveMember = (member: OrganizationMember) => {
    if (!organization?.id) return;
    const name = member.user?.fullName || member.user?.email || 'this member';
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${name} from ${organization.name}? All active delegated sessions will be revoked.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.removeMember(organization.id, member.userId || member.id);
              setSuccessBanner(`Removed ${name}.`);
              fetchMembers();
            } catch (err: any) {
              setErrorMessage(err.message || 'Failed to remove member.');
            }
          },
        },
      ],
    );
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const getRoleStyle = (role: string) => {
    switch (role.toUpperCase()) {
      case 'OWNER':
        return {
          bg: COLORS.amberSubtle,
          border: COLORS.amberBorder,
          text: COLORS.textAmber,
          icon: '👑',
        };
      case 'ADMIN':
        return {
          bg: COLORS.cyanSubtle,
          border: COLORS.cyanBorder,
          text: COLORS.textCyan,
          icon: '🛡️',
        };
      default:
        return {
          bg: COLORS.bgTertiary,
          border: COLORS.borderMedium,
          text: COLORS.textSecondary,
          icon: '👤',
        };
    }
  };

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        (m.user?.fullName && m.user.fullName.toLowerCase().includes(q)) ||
        (m.user?.email && m.user.email.toLowerCase().includes(q)) ||
        m.role.toLowerCase().includes(q),
    );
  }, [members, searchQuery]);

  const renderMemberItem = ({ item }: { item: OrganizationMember }) => {
    const roleStyle = getRoleStyle(item.role);
    const displayName = item.user?.fullName || item.user?.email?.split('@')[0] || 'Member';
    const email = item.user?.email || 'Unknown User';
    const isOwner = item.role.toUpperCase() === 'OWNER';

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {email}
            </Text>
          </View>

          {/* Role Badge */}
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: roleStyle.bg, borderColor: roleStyle.border },
            ]}
          >
            <Text style={styles.roleIcon}>{roleStyle.icon}</Text>
            <Text style={[styles.roleText, { color: roleStyle.text }]}>
              {item.role.toUpperCase()}
            </Text>
          </View>

          {/* Remove Member Button */}
          {!isOwner && (
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemoveMember(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.removeIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.joinedText}>Joined {formatDate(item.joinedAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Team"
        subtitle="ORGANIZATION ROSTER"
        organization={organization}
        onOpenDrawer={onOpenDrawer}
        onOpenOrgPicker={onOpenOrgPicker}
      />

      {/* Top Action Bar: Search & Invite */}
      <View style={styles.topActionBar}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search team members..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => setShowInviteModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.inviteBtnIcon}>＋</Text>
          <Text style={styles.inviteBtnText}>Invite</Text>
        </TouchableOpacity>
      </View>

      {/* Success Notification */}
      {successBanner && (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>{successBanner}</Text>
          <TouchableOpacity onPress={() => setSuccessBanner(null)}>
            <Text style={styles.bannerCloseIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main List Area */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accentCyan} />
          <Text style={styles.loadingText}>Loading Member Roster...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error Loading Team</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMembers}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredMembers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>No Members Found</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? `No members matching "${searchQuery}".`
              : 'No team members invited yet. Tap "+ Invite" to add colleagues.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id || item.userId}
          renderItem={renderMemberItem}
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
        />
      )}

      {/* Invite Member Modal */}
      <Modal
        visible={showInviteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Invite Team Member</Text>
            <Text style={styles.modalSubtitle}>
              Send an invitation link to onboard a new member into {organization?.name}.
            </Text>

            <Text style={styles.inputLabel}>Colleague Email Address *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. colleague@company.com"
              placeholderTextColor={COLORS.textTertiary}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />

            <Text style={styles.inputLabel}>Workspace Role</Text>
            <View style={styles.rolePickerRow}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  inviteRole === 'MEMBER' && styles.roleOptionActive,
                ]}
                onPress={() => setInviteRole('MEMBER')}
              >
                <Text
                  style={[
                    styles.roleOptionText,
                    inviteRole === 'MEMBER' && styles.roleOptionTextActive,
                  ]}
                >
                  Member
                </Text>
                <Text style={styles.roleOptionSub}>Standard delegated access</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleOption,
                  inviteRole === 'ADMIN' && styles.roleOptionActive,
                ]}
                onPress={() => setInviteRole('ADMIN')}
              >
                <Text
                  style={[
                    styles.roleOptionText,
                    inviteRole === 'ADMIN' && styles.roleOptionTextActive,
                  ]}
                >
                  Admin
                </Text>
                <Text style={styles.roleOptionSub}>Can grant sessions & invite</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => setShowInviteModal(false)}
                disabled={isSendingInvite}
              >
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnPrimary, isSendingInvite && styles.btnDisabled]}
                onPress={handleSendInvite}
                disabled={isSendingInvite}
              >
                {isSendingInvite ? (
                  <ActivityIndicator size="small" color={COLORS.bgDarkest} />
                ) : (
                  <Text style={styles.btnPrimaryText}>Send Invite</Text>
                )}
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
  topActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    gap: SPACING.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: SPACING.sm,
    color: COLORS.textTertiary,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textWhite,
    paddingVertical: 0,
  },
  clearSearchIcon: {
    fontSize: 14,
    color: COLORS.textSecondary,
    padding: SPACING.xs,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentCyan,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  inviteBtnIcon: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.bgDarkest,
    marginRight: 4,
  },
  inviteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.bgDarkest,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.emeraldSubtle,
    borderWidth: 1,
    borderColor: COLORS.emeraldBorder,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  successBannerText: {
    fontSize: 12,
    color: COLORS.textEmerald,
    fontWeight: '600',
    flex: 1,
  },
  bannerCloseIcon: {
    fontSize: 12,
    color: COLORS.textSecondary,
    padding: SPACING.xs,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accentNavy,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textWhite,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  userEmail: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    marginRight: SPACING.xs,
  },
  roleIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  cardFooter: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  joinedText: {
    fontSize: 10,
    color: COLORS.textTertiary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: SPACING.md,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  errorMessage: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  retryButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentCyan,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.bgDarkest,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 18,
    maxWidth: 280,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textWhite,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginBottom: SPACING.lg,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  textInput: {
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    color: COLORS.textWhite,
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  roleOption: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  roleOptionActive: {
    backgroundColor: COLORS.cyanSubtle,
    borderColor: COLORS.cyanBorder,
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  roleOptionTextActive: {
    color: COLORS.textCyan,
  },
  roleOptionSub: {
    fontSize: 9,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  btnSecondary: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgTertiary,
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  btnPrimary: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentCyan,
    minWidth: 110,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.bgDarkest,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
