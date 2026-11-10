'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from './DataTable';
import { fetchAdminCases, isNetworkError, AdminCase, PAGE_SIZE } from '../lib/api/admin';
import { tokens } from '../theme/tokens';
import { page, container, card, input, button, errorText, muted } from './ui';

const STATUSES = ['Submitted', 'Under Review', 'Escalated', 'Resolved', 'Dismissed'];
const COLUMNS = [
  { key: 'caseRef', label: 'Case Ref', sortable: true },
  { key: 'plate', label: 'Plate', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'priority', label: 'Priority', sortable: false },
  { key: 'date', label: 'Date', sortable: true },
];

/** A1 – Admin case list: only this organization's cases (RLS), no commuter fields. */
export function AdminDashboard() {
  const router = useRouter();
  const [cases, setCases] = useState<AdminCase[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [filter, setFilter] = useState('');

  const [limit, setLimit] = useState(PAGE_SIZE);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await fetchAdminCases(limit);
        if (!alive) return;
        setCases(list);
        setError(null);
        setOffline(false);
      } catch (e) {
        if (!alive) return;
        if (isNetworkError(e)) setOffline(true);
        else setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
        setCases((c) => c ?? []);
      }
    })();
    return () => { alive = false; };
  }, [version, limit]);

  useEffect(() => {
    const off = () => setOffline(true);
    window.addEventListener('online', reload);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', reload); window.removeEventListener('offline', off); };
  }, [reload]);

  const rows = useMemo(
    () => (cases ?? [])
      .filter((c) => !filter || c.status === filter)
      .map((c) => ({
        id: c.id,
        caseRef: c.case_ref,
        plate: c.vehicle_plate,
        category: c.category,
        status: c.status,
        priority: c.status === 'Escalated' || c.is_escalated ? 'Urgent' : '',
        date: c.created_at.slice(0, 16).replace('T', ' '),
      })),
    [cases, filter],
  );

  return (
    <main style={page}>
      <div style={{ ...container, maxWidth: 1024 }}>
        <h1 style={{ margin: 0, fontSize: tokens.font.h2.size }}>Cases</h1>
        {offline && <div data-testid="offline-alert" role="alert" style={{ ...card, backgroundColor: tokens.color.info, color: '#fff' }}>You&apos;re offline. Showing the last loaded cases.</div>}
        <select data-testid="status-filter" aria-label="Filter by status" style={{ ...input, maxWidth: 240 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {cases === null && <p data-testid="admin-loading" style={muted}>Loading cases…</p>}
        {error && (
          <div data-testid="admin-error" style={card}>
            <p style={errorText}>{error}</p>
            <button style={button()} onClick={reload}>Try again</button>
          </div>
        )}
        {cases !== null && !error && rows.length === 0 && !offline && <p data-testid="admin-empty" style={muted}>No cases found.</p>}
        {rows.length > 0 && (
          <DataTable columns={COLUMNS} rows={rows} onRowClick={(r) => router.push(`/admin/cases/${r.id}`)} />
        )}
        {cases && cases.length >= limit && (
          <button data-testid="load-more" style={button()} onClick={() => setLimit((n) => n + PAGE_SIZE)}>Load more</button>
        )}
      </div>
    </main>
  );
}
