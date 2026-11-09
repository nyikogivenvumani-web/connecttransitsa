import type React from 'react';
import { tokens } from '../theme/tokens';

export const page: React.CSSProperties = {
  minHeight: '100vh', backgroundColor: tokens.color.background, fontFamily: tokens.font.family, color: tokens.color.text,
  padding: tokens.space[2],
};
export const container: React.CSSProperties = { maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: tokens.space[2] };
export const card: React.CSSProperties = {
  backgroundColor: tokens.color.surface, borderRadius: tokens.radius.card, padding: tokens.space[2],
  boxShadow: tokens.shadow.sheet, display: 'flex', flexDirection: 'column', gap: tokens.space[1],
};
export const input: React.CSSProperties = {
  padding: `${tokens.space[1]}px ${tokens.space[2]}px`, border: `1px solid ${tokens.color.borderStrong}`,
  borderRadius: 8, fontFamily: 'inherit', fontSize: 16, width: '100%', boxSizing: 'border-box',
};
export const button = (disabled = false): React.CSSProperties => ({
  padding: `${tokens.space[1]}px ${tokens.space[2]}px`, borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 16,
  backgroundColor: disabled ? tokens.color.borderStrong : tokens.color.primary, color: '#fff',
  cursor: disabled ? 'not-allowed' : 'pointer',
});
export const errorText: React.CSSProperties = { color: tokens.color.danger, fontSize: 14, margin: 0 };
export const muted: React.CSSProperties = { color: tokens.color.textMuted, fontSize: 14, margin: 0 };
