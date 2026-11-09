/**
 * The running SOS: start (queued if offline), a location every 10 s, resend on reconnect, stop.
 * State lives in memory; if the app is killed the SOS must be restarted (flagged in the plan).
 */
import { useSyncExternalStore } from 'react';
import * as defaultApi from './api/sos';
import { getPosition as defaultGetPosition, Position } from './sosLocation';
import { SOS_LOCATION_INTERVAL_MS } from './rules/sos';
import { backgroundLocation, setBackgroundEventId } from './sosTask';

export interface SosState {
  status: 'idle' | 'starting' | 'active' | 'queued' | 'stopped';
  eventId: string | null;
  shareToken: string | null;
  usedCached: boolean;
  noLocation: boolean;
  offline: boolean;
}

export interface SosApi {
  startSos: typeof defaultApi.startSos;
  sendLocation: typeof defaultApi.sendLocation;
  stopSos: typeof defaultApi.stopSos;
}

interface Deps {
  api: SosApi;
  getPosition: () => Promise<Position | null>;
  newId?: () => string;
  /** Keeps location coming while the app is in the background (device only). */
  background?: { start(): Promise<void>; stop(): Promise<void> };
}

const initial: SosState = { status: 'idle', eventId: null, shareToken: null, usedCached: false, noLocation: false, offline: false };

function randomId(): string {
  return require('expo-crypto').randomUUID();
}

export function createSosSession(deps: Deps) {
  const newId = deps.newId ?? randomId;
  let state: SosState = initial;
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setInterval> | null = null;
  let queue: Array<{ lat: number; lng: number }> = [];
  let startPayload: { id: string; lat: number | null; lng: number | null; usedCachedLocation: boolean; tappedAt: number } | null = null;
  let pendingStop = false;

  const set = (patch: Partial<SosState>) => { state = { ...state, ...patch }; listeners.forEach((l) => l()); };

  async function flush(): Promise<void> {
    while (state.eventId && queue.length > 0) {
      const next = queue[0];
      try {
        await deps.api.sendLocation(state.eventId, next.lat, next.lng);
        queue.shift();
      } catch {
        set({ offline: true });
        return;
      }
    }
    if (state.eventId && state.status !== 'stopped') set({ offline: false });
  }

  async function attemptStart(): Promise<void> {
    if (!startPayload) return;
    try {
      const r = await deps.api.startSos({ ...startPayload, clientElapsedMs: Date.now() - startPayload.tappedAt });
      set({ status: 'active', eventId: r.id, shareToken: r.share_token, offline: false });
      setBackgroundEventId(r.id);
      deps.background?.start().catch(() => undefined);
      await flush();
    } catch {
      set({ status: 'queued', offline: true });
    }
  }

  async function tick(): Promise<void> {
    const pos = await deps.getPosition();
    if (!pos) return;
    if (pos.cached) set({ usedCached: true });
    if (state.eventId && queue.length === 0) {
      try {
        await deps.api.sendLocation(state.eventId, pos.lat, pos.lng);
        return;
      } catch {
        set({ offline: true });
      }
    }
    queue.push({ lat: pos.lat, lng: pos.lng });
  }

  return {
    getState: () => state,
    subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },

    async start(tappedAt: number): Promise<void> {
      if (state.status === 'starting' || state.status === 'active' || state.status === 'queued') return;
      queue = [];
      pendingStop = false;
      set({ ...initial, status: 'starting' });
      const pos = await deps.getPosition();
      startPayload = { id: newId(), lat: pos?.lat ?? null, lng: pos?.lng ?? null, usedCachedLocation: !!pos?.cached, tappedAt };
      set({ usedCached: !!pos?.cached, noLocation: !pos });
      timer = setInterval(() => { void tick(); }, SOS_LOCATION_INTERVAL_MS);
      await attemptStart();
    },

    async onReconnect(): Promise<void> {
      if (state.status === 'stopped' && !state.eventId) return;
      if (!state.eventId) { await attemptStart(); return; }
      if (pendingStop) {
        try { await deps.api.stopSos(state.eventId); pendingStop = false; } catch { /* try again later */ }
        return;
      }
      await flush();
    },

    async stop(): Promise<void> {
      if (timer) { clearInterval(timer); timer = null; }
      deps.background?.stop().catch(() => undefined);
      const id = state.eventId;
      queue = [];
      set({ status: 'stopped', offline: false });
      if (id) {
        try { await deps.api.stopSos(id); } catch { pendingStop = true; set({ offline: true }); }
      }
    },
  };
}

export const sosSession = createSosSession({ api: defaultApi, getPosition: defaultGetPosition, background: backgroundLocation });

export function useSos(): SosState {
  return useSyncExternalStore(sosSession.subscribe, sosSession.getState, sosSession.getState);
}
