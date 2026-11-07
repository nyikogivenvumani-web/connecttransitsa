/**
 * Design tokens — Section 7.1 of IMPLEMENTATION_PLAN.md
 * Identical values to mobile/theme/tokens.ts.
 * Web uses CSS custom properties and Tailwind; this file is the TS source of truth.
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
    card: '0 1px 3px rgba(15,23,42,0.06)',
    sheet: '0 4px 12px rgba(15,23,42,0.12)',
    sos: '0 8px 24px rgba(220,38,38,0.25)',
  },

  layout: {
    maxWidth: {
      console: 720,
    },
  },
} as const;

export type Tokens = typeof tokens;
