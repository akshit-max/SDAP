/**
 * WITHUS Mobile — Settings Screen
 * User profile, workspace context, and enterprise mobile security telemetry.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { UserProfile, Organization, BiometricStatus } from '../types/auth.types';
import { BiometricsService } from '../services/biometrics.service';
import { SecureStorageService } from '../services/storage.service';
import { ApiService } from '../services/api.service';
import { AppHeader } from '../components/AppHeader';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { COLORS, SPACING, RADIUS } from '../theme/theme';

interface SettingsScreenProps {
  user: UserProfile;
  organization: Organization | null;
  onOpenDrawer: () => void;
  onOpenOrgPicker: () => void;
  onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  user,
  organization,
  onOpenDrawer,
  onOpenOrgPicker,
  onLogout,
}) => {
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [currentFullName, setCurrentFullName] = useState(user.fullName || '');
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [newFullName, setNewFullName] = useState(user.fullName || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    try {
      const [bio, url] = await Promise.all([
        BiometricsService.checkStatus(),
        SecureStorageService.getApiBaseUrl(),
      ]);
      setBiometricStatus(bio);
      setApiBaseUrl(url);
    } catch {
      // Non-blocking
    }
  };

  const handleUpdateProfile = async () => {
    if (!newFullName.trim() || isUpdatingProfile) return;
    setIsUpdatingProfile(true);
    setProfileFeedback(null);
    try {
      const updated = await ApiService.updateProfile({ fullName: newFullName.trim() });
      setCurrentFullName(updated.fullName || newFullName.trim());
      setShowEditProfileModal(false);
      setProfileFeedback({ type: 'success', message: 'Profile updated successfully.' });
    } catch (err: any) {
      setProfileFeedback({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Settings"
        subtitle="PREFERENCES & SECURITY"
        organization={organization}
        onOpenDrawer={onOpenDrawer}
        onOpenOrgPicker={onOpenOrgPicker}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Identity Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>OPERATOR IDENTITY</Text>
            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => {
                setNewFullName(currentFullName);
                setShowEditProfileModal(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.editProfileBtnText}>✏️ Edit</Text>
            </TouchableOpacity>
          </View>

          {profileFeedback ? (
            <View style={{ marginBottom: SPACING.sm }}>
              <FeedbackBanner
                type={profileFeedback.type}
                message={profileFeedback.message}
                onDismiss={() => setProfileFeedback(null)}
              />
            </View>
          ) : null}

          <View style={styles.card}>
            <View style={styles.userRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(currentFullName || user.email || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{currentFullName || 'WITHUS Operator'}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>User ID</Text>
              <Text style={styles.itemValueMono} numberOfLines={1}>
                {user.id}
              </Text>
            </View>
          </View>
        </View>

        {/* Workspace Context */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ACTIVE WORKSPACE</Text>
          <View style={styles.card}>
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>Organization</Text>
              <Text style={styles.itemValue}>{organization?.name || 'Workspace'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>Your Role</Text>
              <View style={styles.roleChip}>
                <Text style={styles.roleChipText}>
                  {(organization?.role || 'MEMBER').toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>Organization ID</Text>
              <Text style={styles.itemValueMono} numberOfLines={1}>
                {organization?.id || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Mobile Security Posture */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>HARDWARE SECURITY POSTURE</Text>
          <View style={styles.card}>
            <View style={styles.securityRow}>
              <View style={styles.securityIconBox}>
                <Text style={styles.securityEmoji}>🛡️</Text>
              </View>
              <View style={styles.securityMeta}>
                <Text style={styles.securityTitle}>Android Keystore Protection</Text>
                <Text style={styles.securitySub}>Hardware-backed AES-256 GCM token storage</Text>
              </View>
              <View style={styles.statusPillActive}>
                <Text style={styles.statusPillActiveText}>ACTIVE</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.securityRow}>
              <View style={styles.securityIconBox}>
                <Text style={styles.securityEmoji}>🔒</Text>
              </View>
              <View style={styles.securityMeta}>
                <Text style={styles.securityTitle}>Screen Shield (FLAG_SECURE)</Text>
                <Text style={styles.securitySub}>Screenshots & app switchers blocked</Text>
              </View>
              <View style={styles.statusPillActive}>
                <Text style={styles.statusPillActiveText}>ENFORCED</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.securityRow}>
              <View style={styles.securityIconBox}>
                <Text style={styles.securityEmoji}>👆</Text>
              </View>
              <View style={styles.securityMeta}>
                <Text style={styles.securityTitle}>Biometric Authentication</Text>
                <Text style={styles.securitySub}>
                  {biometricStatus?.biometryType || 'Fingerprint / Face'}
                </Text>
              </View>
              <View
                style={
                  biometricStatus?.isAvailable
                    ? styles.statusPillActive
                    : styles.statusPillInactive
                }
              >
                <Text
                  style={
                    biometricStatus?.isAvailable
                      ? styles.statusPillActiveText
                      : styles.statusPillInactiveText
                  }
                >
                  {biometricStatus?.isAvailable ? 'AVAILABLE' : 'OFF'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.securityRow}>
              <View style={styles.securityIconBox}>
                <Text style={styles.securityEmoji}>🌐</Text>
              </View>
              <View style={styles.securityMeta}>
                <Text style={styles.securityTitle}>Navigation Boundary Guard</Text>
                <Text style={styles.securitySub}>Strict HTTPS & verified platform origins</Text>
              </View>
              <View style={styles.statusPillActive}>
                <Text style={styles.statusPillActiveText}>ENABLED</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Runtime Diagnostics */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>RUNTIME DIAGNOSTICS</Text>
          <View style={styles.card}>
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>Backend Endpoint</Text>
              <Text style={styles.itemValueMono} numberOfLines={1}>
                {apiBaseUrl}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>App Version</Text>
              <Text style={styles.itemValue}>1.0.0 (Enterprise PoC)</Text>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => setShowLogoutConfirm(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.signOutIcon}>🚪</Text>
          <Text style={styles.signOutText}>Sign Out of WITHUS</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Confirm Sign Out</Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to end your session? Stored session credentials and local keystore tokens will be safely cleared.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmLogoutButton}
                onPress={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
              >
                <Text style={styles.confirmLogoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Edit Profile</Text>
            <Text style={styles.confirmMessage}>
              Update your full name as shown across delegated access workspaces.
            </Text>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Full Name"
              placeholderTextColor={COLORS.textTertiary}
              value={newFullName}
              onChangeText={setNewFullName}
            />

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditProfileModal(false)}
                disabled={isUpdatingProfile}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveProfileButton, isUpdatingProfile && { opacity: 0.5 }]}
                onPress={handleUpdateProfile}
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? (
                  <ActivityIndicator size="small" color={COLORS.bgDarkest} />
                ) : (
                  <Text style={styles.saveProfileText}>Save Changes</Text>
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
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accentNavy,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textWhite,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
    marginVertical: SPACING.sm + 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  itemLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  itemValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
  itemValueMono: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: COLORS.textTertiary,
    maxWidth: '65%',
  },
  roleChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.cyanSubtle,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
  },
  roleChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textCyan,
    letterSpacing: 0.5,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  securityIconBox: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 2,
  },
  securityEmoji: {
    fontSize: 16,
  },
  securityMeta: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  securitySub: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  statusPillActive: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.emeraldSubtle,
    borderWidth: 1,
    borderColor: COLORS.emeraldBorder,
  },
  statusPillActiveText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.textEmerald,
    letterSpacing: 0.5,
  },
  statusPillInactive: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.bgTertiary,
  },
  statusPillInactiveText: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.textTertiary,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.roseSubtle,
    borderWidth: 1,
    borderColor: COLORS.roseBorder,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  signOutIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textRose,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textWhite,
    marginBottom: SPACING.sm,
  },
  confirmMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  cancelButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgTertiary,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  confirmLogoutButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentRose,
  },
  confirmLogoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  editProfileBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    backgroundColor: COLORS.cyanSubtle,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
  },
  editProfileBtnText: {
    fontSize: 11,
    color: COLORS.textCyan,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textWhite,
    fontSize: 14,
    marginBottom: SPACING.lg,
  },
  saveProfileButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentCyan,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  saveProfileText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.bgDarkest,
  },
});

