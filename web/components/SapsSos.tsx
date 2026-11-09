'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { fetchActiveSos } from '../lib/api/saps';
import { LiveMap } from './LiveMap';
import { useLoad } from './useLoad';
import { tokens } from '../theme/tokens';
import { page, container, card, button, errorText, muted } from './ui';

export function ago(iso: string | null, now = Date.now()): string {
  if (!iso) return 'no location yet';
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  return s < 60 ? `${s} s ago` : `${Math.floor(s / 60)} min ago`;
}

/** A4 – SAPS Live SOS. Refreshes every 5 seconds. No design yet: flagged for review. */
export function SapsSos() {
  const { data, error, offline, reload } = useLoad(fetchActiveSos);
  const [, tick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => { reload(); tick((n) => n + 1); }, 5000);
    return () => clearInterval(t);
  }, [reload]);

  const points = useMemo(
    () => (data ?? []).filter((e) => e.lat !== null && e.lng !== null).map((e) => ({ id: e.id, lat: e.lat as number, lng: e.lng as number, label: e.name })),
    [data],
  );

  return (
    <main style={page}>
      <div style={{ ...container, maxWidth: 1024 }}>
        <h1 style={{ margin: 0, fontSize: tokens.font.h2.size }}>Live SOS</h1>
        {offline && <div data-testid="offline-alert" role="alert" style={{ ...card, backgroundColor: tokens.color.info, color: '#fff' }}>You&apos;re offline. Showing the last loaded events.</div>}
        {data === null && !error && !offline && <p data-testid="sos-loading" style={muted}>Loading…</p>}
        {error && <div data-testid="sos-error" style={card}><p style={errorText}>{error}</p><button style={button()} onClick={reload}>Try again</button></div>}
        {data?.length === 0 && <p data-testid="sos-empty" style={muted}>No active SOS events.</p>}
        {data && data.length > 0 && <LiveMap points={points} />}
        {data?.map((e) => (
          <section key={e.id} style={{ ...card, borderLeft: `4px solid ${tokens.color.danger}` }}>
            <strong>{e.name}</strong>
            <div>Last update {ago(e.last_recorded_at)}</div>
            {e.used_cached_location && <div style={errorText}>Last known position (location was off)</div>}
          </section>
        ))}
      </div>
    </main>
  );
}
