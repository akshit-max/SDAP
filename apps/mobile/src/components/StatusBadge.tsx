/**
 * WITHUS Mobile — Enterprise Status Badge
 * Matches the Apple macOS / iOS badge design from the WITHUS web application
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/theme.ts';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const s = (status || '').toUpperCase();
  let bg = COLORS.cyanSubtle;
  let text = COLORS.textCyan;
  let border = COLORS.cyanBorder;
  let label = s;
  let icon = '●';

  if (s === 'ACTIVE' || s === 'VERIFIED' || s === 'SUCCESS' || s === 'FILLED') {
    bg = 'rgba(52, 199, 89, 0.15)';
    text = '#30D158';
    border = 'rgba(52, 199, 89, 0.35)';
    label = 'Active';
    icon = '●';
  } else if (s === 'REVOKED') {
    bg = 'rgba(255, 59, 48, 0.15)';
    text = '#FF453A';
    border = 'rgba(255, 59, 48, 0.35)';
    label = 'Revoked';
    icon = '✕';
  } else if (s === 'EXPIRED' || s === 'FAILED' || s === 'ERROR') {
    bg = 'rgba(142, 142, 147, 0.15)';
    text = '#8E8E93';
    border = 'rgba(142, 142, 147, 0.3)';
    label = 'Expired';
    icon = '⏱';
  } else if (s === 'PENDING' || s === 'FETCHING' || s === 'WARNING') {
    bg = 'rgba(255, 149, 0, 0.15)';
    text = '#FF9F0A';
    border = 'rgba(255, 149, 0, 0.35)';
    label = 'Pending';
    icon = '⏳';
  }

  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg, borderColor: border },
        isSmall && styles.badgeSmall,
      ]}
    >
      <Text style={[styles.icon, { color: text }, isSmall && styles.iconSmall]}>{icon}</Text>
      <Text style={[styles.text, { color: text }, isSmall && styles.textSmall]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  badgeSmall: {
    paddingHorizontal: SPACING.xs + 3,
    paddingVertical: 2,
  },
  icon: {
    fontSize: 9,
    marginRight: 4,
    fontWeight: '800',
  },
  iconSmall: {
    fontSize: 8,
    marginRight: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textSmall: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
