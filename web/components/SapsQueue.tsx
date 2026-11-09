'use client';
import React, { useState } from 'react';
import { fetchSapsQueue, acknowledgeEscalation } from '../lib/api/saps';
import { useLoad } from './useLoad';
import { tokens } from '../theme/tokens';
import { page, container, card, button, errorText, muted } from './ui';

/** A3 – SAPS Escalation Queue. Shows the reporter's name and ID number (BR2: the only place they leave the system). */
export function SapsQueue() {
  const { data, error, offline, reload } = useLoad(fetchSapsQueue);
  const [actionError, setActionError] = useState<string | null>(null);

  const ack = async (id: string) => {
    setActionError(null);
    try {
      await acknowledgeEscalation(id);
      reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    }
  };

  return (
    <main style={page}>
      <div style={container}>
        <h1 style={{ margin: 0, fontSize: tokens.font.h2.size }}>SAPS Escalation Queue</h1>
        {offline && <div data-testid="offline-alert" role="alert" style={{ ...card, backgroundColor: tokens.color.info, color: '#fff' }}>You&apos;re offline. Showing the last loaded items.</div>}
        {data === null && !error && !offline && <p data-testid="saps-loading" style={muted}>Loading…</p>}
        {error && <div data-testid="saps-error" style={card}><p style={errorText}>{error}</p><button style={button()} onClick={reload}>Try again</button></div>}
        {actionError && <p role="alert" style={errorText}>{actionError}</p>}
        {data?.length === 0 && <p data-testid="saps-empty" style={muted}>No escalated reports.</p>}
        {data?.map((it) => (
          <section key={it.id} style={card} data-testid={`saps-item-${it.id}`}>
            <strong>{it.payload.case_ref}</strong>
            <div>Vehicle: {it.payload.vehicle_plate}</div>
            <div>Category: {it.payload.category}</div>
            <div>{it.payload.description}</div>
            {it.payload.location_text && <div>Location: {it.payload.location_text}</div>}
            {it.payload.saps_case_number && <div>SAPS case number: {it.payload.saps_case_number}</div>}
            <div>Reporter: {it.payload.reporter_full_name ?? 'Removed (retention period ended)'}</div>
            <div>ID number: {it.payload.reporter_id_number ?? 'Removed (retention period ended)'}</div>
            {it.webhook_status === 'failed' && <p style={errorText}>Delivery to SAPS failed</p>}
            {it.status === 'acknowledged'
              ? <span style={{ color: tokens.color.success, fontWeight: 700 }}>Acknowledged</span>
              : <button data-testid={`saps-ack-${it.id}`} style={button()} onClick={() => ack(it.id)}>Acknowledge</button>}
          </section>
        ))}
      </div>
    </main>
  );
}
