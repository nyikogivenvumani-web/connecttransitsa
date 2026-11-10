/** T-NFR-4 (web) – colour pairs used by the portals */
import { tokens } from '../../theme/tokens';

function lum(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const ratio = (a: string, b: string) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
const c = tokens.color;

it.each([
  ['text on background', c.text, c.background], ['text on surface', c.text, c.surface],
  ['muted on background', c.textMuted, c.background], ['muted on surface', c.textMuted, c.surface],
  ['white on primary (buttons)', '#FFFFFF', c.primary], ['danger text on surface', c.danger, c.surface],
  ['white on info (offline alert)', '#FFFFFF', c.info], ['text on border-light chip', c.text, c.border],
])('%s is at least 4.5:1', (_n, fg, bg) => {
  expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
});
