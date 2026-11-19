import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PLATFORM_COLORS, RADIUS, SPACING } from '../theme/theme.ts';

interface PlatformBadgeProps {
  platform: string;
  size?: 'small' | 'medium' | 'large';
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({
  platform,
  size = 'medium',
}) => {
  const key = (platform || '').toUpperCase();
  const theme = PLATFORM_COLORS[key] || PLATFORM_COLORS.DEFAULT;
  const initial = key.charAt(0) || 'P';

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <View
      style={[
        styles.iconContainer,
        { backgroundColor: theme.bg, borderColor: theme.border },
        isSmall && styles.iconSmall,
        isLarge && styles.iconLarge,
      ]}
    >
      <Text
        style={[
          styles.iconText,
          { color: theme.text },
          isSmall && styles.textSmall,
          isLarge && styles.textLarge,
        ]}
      >
        {initial}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconSmall: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
  },
  iconLarge: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
  },
  iconText: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  textSmall: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 20,
  },
});

