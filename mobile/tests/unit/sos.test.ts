/** T-BR11-1 tap rule, T-BR11-2 10 s interval, T-US4-2 cached location, T-US4-4 offline queue */
import { createTapCounter, SOS_TAP_WINDOW_MS, SOS_LOCATION_INTERVAL_MS, SOS_STOP_HOLD_MS } from '../../lib/rules/sos';
import { createSosSession } from '../../lib/sosSession';

describe('T-BR11-1 tap counter', () => {
  it('constants match BR11', () => {
    expect(SOS_TAP_WINDOW_MS).toBe(2500);
    expect(SOS_LOCATION_INTERVAL_MS).toBe(10_000);
    expect(SOS_STOP_HOLD_MS).toBe(3000);
  });
  it('3 taps within 2.5 s trigger', () => {
    const c = createTapCounter();
    expect(c.tap(0)).toEqual({ count: 1, triggered: false });
    expect(c.tap(1000)).toEqual({ count: 2, triggered: false });
    expect(c.tap(2000)).toEqual({ count: 3, triggered: true });
  });
  it('2 taps do not trigger', () => {
    const c = createTapCounter();
    c.tap(0);
    expect(c.tap(500).triggered).toBe(false);
  });
  it('a 3rd tap after 2.5 s does not trigger', () => {
    const c = createTapCounter();
    c.tap(0); c.tap(1000);
    expect(c.tap(2600)).toEqual({ count: 2, triggered: false });
  });
  it('the window restarts after a miss', () => {
    const c = createTapCounter();
    c.tap(0); c.tap(1000); c.tap(3000); // miss
    c.tap(10_000);
    c.tap(10_500);
    expect(c.tap(11_000).triggered).toBe(true);
  });
  it('resets after triggering', () => {
    const c = createTapCounter();
    c.tap(0); c.tap(100); c.tap(200);
    expect(c.tap(300)).toEqual({ count: 1, triggered: false });
  });
});

describe('SOS session', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function make(over: { cached?: boolean; noPosition?: boolean } = {}) {
    const api = {
      startSos: jest.fn().mockResolvedValue({ id: 'e1', share_token: 'tok' }),
      sendLocation: jest.fn().mockResolvedValue(undefined),
      stopSos: jest.fn().mockResolvedValue(undefined),
    };
    const getPosition = jest.fn().mockResolvedValue(over.noPosition ? null : { lat: -33.9, lng: 18.4, cached: !!over.cached });
    const session = createSosSession({ api, getPosition });
    return { api, getPosition, session };
  }

  it('starts the SOS with the position and becomes active', async () => {
    const { api, session } = make();
    await session.start(Date.now());
    expect(api.startSos).toHaveBeenCalledWith(expect.objectContaining({ lat: -33.9, lng: 18.4, usedCachedLocation: false }));
    expect(session.getState()).toMatchObject({ status: 'active', eventId: 'e1', shareToken: 'tok', offline: false });
    await session.stop();
  });

  it('T-BR11-2 sends a location every 10 seconds, not sooner', async () => {
    const { api, session } = make();
    await session.start(Date.now());
    await jest.advanceTimersByTimeAsync(9_999);
    expect(api.sendLocation).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(api.sendLocation).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(20_000);
    expect(api.sendLocation).toHaveBeenCalledTimes(3);
    expect(api.sendLocation).toHaveBeenLastCalledWith('e1', -33.9, 18.4);
    await session.stop();
  });

  it('T-US4-2 flags a cached position', async () => {
    const { api, session } = make({ cached: true });
    await session.start(Date.now());
    expect(api.startSos).toHaveBeenCalledWith(expect.objectContaining({ usedCachedLocation: true }));
    expect(session.getState().usedCached).toBe(true);
    await session.stop();
  });

  it('still starts when no position exists at all', async () => {
    const { api, session } = make({ noPosition: true });
    await session.start(Date.now());
    expect(api.startSos).toHaveBeenCalledWith(expect.objectContaining({ lat: null, lng: null }));
    expect(session.getState().noLocation).toBe(true);
    await session.stop();
  });

  it('stop ends the SOS and the timer', async () => {
    const { api, session } = make();
    await session.start(Date.now());
    await session.stop();
    expect(api.stopSos).toHaveBeenCalledWith('e1');
    expect(session.getState().status).toBe('stopped');
    await jest.advanceTimersByTimeAsync(30_000);
    expect(api.sendLocation).not.toHaveBeenCalled();
  });

  it('T-US4-4 queues when offline and sends the start and the locations on reconnect', async () => {
    const { api, session } = make();
    api.startSos.mockRejectedValueOnce(new Error('Network request failed'));
    await session.start(Date.now());
    expect(session.getState()).toMatchObject({ status: 'queued', offline: true });
    await jest.advanceTimersByTimeAsync(20_000);
    expect(api.sendLocation).not.toHaveBeenCalled();
    await session.onReconnect();
    expect(api.startSos).toHaveBeenCalledTimes(2);
    expect(api.sendLocation).toHaveBeenCalledTimes(2);
    expect(session.getState()).toMatchObject({ status: 'active', offline: false });
    await session.stop();
  });

  it('keeps locations that fail to send and resends them on reconnect', async () => {
    const { api, session } = make();
    await session.start(Date.now());
    api.sendLocation.mockRejectedValueOnce(new Error('Network request failed'));
    await jest.advanceTimersByTimeAsync(10_000);
    expect(session.getState().offline).toBe(true);
    await session.onReconnect();
    expect(api.sendLocation).toHaveBeenCalledTimes(2);
    expect(session.getState().offline).toBe(false);
    await session.stop();
  });

  it('stopping while still queued never sends anything', async () => {
    const { api, session } = make();
    api.startSos.mockRejectedValue(new Error('Network request failed'));
    await session.start(Date.now());
    await session.stop();
    await session.onReconnect();
    expect(api.startSos).toHaveBeenCalledTimes(1);
    expect(session.getState().status).toBe('stopped');
  });
});
