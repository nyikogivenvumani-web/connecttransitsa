'use client';
import React, { useState } from 'react';
import { updateCase, AdminCase } from '../lib/api/admin';
import { validateDecision, DECISION_MAX } from '../lib/rules/case';
import { tokens } from '../theme/tokens';
import { card, input, button, errorText, muted } from './ui';

const OPTIONS = ['Under Review', 'Resolved', 'Dismissed'] as const;

/** A2 – Update case status and record the official decision (BR5, BR10). */
export function CaseResolution({ caseData, onSaved }: { caseData: AdminCase; onSaved: () => void }) {
  const [status, setStatus] = useState<string>(caseData.status === 'Submitted' || caseData.status === 'Escalated' ? '' : caseData.status);
  const [summary, setSummary] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (caseData.status === 'Resolved' || caseData.status === 'Dismissed') {
    return (
      <section style={card}>
        <h2 style={{ margin: 0, fontSize: tokens.font.h2.size }}>Official Decision</h2>
        <p style={muted}>This case has already been decided.</p>
        <strong>{caseData.admin_decision}</strong>
        <p style={{ margin: 0 }}>{caseData.decision_reasoning}</p>
      </section>
    );
  }

  const errors = status ? validateDecision(status, summary, reasoning) : {};
  const needsDecision = status === 'Resolved' || status === 'Dismissed';
  const invalid = !status || status === caseData.status || Object.keys(errors).length > 0;

  const save = async () => {
    if (invalid) return;
    setBusy(true);
    setError(null);
    try {
      await updateCase(caseData.id, status, needsDecision ? summary.trim() : null, needsDecision ? reasoning.trim() : null);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section style={card}>
      <h2 style={{ margin: 0, fontSize: tokens.font.h2.size }}>Update Case Status</h2>
      <div style={{ display: 'flex', gap: tokens.space[1], flexWrap: 'wrap' }}>
        {OPTIONS.map((o) => (
          <button key={o} data-testid={`status-option-${o}`} aria-pressed={status === o}
            onClick={() => setStatus(o)}
            style={{ ...button(), backgroundColor: status === o ? tokens.color.primary : tokens.color.border, color: status === o ? '#fff' : tokens.color.text }}>
            {o}
          </button>
        ))}
      </div>
      {needsDecision && (
        <>
          <label>Decision summary *
            <input data-testid="decision-summary" style={input} maxLength={DECISION_MAX} value={summary} onChange={(e) => setSummary(e.target.value)} />
          </label>
          {errors.summary && summary.length > 0 && <p style={errorText}>{errors.summary}</p>}
          <label>Decision rationale * <span style={muted}>({reasoning.length} chars, min 20)</span>
            <textarea data-testid="decision-reasoning" rows={5} style={input} value={reasoning} onChange={(e) => setReasoning(e.target.value)} />
          </label>
          {errors.reasoning && reasoning.length > 0 && <p data-testid="reason-error" style={errorText}>{errors.reasoning}</p>}
        </>
      )}
      {error && <p role="alert" style={errorText}>{error}</p>}
      <button data-testid="decision-save" disabled={invalid || busy} style={button(invalid || busy)} onClick={save}>
        {busy ? 'Saving…' : 'Save Decision'}
      </button>
    </section>
  );
}
