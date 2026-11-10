/** OP12 server side: sos-start core */
import { startSosEvent, SosStartDeps } from '../../../supabase/functions/_shared/sosStart';

function deps(over: Partial<SosStartDeps> = {}) {
  let t = 1000;
  return {
    userId: jest.fn().mockResolvedValue('u1'),
    insert: jest.fn().mockResolvedValue({ id: 'e1', share_token: 'tok' }),
    now: () => (t += 40),
    ...over,
  } as SosStartDeps & Record<string, jest.Mock>;
}

it('inserts the event for the caller with dispatch_ms = client time + server time', async () => {
  const d = deps();
  const r = await startSosEvent({ id: 'e1', lat: -33.9, lng: 18.4, used_cached_location: false, client_elapsed_ms: 300 }, d);
  expect(r).toEqual({ status: 200, body: { id: 'e1', share_token: 'tok' } });
  expect(d.insert).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1', user_id: 'u1', last_lat: -33.9, last_lng: 18.4, used_cached_location: false, dispatch_ms: 340 }));
});

it('rejects a caller who is not signed in', async () => {
  const d = deps({ userId: jest.fn().mockResolvedValue(null) });
  expect(await startSosEvent({ id: 'e1' }, d)).toMatchObject({ status: 401 });
  expect(d.insert).not.toHaveBeenCalled();
});

it('rejects an invalid id or out-of-range coordinates', async () => {
  const d = deps();
  expect(await startSosEvent({ id: '' }, d)).toMatchObject({ status: 400 });
  expect(await startSosEvent({ id: 'e1', lat: 123, lng: 0 }, d)).toMatchObject({ status: 400 });
});

it('is safe to repeat: a second start with the same id returns the same event', async () => {
  const d = deps({ insert: jest.fn().mockRejectedValue(Object.assign(new Error('dup'), { code: '23505' })), findExisting: jest.fn().mockResolvedValue({ id: 'e1', share_token: 'tok' }) });
  expect(await startSosEvent({ id: 'e1' }, d)).toEqual({ status: 200, body: { id: 'e1', share_token: 'tok' } });
});
