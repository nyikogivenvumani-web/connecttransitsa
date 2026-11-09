/**
 * Core of dispatch-notification (no Deno imports so Jest can test it).
 * One notification_outbox row → Expo Push or Clickatell SMS → status sent/failed.
 * The body text is written by the database trigger and is sent unchanged (PRD 4.5).
 */
export interface OutboxRow {
  id: string;
  user_id: string;
  report_id: string | null;
  channel: 'push' | 'sms';
  body: string;
  status: string;
}

export interface DispatchDeps {
  getTokens(userId: string): Promise<string[]>;
  getPhone(userId: string): Promise<string | null>;
  getCaseRef(reportId: string | null): Promise<string | null>;
  markStatus(id: string, status: 'sent' | 'failed'): Promise<void>;
  fetch: typeof fetch;
  clickatellKey: string | undefined;
}

export const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
export const CLICKATELL_URL = 'https://platform.clickatell.com/messages/http/send';

async function send(row: OutboxRow, d: DispatchDeps): Promise<boolean> {
  if (row.channel === 'push') {
    const tokens = await d.getTokens(row.user_id);
    if (tokens.length === 0) return false;
    const caseRef = await d.getCaseRef(row.report_id);
    const res = await d.fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokens.map((to) => ({ to, body: row.body, data: { case_ref: caseRef } }))),
    });
    return res.ok;
  }
  const phone = await d.getPhone(row.user_id);
  if (!phone || !d.clickatellKey) return false;
  const res = await d.fetch(CLICKATELL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: d.clickatellKey },
    body: JSON.stringify({ to: [phone], content: row.body }),
  });
  return res.ok;
}

export async function dispatchNotification(row: OutboxRow, d: DispatchDeps): Promise<'sent' | 'failed' | 'skipped'> {
  if (row.status !== 'pending') return 'skipped';
  let ok = false;
  try {
    ok = await send(row, d);
  } catch {
    ok = false;
  }
  const status = ok ? 'sent' : 'failed';
  await d.markStatus(row.id, status);
  return status;
}
