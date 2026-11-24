/**
 * WITHUS Mobile — Professional Platform Badge
 * Authentic official brand assets and emblems for supported platform integrations
 */

import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { PLATFORM_COLORS, RADIUS } from '../theme/theme.ts';

// Official GitHub Invertocat Asset
const GITHUB_LOGO = require('../assets/github.png');

interface PlatformBadgeProps {
  platform: string;
  size?: 'small' | 'medium' | 'large';
}

const PLATFORM_ICONS: Record<string, string> = {
  VERCEL: '▲',
  GODADDY: '🌐',
  SHOPIFY: '🛍️',
  STRIPE: '💳',
  RAZORPAY: '⚡',
  LINKEDIN: '💼',
  MCA: '🏛️',
  GST: '📑',
  UDYAM: '🇮🇳',
  GMAIL: '✉️',
  INCOMETAX: '₹',
  ITR: '₹',
  DEFAULT: '🔐',
};

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({
  platform,
  size = 'medium',
}) => {
  const key = (platform || '').toUpperCase();
  const theme = PLATFORM_COLORS[key] || PLATFORM_COLORS.DEFAULT;
  const symbol = PLATFORM_ICONS[key] || key.charAt(0) || 'P';

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
      {key === 'GITHUB' ? (
        <Image
          source={GITHUB_LOGO}
          style={[
            styles.githubImage,
            isSmall && styles.githubImageSmall,
            isLarge && styles.githubImageLarge,
          ]}
          resizeMode="contain"
        />
      ) : (
        <Text
          style={[
            styles.iconText,
            { color: theme.text },
            isSmall && styles.textSmall,
            isLarge && styles.textLarge,
            key === 'VERCEL' && { fontSize: isSmall ? 10 : isLarge ? 18 : 14, fontWeight: '900' },
          ]}
        >
          {symbol}
        </Text>
      )}
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
  githubImage: {
    width: 22,
    height: 22,
  },
  githubImageSmall: {
    width: 16,
    height: 16,
  },
  githubImageLarge: {
    width: 28,
    height: 28,
  },
  iconText: {
    fontSize: 16,
    textAlign: 'center',
  },
  textSmall: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 22,
  },
});
