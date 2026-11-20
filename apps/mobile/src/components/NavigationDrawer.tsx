/**
 * WITHUS Mobile — Enterprise Navigation Drawer
 * Smooth slide-out navigation system with enterprise branding, categorized groups,
 * active indicator, badges, and user profile.
 */

import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Modal,
  BackHandler,
} from 'react-native';
import { UserProfile, Organization } from '../types/auth.types';
import { NavigationModule } from '../types/module.types';
import { COLORS, SPACING, RADIUS, ANDROID_STATUS_BAR_HEIGHT } from '../theme/theme';

const DRAWER_WIDTH = Math.min(320, Dimensions.get('window').width * 0.82);

interface NavigationDrawerProps {
  isOpen: boolean;
  activeModule: NavigationModule;
  user: UserProfile;
  organization: Organization | null;
  pendingApprovalsCount?: number;
  activeSessionsCount?: number;
  onSelectModule: (module: NavigationModule) => void;
  onOpenOrgPicker: () => void;
  onClose: () => void;
  onLogout: () => void;
}

interface NavItemDef {
  id: NavigationModule;
  label: string;
  icon: string;
  badge?: number | string | null;
  badgeColor?: string;
}

interface NavGroupDef {
  category: string;
  items: NavItemDef[];
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  activeModule,
  user,
  organization,
  pendingApprovalsCount = 0,
  activeSessionsCount = 0,
  onSelectModule,
  onOpenOrgPicker,
  onClose,
  onLogout,
}) => {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  // Handle Android hardware back button when drawer is open
  useEffect(() => {
    if (!isOpen) return;
    const backAction = () => {
      onClose();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isOpen, onClose]);

  const navGroups: NavGroupDef[] = [
    {
      category: 'WORKSPACE',
      items: [
        { id: 'DASHBOARD', label: 'Dashboard', icon: '📊' },
        { id: 'VAULTS', label: 'Vaults', icon: '🔐' },
        {
          id: 'SESSIONS',
          label: 'Sessions',
          icon: '🛡️',
          badge: activeSessionsCount > 0 ? activeSessionsCount : null,
          badgeColor: COLORS.emeraldSubtle,
        },
        { id: 'ACTIVITY', label: 'Activity', icon: '⚡' },
        {
          id: 'APPROVALS',
          label: 'Approvals',
          icon: '📋',
          badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
          badgeColor: COLORS.amberSubtle,
        },
      ],
    },
    {
      category: 'SECURITY',
      items: [
        { id: 'AUDIT', label: 'Audit Log', icon: '📜' },
      ],
    },
    {
      category: 'PLATFORM',
      items: [
        { id: 'INTEGRATIONS', label: 'Integrations', icon: '🔌' },
      ],
    },
    {
      category: 'ORGANIZATION',
      items: [
        { id: 'TEAM', label: 'Team', icon: '👥' },
        { id: 'SETTINGS', label: 'Settings', icon: '⚙️' },
      ],
    },
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop overlay */}
      <Animated.View
        style={[styles.backdrop, { opacity: opacityAnim }]}
        pointerEvents="auto"
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* Drawer content */}
      <Animated.View
        style={[
          styles.drawerContainer,
          {
            width: DRAWER_WIDTH,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Header with WITHUS Branding */}
        <View style={styles.drawerHeader}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoEmoji}>🛡️</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>WITHUS</Text>
              <Text style={styles.brandSubtitle}>ENTERPRISE BROWSER</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close Drawer"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Organization Switcher Pill */}
        <TouchableOpacity
          style={styles.orgPill}
          onPress={() => {
            onClose();
            onOpenOrgPicker();
          }}
          activeOpacity={0.8}
        >
          <View style={styles.orgPillLeft}>
            <Text style={styles.orgPillIcon}>🏢</Text>
            <View style={styles.orgPillTextGroup}>
              <Text style={styles.orgPillLabel}>CURRENT WORKSPACE</Text>
              <Text style={styles.orgPillName} numberOfLines={1}>
                {organization?.name || 'Workspace'}
              </Text>
            </View>
          </View>
          <Text style={styles.orgPillChange}>Switch</Text>
        </TouchableOpacity>

        {/* Navigation Items */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {navGroups.map((group, gIdx) => (
            <View key={gIdx} style={styles.groupContainer}>
              <Text style={styles.groupHeader}>{group.category}</Text>
              {group.items.map((item) => {
                const isActive = activeModule === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.navItem,
                      isActive && styles.navItemActive,
                    ]}
                    onPress={() => {
                      onSelectModule(item.id);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.navItemLeft}>
                      <Text style={[styles.navIcon, isActive && styles.navIconActive]}>
                        {item.icon}
                      </Text>
                      <Text
                        style={[
                          styles.navLabel,
                          isActive && styles.navLabelActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>

                    {item.badge != null && (
                      <View
                        style={[
                          styles.badgeContainer,
                          isActive && styles.badgeContainerActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            isActive && styles.badgeTextActive,
                          ]}
                        >
                          {item.badge}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>

        {/* Footer User Profile & Logout */}
        <View style={styles.drawerFooter}>
          <View style={styles.userProfileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user.fullName || user.email || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.fullName || 'Enterprise Operator'}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => setShowLogoutConfirm(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.confirmBackdrop}>
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
                  onClose();
                  onLogout();
                }}
              >
                <Text style={styles.confirmLogoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 998,
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: COLORS.bgDarkest,
    borderRightWidth: 1,
    borderRightColor: COLORS.borderSubtle,
    zIndex: 999,
    flexDirection: 'column',
  },
  drawerHeader: {
    paddingTop: ANDROID_STATUS_BAR_HEIGHT + SPACING.md,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 2,
  },
  logoEmoji: {
    fontSize: 20,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textWhite,
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textTertiary,
    letterSpacing: 0.8,
    marginTop: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  orgPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  orgPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  orgPillIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  orgPillTextGroup: {
    flex: 1,
  },
  orgPillLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 0.6,
  },
  orgPillName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textWhite,
    marginTop: 1,
  },
  orgPillChange: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accentCyan,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: SPACING.sm,
  },
  groupContainer: {
    marginBottom: SPACING.md,
  },
  groupHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1.2,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    textTransform: 'uppercase',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 3,
    paddingHorizontal: SPACING.lg,
    marginHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  navItemActive: {
    backgroundColor: COLORS.cyanSubtle,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    fontSize: 16,
    marginRight: SPACING.md,
    opacity: 0.75,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  navLabelActive: {
    color: COLORS.textCyan,
    fontWeight: '700',
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgTertiary,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  badgeContainerActive: {
    backgroundColor: COLORS.cyanBorder,
    borderColor: COLORS.accentCyan,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  badgeTextActive: {
    color: COLORS.textWhite,
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.bgPrimary,
  },
  userProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 2,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textWhite,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  userEmail: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.roseSubtle,
    borderWidth: 1,
    borderColor: COLORS.roseBorder,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
  },
  logoutIcon: {
    fontSize: 14,
    marginRight: SPACING.sm,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textRose,
  },
  confirmBackdrop: {
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
});
