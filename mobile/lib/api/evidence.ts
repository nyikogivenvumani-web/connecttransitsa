/**
 * lib/api/evidence.ts – the commuter's reply to an evidence request (OP28).
 * Files go to {report_id}/… (allowed while the request is open); the function then
 * records the rows and closes the request.
 */
import { supabase } from '../supabase';

export interface AnswerParams {
  requestId: string;
  reportId: string;
  note: string;
  photos?: { uri: string; size: number }[];
  videos?: { uri: string; size: number; durationSeconds: number }[];
  audio?: { uri: string; size: number; durationSeconds: number } | null;
}

interface MediaRow {
  kind: 'photo' | 'video' | 'audio';
  storage_path: string;
  size_bytes: number;
  duration_seconds: number | null;
}

const GENERIC = 'Something went wrong. Try again.';

async function upload(reportId: string, kind: MediaRow['kind'], uri: string, ext: string, contentType: string, size: number, duration: number | null, i: number): Promise<MediaRow> {
  const path = `${reportId}/reply-${kind}-${i}-${Date.now()}.${ext}`;
  const blob = await (await fetch(uri)).blob();
  const { error } = await supabase.storage.from('evidence').upload(path, blob, { contentType });
  if (error) throw new Error(GENERIC);
  return { kind, storage_path: path, size_bytes: size, duration_seconds: duration };
}

export async function answerEvidenceRequest(p: AnswerParams): Promise<void> {
  const media: MediaRow[] = [];
  let i = 0;
  for (const ph of p.photos ?? []) {
    const png = ph.uri.toLowerCase().endsWith('.png');
    media.push(await upload(p.reportId, 'photo', ph.uri, png ? 'png' : 'jpg', png ? 'image/png' : 'image/jpeg', ph.size, null, i++));
  }
  for (const v of p.videos ?? []) media.push(await upload(p.reportId, 'video', v.uri, 'mp4', 'video/mp4', v.size, v.durationSeconds, i++));
  if (p.audio) media.push(await upload(p.reportId, 'audio', p.audio.uri, 'm4a', 'audio/x-m4a', p.audio.size, p.audio.durationSeconds, i++));

  const { error } = await supabase.rpc('answer_evidence_request', { p_request_id: p.requestId, p_note: p.note, p_media: media });
  if (error) {
    if (error.message?.includes('request_not_open')) throw new Error('This request is no longer open.');
    throw new Error(GENERIC);
  }
}
