/**
 * WITHUS Mobile Design System & Tokens
 *
 * Provides consistent colors, typography, spacing, border radii,
 * and component styles aligned with the WITHUS enterprise security identity.
 */

import { Platform, StatusBar } from 'react-native';

export const COLORS = {
  // Backgrounds
  bgDarkest: '#070A11',
  bgPrimary: '#0B0F19',
  bgSecondary: '#111827',
  bgTertiary: '#1E293B',
  bgElevated: '#1A2234',
  bgInput: '#0E1422',
  
  // Tints & Subtles
  cyanSubtle: 'rgba(56, 189, 248, 0.12)',
  cyanBorder: 'rgba(56, 189, 248, 0.3)',
  emeraldSubtle: 'rgba(74, 222, 128, 0.12)',
  emeraldBorder: 'rgba(74, 222, 128, 0.3)',
  amberSubtle: 'rgba(251, 191, 36, 0.12)',
  amberBorder: 'rgba(251, 191, 36, 0.3)',
  roseSubtle: 'rgba(248, 113, 113, 0.12)',
  roseBorder: 'rgba(248, 113, 113, 0.3)',
  purpleSubtle: 'rgba(168, 85, 247, 0.12)',
  purpleBorder: 'rgba(168, 85, 247, 0.3)',

  // Borders
  borderSubtle: '#1E293B',
  borderMedium: '#334155',
  borderHighlight: '#475569',
  borderFocus: '#38BDF8',

  // Text
  textWhite: '#F8FAFC',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textDisabled: '#475569',
  textCyan: '#38BDF8',
  textEmerald: '#4ADE80',
  textAmber: '#FBBF24',
  textRose: '#F87171',

  // Brand Accents
  accentCyan: '#38BDF8',
  accentBlue: '#0284C7',
  accentNavy: '#0369A1',
  accentEmerald: '#10B981',
  accentRose: '#EF4444',
  accentAmber: '#F59E0B',
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

