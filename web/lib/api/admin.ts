/**
 * Transport Admin API (OP15–OP18, OP27–OP29). Reads admin_case_view only: it has no commuter columns (BR1).
 */
import { supabase } from '../supabase';

export interface AdminCase {
  id: string;
  case_ref: string;
  organization_name: string;
  unlisted_entity_name: string | null;
  vehicle_plate: string;
  category: string;
  custom_category_text: string | null;
  description: string;
  incident_at: string;
  location_text: string | null;
  status: string;
  is_escalated: boolean;
  admin_decision: string | null;
  decision_reasoning: string | null;
  created_at: string;
  evidence_request_id: string | null;
  evidence_request_status: 'open' | 'answered' | 'cancelled' | 'closed_by_decision' | null;
  evidence_request_message: string | null;
  evidence_reply_note: string | null;
}

export interface AdminMedia {
  id: string;
  kind: 'photo' | 'video' | 'audio';
  url: string;
  size_bytes: number;
  duration_seconds: number | null;
  request_id: string | null;
}

const COLUMNS =
  'id, case_ref, organization_name, unlisted_entity_name, vehicle_plate, category, custom_category_text, description, incident_at, location_text, status, is_escalated, admin_decision, decision_reasoning, created_at, evidence_request_id, evidence_request_status, evidence_request_message, evidence_reply_note';

const GENERIC = 'Something went wrong. Try again.';
const ERROR_MESSAGES: Record<string, string> = {
  request_already_open: 'A request is already open for this case.',
  request_limit: 'This case has reached the limit of 3 evidence requests.',
  request_case_status: 'Evidence can be requested once the case is Under Review.',
  case_already_decided: 'This case has already been decided.',
  invalid_status_change: 'That status change is not allowed.',
  request_not_open: 'That request is no longer open.',
  not_authorized: 'You do not have access to this case.',
};

export function isNetworkError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e);
  return /Failed to fetch|NetworkError|Network request failed|network/i.test(msg);
}

export function friendlyError(e: unknown): Error {
  const msg = e instanceof Error ? e.message : String((e as { message?: string })?.message ?? '');
  if (isNetworkError(e)) return new Error('Failed to fetch');
  for (const [code, text] of Object.entries(ERROR_MESSAGES)) if (msg.includes(code)) return new Error(text);
  return new Error(GENERIC);
}

export const PAGE_SIZE = 20;

export async function fetchAdminCases(limit: number = PAGE_SIZE): Promise<AdminCase[]> {
  const { data, error } = await supabase.from('admin_case_view').select(COLUMNS).order('created_at', { ascending: false }).limit(limit);
  if (error) throw friendlyError(error);
  return data as AdminCase[];
}

export async function fetchAdminCase(id: string): Promise<AdminCase | null> {
  const { data, error } = await supabase.from('admin_case_view').select(COLUMNS).eq('id', id).maybeSingle();
  if (error) throw friendlyError(error);
  return data as AdminCase | null;
}

/** Media rows plus 10-minute signed URLs (SEC16). Storage policy lets an organization admin read its own cases' files. */
export async function fetchCaseMedia(reportId: string): Promise<AdminMedia[]> {
  const { data, error } = await supabase
    .from('report_media')
    .select('id, kind, storage_path, size_bytes, duration_seconds, request_id')
    .eq('report_id', reportId)
    .order('created_at', { ascending: true });
  if (error) throw friendlyError(error);
  const out: AdminMedia[] = [];
  for (const m of (data ?? []) as Array<AdminMedia & { storage_path: string }>) {
    const { data: signed } = await supabase.storage.from('evidence').createSignedUrl(m.storage_path, 600);
    if (signed?.signedUrl) {
      out.push({ id: m.id, kind: m.kind, url: signed.signedUrl, size_bytes: m.size_bytes, duration_seconds: m.duration_seconds, request_id: m.request_id });
    }
  }
  return out;
}

export async function updateCase(id: string, status: string, decision: string | null, reasoning: string | null): Promise<void> {
  const { error } = await supabase.rpc('admin_update_case', { p_report_id: id, p_status: status, p_decision: decision, p_reasoning: reasoning });
  if (error) throw friendlyError(error);
}

export async function requestEvidence(reportId: string, message: string): Promise<void> {
  const { error } = await supabase.rpc('request_evidence', { p_report_id: reportId, p_message: message });
  if (error) throw friendlyError(error);
}

export async function cancelEvidenceRequest(requestId: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_evidence_request', { p_request_id: requestId });
  if (error) throw friendlyError(error);
}
