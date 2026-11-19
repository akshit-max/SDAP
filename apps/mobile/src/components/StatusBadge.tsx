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

  if (s === 'ACTIVE' || s === 'VERIFIED' || s === 'SUCCESS' || s === 'FILLED') {
    bg = COLORS.emeraldSubtle;
    text = COLORS.textEmerald;
    border = COLORS.emeraldBorder;
  } else if (s === 'EXPIRED' || s === 'REVOKED' || s === 'ERROR' || s === 'FAILED') {
    bg = COLORS.roseSubtle;
    text = COLORS.textRose;
    border = COLORS.roseBorder;
  } else if (s === 'PENDING' || s === 'FETCHING' || s === 'WARNING') {
    bg = COLORS.amberSubtle;
    text = COLORS.textAmber;
    border = COLORS.amberBorder;
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
      <View style={[styles.dot, { backgroundColor: text }]} />
      <Text style={[styles.text, { color: text }, isSmall && styles.textSmall]}>
        {s}
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
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textSmall: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
});

