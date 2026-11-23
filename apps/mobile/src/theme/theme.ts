/**
 * WITHUS Mobile Design System & Tokens
 *
 * Provides consistent colors, typography, spacing, border radii,
 * and component styles aligned with the WITHUS enterprise security identity.
 */

import { Platform, StatusBar } from 'react-native';

export const COLORS = {
  // Authentic WITHUS Apple macOS/iOS Enterprise Dark Backgrounds
  bgDarkest: '#000000',
  bgPrimary: '#0D0D0E',
  bgSecondary: '#1C1C1E',
  bgTertiary: '#2C2C2E',
  bgElevated: '#2C2C2E',
  bgInput: '#1C1C1E',
  
  // Apple System Tints & Subtles
  cyanSubtle: 'rgba(0, 113, 227, 0.15)',
  cyanBorder: 'rgba(0, 113, 227, 0.35)',
  emeraldSubtle: 'rgba(52, 199, 89, 0.15)',
  emeraldBorder: 'rgba(52, 199, 89, 0.35)',
  amberSubtle: 'rgba(255, 149, 0, 0.15)',
  amberBorder: 'rgba(255, 149, 0, 0.35)',
  roseSubtle: 'rgba(255, 59, 48, 0.15)',
  roseBorder: 'rgba(255, 59, 48, 0.35)',
  purpleSubtle: 'rgba(175, 82, 222, 0.15)',
  purpleBorder: 'rgba(175, 82, 222, 0.35)',

  // Apple System Borders
  borderSubtle: '#2C2C2E',
  borderMedium: '#38383A',
  borderHighlight: '#48484A',
  borderFocus: '#0071E3',

  // Apple Typography Colors
  textWhite: '#F5F5F7',
  textPrimary: '#FFFFFF',
  textSecondary: '#86868B',
  textTertiary: '#636366',
  textDisabled: '#48484A',
  textCyan: '#2997FF',
  textEmerald: '#30D158',
  textAmber: '#FF9F0A',
  textRose: '#FF453A',

  // WITHUS Brand Accents (Apple macOS / iOS Palette)
  accentCyan: '#0071E3',
  accentBlue: '#0071E3',
  accentNavy: '#004080',
  accentEmerald: '#34C759',
  accentRose: '#FF3B30',
  accentAmber: '#FF9500',
};

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};

export const ANDROID_STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0;

export const PLATFORM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  GITHUB: { bg: '#181E2A', text: '#F8FAFC', border: '#2D3748' },
  VERCEL: { bg: '#000000', text: '#FFFFFF', border: '#333333' },
  GODADDY: { bg: '#062B33', text: '#2DD4BF', border: '#0D4E5B' },
  SHOPIFY: { bg: '#0F291E', text: '#4ADE80', border: '#1A4D37' },
  STRIPE: { bg: '#1E1B4B', text: '#A5B4FC', border: '#3730A3' },
  RAZORPAY: { bg: '#0B213F', text: '#60A5FA', border: '#1D4ED8' },
  LINKEDIN: { bg: '#0A2540', text: '#38BDF8', border: '#0369A1' },
  MCA: { bg: '#1E293B', text: '#F59E0B', border: '#78350F' },
  GST: { bg: '#1E293B', text: '#34D399', border: '#065F46' },
  UDYAM: { bg: '#1C1917', text: '#F97316', border: '#7C2D12' },
  GMAIL: { bg: '#2D1515', text: '#F87171', border: '#7F1D1D' },
  DEFAULT: { bg: '#1E293B', text: '#94A3B8', border: '#334155' },
};

