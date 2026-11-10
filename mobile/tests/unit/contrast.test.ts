/** T-NFR-4 – every text/background pair used must reach 4.5:1 */
import { tokens } from '../../theme/tokens';

function lum(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function ratio(a: string, b: string): number {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const c = tokens.color;
const PAIRS: Array<[string, string, string]> = [
  ['text on background', c.text, c.background],
  ['text on surface', c.text, c.surface],
  ['muted text on background', c.textMuted, c.background],
  ['muted text on surface', c.textMuted, c.surface],
  ['white on primary (buttons)', c.surface, c.primary],
  ['primary text on surface', c.primary, c.surface],
  ['primary text on background', c.primary, c.background],
  ['white on danger (SOS, destructive)', c.surface, c.danger],
  ['danger text on surface', c.danger, c.surface],
  ['danger text on background', c.danger, c.background],
  ['onWarning on warning', c.onWarning, c.warning],
  ['white on info (offline banner)', c.surface, c.info],
  ['text on info-free surface banner', c.text, c.surface],
  // StatusChip colours (components/StatusChip.tsx)
  ['chip Submitted', '#1D4ED8', '#EFF6FF'],
  ['chip Under Review', '#B45309', '#FFFBEB'],
  ['chip Escalated', '#B91C1C', '#FEF2F2'],
  ['chip Resolved', '#15803D', '#F0FDF4'],
  ['chip Dismissed', c.textMuted, '#F8FAFC'],
];

describe('T-NFR-4 contrast', () => {
  it.each(PAIRS)('%s is at least 4.5:1', (_name, fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
