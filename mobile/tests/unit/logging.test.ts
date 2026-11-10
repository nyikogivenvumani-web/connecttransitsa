/** T-NFR-7 – no code logs passwords, OTPs, tokens, ID numbers, phone numbers or emails */
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(__dirname, '../../..');
const DIRS = ['mobile/app', 'mobile/components', 'mobile/lib', 'web/app', 'web/components', 'web/lib', 'supabase/functions'];
const SENSITIVE = /password|passcode|otp|token|secret|id_?number|idnumber|phone|email|session|jwt|apikey|api_key/i;

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' || e.name === '.next' ? [] : files(p);
    return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
  });
}

it('no console call mentions a sensitive value', () => {
  const offenders: string[] = [];
  for (const f of DIRS.flatMap((d) => files(path.join(ROOT, d)))) {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (/console\.(log|info|warn|error|debug)\(/.test(line) && SENSITIVE.test(line)) offenders.push(`${path.relative(ROOT, f)}:${i + 1}`);
    });
  }
  expect(offenders).toEqual([]);
});

it('no console.log in app code at all (use no logging or a reviewed helper)', () => {
  const offenders: string[] = [];
  for (const f of ['mobile/app', 'mobile/components', 'mobile/lib', 'web/app', 'web/components', 'web/lib'].flatMap((d) => files(path.join(ROOT, d)))) {
    fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => { if (/console\.log\(/.test(line)) offenders.push(`${path.relative(ROOT, f)}:${i + 1}`); });
  }
  expect(offenders).toEqual([]);
});
