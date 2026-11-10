/**
 * lib/api/cases.ts – OP8 (my cases), OP9 (by reference), OP11 (public plate lookup).
 */
import { supabase } from '../supabase';
import { friendlyMessage } from '../errors';

export const NOT_FOUND_MESSAGE = 'Case reference number not found. Please check and try again.';
export const SEARCH_RATE_MESSAGE = "You're searching too quickly. Try again later.";
const GENERIC = 'Something went wrong. Try again.';

export interface CaseDetail {
  id: string;
  case_ref: string;
  status: string;
  vehicle_plate: string;
  category: string;
  description: string;
  organization_name: string;
  unlisted_entity_name: string | null;
  incident_at: string;
  created_at: string;
  admin_decision: string | null;
  decision_reasoning: string | null;
  evidence_request_id: string | null;
  evidence_request_status: 'open' | 'answered' | 'cancelled' | 'closed_by_decision' | null;
  evidence_request_message: string | null;
  evidence_reply_note: string | null;
}

export interface PlateResult {
  category: string;
  vehicle_plate: string;
  organization_name: string;
  status: string;
  incident_at: string;
  description: string;
  admin_decision: string | null;
  decision_reasoning: string | null;
}

const COLUMNS =
  'id, case_ref, status, vehicle_plate, category, description, organization_name, unlisted_entity_name, incident_at, created_at, admin_decision, decision_reasoning, evidence_request_id, evidence_request_status, evidence_request_message, evidence_reply_note';

let lastList: CaseDetail[] | null = null;
/** Last successfully loaded "My cases" list, for offline display. */
export function getCachedCases(): CaseDetail[] | null {
  return lastList;
}
export function setCachedCases(list: CaseDetail[]): void {
  lastList = list;
}
export function __resetCaseCache(): void {
  lastList = null;
}

export const REFERENCE_PATTERN = /^TC-\d{4}-\d{4,}$/i;
export const MIN_PLATE_CHARS = 3;

export const PAGE_SIZE = 20;

export async function fetchAllMyCases(limit: number = PAGE_SIZE): Promise<CaseDetail[]> {
  const { data, error } = await supabase
    .from('my_case_view')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(friendlyMessage(error));
  return data as CaseDetail[];
}

export async function fetchCaseByRef(ref: string): Promise<CaseDetail | null> {
  const { data, error } = await supabase
    .from('my_case_view')
    .select(COLUMNS)
    .eq('case_ref', ref.trim().toUpperCase())
    .maybeSingle();
  if (error) throw new Error(friendlyMessage(error));
  return (data as CaseDetail | null) ?? null;
}

export async function searchByPlate(plate: string): Promise<PlateResult[]> {
  if (plate.replace(/[^a-z0-9]/gi, '').length < MIN_PLATE_CHARS) return [];
  const { data, error } = await supabase.rpc('public_case_lookup', { p_plate: plate });
  if (error) {
    if (error.message?.includes('rate_limit_search')) throw new Error(SEARCH_RATE_MESSAGE);
    throw new Error(GENERIC);
  }
  return (data ?? []) as PlateResult[];
}
