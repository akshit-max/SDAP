/**
 * WITHUS Mobile — Unified Enterprise Application Header
 * Consistent top navigation bar with Drawer trigger & Organization Switcher
 */

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Organization } from '../types/auth.types';
import { COLORS, SPACING, RADIUS, ANDROID_STATUS_BAR_HEIGHT } from '../theme/theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  organization: Organization | null;
  onOpenDrawer: () => void;
  onOpenOrgPicker: () => void;
  rightAction?: React.ReactNode;
  onLogout?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  organization,
  onOpenDrawer,
  onOpenOrgPicker,
  rightAction,
  onLogout,
}) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        {/* Left: Drawer Hamburger Trigger */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onOpenDrawer}
          accessibilityLabel="Open Navigation Menu"
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>

        {/* Center: Title & Subtitle */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitleText} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Right: Organization Picker or Custom Action */}
        {rightAction ? (
          rightAction
        ) : (
          <View style={styles.rightGroup}>
            <TouchableOpacity
              style={styles.orgChip}
              onPress={onOpenOrgPicker}
              activeOpacity={0.8}
              accessibilityLabel="Switch Organization"
            >
              <View style={styles.orgDot} />
              <Text style={styles.orgText} numberOfLines={1}>
                {organization?.name || 'Workspace'}
              </Text>
              <Text style={styles.orgChevron}>▼</Text>
            </TouchableOpacity>

            {onLogout ? (
              <TouchableOpacity
                style={styles.headerLogoutBtn}
                onPress={onLogout}
                activeOpacity={0.7}
                accessibilityLabel="Sign Out"
              >
                <Text style={styles.headerLogoutText}>⎋</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.bgDarkest,
    paddingTop: ANDROID_STATUS_BAR_HEIGHT + SPACING.sm,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    color: COLORS.textWhite,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textWhite,
    letterSpacing: 0.3,
  },
  subtitleText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  orgChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    maxWidth: 150,
  },
  orgDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentCyan,
    marginRight: 6,
  },
  orgText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  orgChevron: {
    fontSize: 8,
    color: COLORS.textTertiary,
    marginLeft: 5,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerLogoutBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoutText: {
    color: '#FF453A',
    fontSize: 15,
    fontWeight: '700',
  },
});

