/** T-INT-10 (logic with a mocked receiver), T-SEC-20a/20b */
import { webcrypto } from 'node:crypto';
import { TextEncoder } from 'node:util';
import { dispatchSaps, isDue, hmacSha256Hex, MAX_ATTEMPTS, SapsRow } from '../../../supabase/functions/_shared/dispatchSaps';
import { isAuthorizedWebhook } from '../../../supabase/functions/_shared/webhookAuth';

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
  Object.defineProperty(globalThis, 'TextEncoder', { value: TextEncoder, configurable: true });
});

const T0 = new Date('2026-11-09T10:00:00Z');
const row = (over: Partial<SapsRow> = {}): SapsRow => ({
  id: 'q1', kind: 'report', report_id: 'r1', status: 'new', webhook_status: 'pending', webhook_attempts: 0,
  created_at: T0.toISOString(), payload: { case_ref: 'TC-2026-0001', vehicle_plate: 'CA 123 GP', category: 'Physical Assault' }, ...over,
});
const mins = (n: number) => new Date(T0.getTime() + n * 60_000);

function deps(over: Record<string, unknown> = {}) {
  return {
    url: 'http://receiver.test/saps', secret: 's3cret',
    fetch: jest.fn().mockResolvedValue({ ok: true, status: 200 }),
    sign: jest.fn().mockResolvedValue('abc123'),
    update: jest.fn().mockResolvedValue(undefined),
    ...over,
  } as never as Parameters<typeof dispatchSaps>[1] & { fetch: jest.Mock; update: jest.Mock; sign: jest.Mock };
}

it('posts a signed payload with the CRITICAL text and marks it sent', async () => {
  const d = deps();
  expect(await dispatchSaps(row(), d, T0)).toBe('sent');
  const [url, init] = d.fetch.mock.calls[0];
  expect(url).toBe('http://receiver.test/saps');
  expect(init.headers['X-ConnectTransit-Signature']).toBe('sha256=abc123');
  const body = JSON.parse(init.body);
  expect(body.alert).toBe('CRITICAL: High-severity transit incident logged for Vehicle CA 123 GP.');
  expect(body.case_ref).toBe('TC-2026-0001');
  expect(d.sign).toHaveBeenCalledWith('s3cret', init.body);
  expect(d.update).toHaveBeenCalledWith('q1', { webhook_status: 'sent', webhook_attempts: 1 });
});

it('keeps it pending after a failure and retries later', async () => {
  const d = deps({ fetch: jest.fn().mockResolvedValue({ ok: false, status: 500 }) });
  expect(await dispatchSaps(row(), d, T0)).toBe('retry');
  expect(d.update).toHaveBeenCalledWith('q1', { webhook_status: 'pending', webhook_attempts: 1 });
});

it('treats a network error as a failed attempt', async () => {
  const d = deps({ fetch: jest.fn().mockRejectedValue(new Error('down')) });
  expect(await dispatchSaps(row(), d, T0)).toBe('retry');
});

it('marks failed after the 5th failed attempt', async () => {
  const d = deps({ fetch: jest.fn().mockResolvedValue({ ok: false, status: 500 }) });
  const r = row({ webhook_attempts: MAX_ATTEMPTS - 1, created_at: new Date(T0.getTime() - 3_600_000).toISOString() });
  expect(await dispatchSaps(r, d, T0)).toBe('failed');
  expect(d.update).toHaveBeenCalledWith('q1', { webhook_status: 'failed', webhook_attempts: MAX_ATTEMPTS });
});

it('backs off 1, 5, 15 and 30 minutes between attempts', () => {
  expect(isDue(row({ webhook_attempts: 1 }), mins(0.5))).toBe(false);
  expect(isDue(row({ webhook_attempts: 1 }), mins(1))).toBe(true);
  expect(isDue(row({ webhook_attempts: 2 }), mins(5))).toBe(false);
  expect(isDue(row({ webhook_attempts: 2 }), mins(6))).toBe(true);
  expect(isDue(row({ webhook_attempts: 3 }), mins(21))).toBe(true);
  expect(isDue(row({ webhook_attempts: 4 }), mins(50))).toBe(false);
  expect(isDue(row({ webhook_attempts: 4 }), mins(51))).toBe(true);
});

it('skips rows that are already sent, failed or not yet due', async () => {
  const d = deps();
  expect(await dispatchSaps(row({ webhook_status: 'sent' }), d, T0)).toBe('skipped');
  expect(await dispatchSaps(row({ webhook_status: 'failed' }), d, T0)).toBe('skipped');
  expect(await dispatchSaps(row({ webhook_attempts: 1 }), d, T0)).toBe('not_due');
  expect(d.fetch).not.toHaveBeenCalled();
});

it('counts a missing URL or secret as a failed attempt without calling out', async () => {
  const d = deps({ url: undefined });
  expect(await dispatchSaps(row(), d, T0)).toBe('retry');
  expect(d.fetch).not.toHaveBeenCalled();
});

it('computes HMAC-SHA256 hex', async () => {
  // RFC 4231 test case 2
  expect(await hmacSha256Hex('Jefe', 'what do ya want for nothing?'))
    .toBe('5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843');
});

describe('T-SEC-20 webhook secret', () => {
  it('accepts only the exact secret', () => {
    expect(isAuthorizedWebhook('s3cret', 's3cret')).toBe(true);
    expect(isAuthorizedWebhook('s3cre', 's3cret')).toBe(false);
    expect(isAuthorizedWebhook('S3CRET', 's3cret')).toBe(false);
  });
  it('rejects a missing header or an unset secret', () => {
    expect(isAuthorizedWebhook(null, 's3cret')).toBe(false);
    expect(isAuthorizedWebhook('', '')).toBe(false);
    expect(isAuthorizedWebhook('x', undefined)).toBe(false);
  });
});
