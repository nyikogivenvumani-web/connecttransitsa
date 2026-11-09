/**
 * Core of dispatch-saps (no Deno imports so Jest can test it).
 * Posts one saps_queue row to the SAPS endpoint with an HMAC-SHA256 signature.
 * Up to 5 attempts, spaced 1, 5, 15 and 30 minutes apart (measured from created_at); then webhook_status = failed.
 */
export const MAX_ATTEMPTS = 5;
/** Minutes to wait before attempt n (n = 0 is the first attempt). */
export const RETRY_DELAYS_MIN = [0, 1, 5, 15, 30];

export interface SapsRow {
  id: string;
  kind: 'report' | 'sos';
  report_id: string | null;
  payload: Record<string, unknown>;
  status: string;
  webhook_status: 'pending' | 'sent' | 'failed';
  webhook_attempts: number;
  created_at: string;
}

export interface SapsDeps {
  fetch: typeof fetch;
  url: string | undefined;
  secret: string | undefined;
  sign(secret: string, body: string): Promise<string>;
  update(id: string, patch: { webhook_status: 'pending' | 'sent' | 'failed'; webhook_attempts: number }): Promise<void>;
}

export async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function criticalText(row: SapsRow): string {
  if (row.kind === 'sos') return 'CRITICAL: Silent SOS activated by a commuter.';
  return `CRITICAL: High-severity transit incident logged for Vehicle ${String(row.payload.vehicle_plate ?? '')}.`;
}

export function buildBody(row: SapsRow): string {
  return JSON.stringify({ id: row.id, kind: row.kind, alert: criticalText(row), ...row.payload });
}

/** True when the next attempt is allowed at `now`. */
export function isDue(row: SapsRow, now: Date): boolean {
  if (row.webhook_attempts >= MAX_ATTEMPTS) return false;
  const wait = RETRY_DELAYS_MIN.slice(0, row.webhook_attempts + 1).reduce((a, b) => a + b, 0);
  return now.getTime() >= new Date(row.created_at).getTime() + wait * 60_000;
}

export async function dispatchSaps(row: SapsRow, d: SapsDeps, now: Date = new Date()): Promise<'sent' | 'retry' | 'failed' | 'skipped' | 'not_due'> {
  if (row.webhook_status !== 'pending') return 'skipped';
  if (!isDue(row, now)) return 'not_due';

  let ok = false;
  if (d.url && d.secret) {
    try {
      const body = buildBody(row);
      const signature = await d.sign(d.secret, body);
      const res = await d.fetch(d.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-ConnectTransit-Signature': `sha256=${signature}` },
        body,
      });
      ok = res.ok;
    } catch {
      ok = false;
    }
  }

  const attempts = row.webhook_attempts + 1;
  const status = ok ? 'sent' : attempts >= MAX_ATTEMPTS ? 'failed' : 'pending';
  await d.update(row.id, { webhook_status: status, webhook_attempts: attempts });
  return ok ? 'sent' : status === 'failed' ? 'failed' : 'retry';
}
