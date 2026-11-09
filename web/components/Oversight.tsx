'use client';
import React, { useState } from 'react';
import { fetchOversightCases, fetchOrganizations, tagOversightReport } from '../lib/api/system';
import { useLoad } from './useLoad';
import { tokens } from '../theme/tokens';
import { page, container, card, input, button, errorText, muted } from './ui';

/** A6 – Oversight Queue: reports filed under "Other/Unregistered", to be tagged with a real organization. */
export function Oversight() {
  const cases = useLoad(fetchOversightCases);
  const orgs = useLoad(fetchOrganizations);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const tag = async (reportId: string) => {
    setActionError(null);
    try {
      await tagOversightReport(reportId, choice[reportId]);
      cases.reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    }
  };

  const real = (orgs.data ?? []).filter((o) => !o.is_oversight);
  return (
    <main style={page}>
      <div style={container}>
        <h1 style={{ margin: 0, fontSize: tokens.font.h2.size }}>Oversight Queue</h1>
        {cases.offline && <div data-testid="offline-alert" role="alert" style={{ ...card, backgroundColor: tokens.color.info, color: '#fff' }}>You&apos;re offline.</div>}
        {cases.data === null && !cases.error && !cases.offline && <p data-testid="oversight-loading" style={muted}>Loading…</p>}
        {cases.error && <div data-testid="oversight-error" style={card}><p style={errorText}>{cases.error}</p><button style={button()} onClick={cases.reload}>Try again</button></div>}
        {actionError && <p role="alert" style={errorText}>{actionError}</p>}
        {cases.data?.length === 0 && <p data-testid="oversight-empty" style={muted}>No reports waiting.</p>}
        {cases.data?.map((c) => (
          <section key={c.id} style={card}>
            <strong>{c.case_ref}</strong>
            <div>Operator named by commuter: <strong>{c.unlisted_entity_name}</strong></div>
            <div>Vehicle: {c.vehicle_plate} · {c.category}</div>
            <div>{c.description}</div>
            <select data-testid={`tag-org-${c.id}`} style={input} value={choice[c.id] ?? ''} onChange={(e) => setChoice((x) => ({ ...x, [c.id]: e.target.value }))}>
              <option value="">Select organization…</option>
              {real.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <button data-testid={`tag-btn-${c.id}`} disabled={!choice[c.id]} style={button(!choice[c.id])} onClick={() => tag(c.id)}>Tag organization</button>
          </section>
        ))}
      </div>
    </main>
  );
}
