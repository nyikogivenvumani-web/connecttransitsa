/** T-INT-9 – dispatch-notification core with Expo Push and Clickatell mocked */
import { dispatchNotification } from '../../../supabase/functions/_shared/dispatch';

const BODY = 'Update on Case #TC-2026-0001: Status changed to Resolved. Tap to view formal decision.';
const row = (channel: 'push' | 'sms') => ({ id: 'n1', user_id: 'u1', report_id: 'r1', channel, body: BODY, status: 'pending' });

function deps(over: Record<string, unknown> = {}) {
  return {
    getTokens: jest.fn().mockResolvedValue(['ExponentPushToken[abc]']),
    getPhone: jest.fn().mockResolvedValue('+27821234567'),
    getCaseRef: jest.fn().mockResolvedValue('TC-2026-0001'),
    markStatus: jest.fn().mockResolvedValue(undefined),
    fetch: jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [{ status: 'ok' }] }) }),
    clickatellKey: 'key',
    ...over,
  } as any;
}

it('sends push with the exact PRD text and case_ref data, then marks sent', async () => {
  const d = deps();
  await dispatchNotification(row('push'), d);
  const [url, init] = d.fetch.mock.calls[0];
  expect(url).toBe('https://exp.host/--/api/v2/push/send');
  const msg = JSON.parse(init.body)[0];
  expect(msg).toMatchObject({ to: 'ExponentPushToken[abc]', body: BODY, data: { case_ref: 'TC-2026-0001' } });
  expect(d.markStatus).toHaveBeenCalledWith('n1', 'sent');
});

it('sends SMS through Clickatell with the exact text', async () => {
  const d = deps();
  await dispatchNotification(row('sms'), d);
  const [url, init] = d.fetch.mock.calls[0];
  expect(url).toContain('clickatell.com');
  expect(JSON.parse(init.body)).toEqual({ to: ['+27821234567'], content: BODY });
  expect(d.markStatus).toHaveBeenCalledWith('n1', 'sent');
});

it('marks failed when the provider errors', async () => {
  const d = deps({ fetch: jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }) });
  await dispatchNotification(row('sms'), d);
  expect(d.markStatus).toHaveBeenCalledWith('n1', 'failed');
});

it('marks failed when fetch throws, or there is no token or phone', async () => {
  let d = deps({ fetch: jest.fn().mockRejectedValue(new Error('down')) });
  await dispatchNotification(row('push'), d);
  expect(d.markStatus).toHaveBeenCalledWith('n1', 'failed');
  d = deps({ getTokens: jest.fn().mockResolvedValue([]) });
  await dispatchNotification(row('push'), d);
  expect(d.markStatus).toHaveBeenCalledWith('n1', 'failed');
  d = deps({ getPhone: jest.fn().mockResolvedValue(null) });
  await dispatchNotification(row('sms'), d);
  expect(d.markStatus).toHaveBeenCalledWith('n1', 'failed');
});

it('ignores rows that are not pending', async () => {
  const d = deps();
  await dispatchNotification({ ...row('push'), status: 'sent' }, d);
  expect(d.fetch).not.toHaveBeenCalled();
});
