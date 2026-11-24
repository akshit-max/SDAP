import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/theme.ts';

interface FeedbackBannerProps {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  onDismiss?: () => void;
}

export const FeedbackBanner: React.FC<FeedbackBannerProps> = ({
  type,
  message,
  onDismiss,
}) => {
  let bg = COLORS.cyanSubtle;
  let border = COLORS.cyanBorder;
  let textColor = COLORS.textCyan;
  let icon = 'ℹ️';

  if (type === 'success') {
    bg = COLORS.emeraldSubtle;
    border = COLORS.emeraldBorder;
    textColor = COLORS.textEmerald;
    icon = '✓';
  } else if (type === 'warning') {
    bg = COLORS.amberSubtle;
    border = COLORS.amberBorder;
    textColor = COLORS.textAmber;
    icon = '⚠️';
  } else if (type === 'error') {
    bg = COLORS.roseSubtle;
    border = COLORS.roseBorder;
    textColor = COLORS.textRose;
    icon = '✕';
  }

  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor: border }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.message, { color: textColor }]}>{message}</Text>
      {onDismiss ? (
        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
          <Text style={[styles.dismissText, { color: textColor }]}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginVertical: SPACING.xs,
  },
  icon: {
    fontSize: 14,
    marginRight: SPACING.sm,
  },
  message: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  dismissButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  dismissText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

