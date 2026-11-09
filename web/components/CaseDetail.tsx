'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { fetchAdminCase, fetchCaseMedia, AdminCase, AdminMedia } from '../lib/api/admin';
import { CaseResolution } from './CaseResolution';
import { EvidencePanel, MediaList } from './EvidencePanel';
import { tokens } from '../theme/tokens';
import { page, container, card, muted, errorText } from './ui';

/** A2 – Case detail. Every commuter field is the label "Anonymized Commuter" (BR1). */
export function CaseDetail({ reportId }: { reportId: string }) {
  const [data, setData] = useState<AdminCase | null>(null);
  const [media, setMedia] = useState<AdminMedia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const c = await fetchAdminCase(reportId);
        const m = c ? await fetchCaseMedia(reportId) : [];
        if (!alive) return;
        setData(c);
        setMedia(m);
        setError(c ? null : 'Case not found.');
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [reportId, version]);

  if (loading) return <main style={page}><p data-testid="case-loading" style={muted}>Loading…</p></main>;
  if (!data) return <main style={page}><p role="alert" style={errorText}>{error}</p></main>;

  const original = media.filter((m) => !m.request_id);
  return (
    <main style={page}>
      <div style={container}>
        <section style={card}>
          <h1 style={{ margin: 0, fontSize: tokens.font.h2.size }}>{data.case_ref}</h1>
          <p style={muted}>Status: {data.status}</p>
          <div><span style={muted}>Vehicle</span><div data-testid="case-plate" style={{ fontWeight: 700 }}>{data.vehicle_plate}</div></div>
          <div><span style={muted}>Category</span><div>{data.category === 'Other' && data.custom_category_text ? data.custom_category_text : data.category}</div></div>
          <div><span style={muted}>Operator</span><div>{data.unlisted_entity_name ?? data.organization_name}</div></div>
          <div data-testid="case-time"><span style={muted}>Incident time</span><div>{new Date(data.incident_at).toLocaleString('en-ZA')}</div></div>
          {data.location_text && <div><span style={muted}>Location</span><div>{data.location_text}</div></div>}
          <div><span style={muted}>Reported by</span><div style={{ fontWeight: 600 }}>Anonymized Commuter</div></div>
          <p style={{ margin: 0 }}>{data.description}</p>
        </section>

        <section style={card}>
          <h2 style={{ margin: 0, fontSize: tokens.font.h2.size }}>Incident Evidence</h2>
          {original.length === 0 ? <p style={muted}>No attachments.</p> : <MediaList media={original} testPrefix="media" />}
        </section>

        <CaseResolution caseData={data} onSaved={reload} />
        <EvidencePanel caseData={data} media={media} onChanged={reload} />
      </div>
    </main>
  );
}
