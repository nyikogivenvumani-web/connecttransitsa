/**
 * Design tokens — Section 7.1 of IMPLEMENTATION_PLAN.md
 * Values here are the single source of truth for both the app and the web.
 * Identical file exists at web/theme/tokens.ts.
 *
 * Rules:
 * - Never hard-code a colour, font size, spacing or radius in a component.
 * - Always import from this file.
 */

export const tokens = {
  color: {
    primary: '#0B7A6B',
    warning: '#D97706',
    info: '#0E7490',
    danger: '#DC2626',
    success: '#059669',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
    onWarning: '#0F172A',
  },

  font: {
    family: 'Inter',
    h1: { size: 24, lineHeight: 32, weight: '700' as const, letterSpacing: -0.48 },
    h2: { size: 20, lineHeight: 28, weight: '600' as const, letterSpacing: -0.20 },
    h3: { size: 16, lineHeight: 24, weight: '600' as const, letterSpacing: 0 },
    body: { size: 14, lineHeight: 20, weight: '400' as const, letterSpacing: 0 },
    caption: { size: 12, lineHeight: 16, weight: '400' as const, letterSpacing: 0.12 },
    label: { size: 14, lineHeight: 20, weight: '600' as const, letterSpacing: 0 },
    labelSmall: { size: 12, lineHeight: 16, weight: '600' as const, letterSpacing: 0 },
    micro: {
      size: 10,
      lineHeight: 14,
      weight: '700' as const,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
  },

  space: {
    tight: 4,
    1: 8,
    2: 16,
    3: 24,
    4: 32,
    5: 48,
  },

  radius: {
    card: 8,
    input: 8,
    pill: 24,
  },

  size: {
    touchMin: 48,
    button: 48,
    sosButton: 56,
    input: 48,
    row: {
      single: 56,
      double: 72,
    },
    chip: 28,
  },

  shadow: {
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    sheet: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4,
    },
    sos: {
      shadowColor: '#DC2626',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 8,
    },
  },

  layout: {
    maxWidth: {
      console: 720,
    },
  },
} as const;

export type Tokens = typeof tokens;
