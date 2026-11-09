'use client';
import React, { useState } from 'react';
import { requestEvidence, cancelEvidenceRequest, AdminCase, AdminMedia } from '../lib/api/admin';
import { validateEvidenceMessage, EVIDENCE_MAX } from '../lib/rules/case';
import { tokens } from '../theme/tokens';
import { card, input, button, errorText, muted } from './ui';

export function MediaList({ media, testPrefix }: { media: AdminMedia[]; testPrefix: string }) {
  const photos = media.filter((m) => m.kind === 'photo');
  const videos = media.filter((m) => m.kind === 'video');
  const audio = media.filter((m) => m.kind === 'audio');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space[1] }}>
      {photos.map((m, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={m.id} data-testid={`${testPrefix}-photo-${i}`} src={m.url} alt={`Evidence photo ${i + 1}`} style={{ maxWidth: '100%', borderRadius: 8 }} />
      ))}
      {videos.map((m, i) => <video key={m.id} data-testid={`${testPrefix}-video-${i}`} src={m.url} controls style={{ maxWidth: '100%' }} />)}
      {audio.map((m, i) => <audio key={m.id} data-testid={`${testPrefix}-audio-${i}`} src={m.url} controls />)}
    </div>
  );
}

/** A2 – "Request Further Evidence": send, see the latest request, cancel, view the reply. The commuter stays anonymous (BR12). */
export function EvidencePanel({ caseData, media, onChanged }: { caseData: AdminCase; media: AdminMedia[]; onChanged: () => void }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const status = caseData.evidence_request_status;
  const canRequest = caseData.status === 'Under Review' || caseData.status === 'Escalated';
  const validation = message ? validateEvidenceMessage(message) : null;
  const invalid = validateEvidenceMessage(message) !== null;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setMessage('');
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const replyMedia = media.filter((m) => m.request_id && m.request_id === caseData.evidence_request_id);

  return (
    <section style={card}>
      <h2 style={{ margin: 0, fontSize: tokens.font.h2.size }}>Further Evidence</h2>

      {caseData.evidence_request_message && (
        <div>
          <p style={muted}>Latest request ({status === 'closed_by_decision' ? 'closed by decision' : status})</p>
          <p style={{ margin: 0 }}>{caseData.evidence_request_message}</p>
        </div>
      )}

      {status === 'answered' && (
        <div>
          <strong>Evidence received</strong>
          <p style={muted}>From: <span>Anonymized Commuter</span></p>
          {caseData.evidence_reply_note && <p style={{ margin: 0 }}>{caseData.evidence_reply_note}</p>}
          <MediaList media={replyMedia} testPrefix="evidence" />
        </div>
      )}

      {status === 'open' && (
        <>
          <p style={muted}>A request is already open for this case.</p>
          <button data-testid="evidence-cancel" disabled={busy} style={button(busy)} onClick={() => run(() => cancelEvidenceRequest(caseData.evidence_request_id!))}>
            Cancel request
          </button>
        </>
      )}

      {status !== 'open' && !canRequest && <p style={muted}>Evidence can be requested once the case is Under Review.</p>}

      {status !== 'open' && canRequest && (
        <>
          <label>Request Further Evidence
            <textarea data-testid="evidence-message" rows={3} style={input} maxLength={EVIDENCE_MAX + 50} value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>
          {validation && <p style={errorText}>{validation}</p>}
          <button data-testid="evidence-send" disabled={invalid || busy} style={button(invalid || busy)} onClick={() => run(() => requestEvidence(caseData.id, message.trim()))}>
            Send request
          </button>
        </>
      )}
      {error && <p role="alert" style={errorText}>{error}</p>}
    </section>
  );
}
