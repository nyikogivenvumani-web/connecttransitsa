/** T-NFR-6 – server-only secret names never appear in app or browser code */
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(__dirname, '../../..');
const DIRS = ['mobile/app', 'mobile/components', 'mobile/lib', 'web/app', 'web/components', 'web/lib'];
const FORBIDDEN = ['SERVICE_ROLE', 'CLICKATELL', 'SAPS_WEBHOOK', 'DISPATCH_WEBHOOK_SECRET'];

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' || e.name === '.next' ? [] : files(p);
    return /\.(ts|tsx|js|jsx)$/.test(e.name) ? [p] : [];
  });
}

describe('T-NFR-6 secrets', () => {
  const all = DIRS.flatMap((d) => files(path.join(ROOT, d)));
  it('scans a meaningful number of files', () => expect(all.length).toBeGreaterThan(40));
  it.each(FORBIDDEN)('%s never appears in app or browser code', (word) => {
    const hits = all.filter((f) => fs.readFileSync(f, 'utf8').includes(word)).map((f) => path.relative(ROOT, f));
    expect(hits).toEqual([]);
  });
  it('only EXPO_PUBLIC_ / NEXT_PUBLIC_ variables are read in app and browser code', () => {
    const bad: string[] = [];
    for (const f of all) {
      const text = fs.readFileSync(f, 'utf8');
      for (const m of text.matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
        if (!/^(EXPO_PUBLIC_|NEXT_PUBLIC_|NODE_ENV)/.test(m[1])) bad.push(`${path.relative(ROOT, f)}: ${m[1]}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
