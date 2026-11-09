'use client';
import React, { useEffect, useState } from 'react';
import { fetchShared, SharedLocation } from '../lib/api/sos';
import { LiveMap } from './LiveMap';
import { tokens } from '../theme/tokens';
import { page, container, card, muted } from './ui';

const DAY_MS = 24 * 3600 * 1000;

/** P1 – public live location. Shows coordinates only; refreshes every 10 seconds. No design yet: flagged for review. */
export function LiveLocation({ token }: { token: string }) {
  const [loc, setLoc] = useState<SharedLocation | null | undefined>(undefined);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetchShared(token);
        if (!alive) return;
        setLoc(r);
        setStale(r?.recorded_at ? Date.now() - new Date(r.recorded_at).getTime() > DAY_MS : false);
      } catch {
        if (alive) setLoc((prev) => prev ?? null);
      }
    };
    load();
    const t = setInterval(load, 10_000);
    return () => { alive = false; clearInterval(t); };
  }, [token]);

  const active = !!loc && loc.status === 'active' && loc.lat !== null && loc.lng !== null && !stale;

  return (
    <main style={page}>
      <div style={container}>
        {loc === undefined && <p style={muted}>Loading…</p>}
        {loc !== undefined && !active && <div style={card}><p style={{ margin: 0 }}>This link is no longer active.</p></div>}
        {active && loc && (
          <section style={card}>
            <h1 style={{ margin: 0, fontSize: tokens.font.h2.size }}>Live location</h1>
            <LiveMap points={[{ id: 'sos', lat: loc.lat as number, lng: loc.lng as number, label: 'Current location' }]} />
            <p style={muted}>Updated {loc.recorded_at ? new Date(loc.recorded_at).toLocaleTimeString('en-ZA') : ''}</p>
          </section>
        )}
      </div>
    </main>
  );
}
