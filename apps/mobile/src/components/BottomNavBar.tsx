/**
 * WITHUS Mobile — Enterprise Bottom Navigation Bar
 * Persistent quick-access bar inspired by Apple macOS / iOS design
 */

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { NavigationModule } from '../types/module.types';
import { COLORS, SPACING, RADIUS } from '../theme/theme';

interface BottomNavBarProps {
  activeModule: NavigationModule;
  pendingApprovalsCount?: number;
  onSelectModule: (module: NavigationModule | 'MORE') => void;
}

interface TabItem {
  id: NavigationModule | 'MORE';
  label: string;
  icon: string;
  badge?: number | null;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeModule,
  pendingApprovalsCount = 0,
  onSelectModule,
}) => {
  const tabs: TabItem[] = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: '📊' },
    { id: 'VAULTS', label: 'Vaults', icon: '🔐' },
    { id: 'SESSIONS', label: 'Sessions', icon: '🛡️' },
    {
      id: 'APPROVALS',
      label: 'Approvals',
      icon: '📋',
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
    },
    { id: 'MORE', label: 'More', icon: '☰' },
  ];

  return (
    <View style={styles.navBar}>
      {tabs.map((tab) => {
        const isActive = activeModule === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
            onPress={() => onSelectModule(tab.id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                {tab.icon}
              </Text>
              {tab.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]} numberOfLines={1}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    paddingTop: SPACING.xs + 2,
    paddingBottom: Platform.OS === 'android' ? SPACING.sm + 2 : SPACING.lg,
    paddingHorizontal: SPACING.xs,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: RADIUS.md,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(0, 113, 227, 0.08)',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    width: 28,
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.65,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.05 }],
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tabLabelActive: {
    color: COLORS.textCyan,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -6,
    backgroundColor: COLORS.accentAmber,
    borderRadius: RADIUS.full,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: COLORS.bgDarkest,
    fontSize: 9,
    fontWeight: '800',
  },
});

