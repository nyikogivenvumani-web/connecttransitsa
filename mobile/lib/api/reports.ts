/**
 * lib/api/reports.ts
 * Report operations (OP7, OP8) for Phase 4.
 */
import { supabase } from '../supabase';
import type { ReportDraft } from '../db/drafts';
import { friendlyMessage, isAuthError, AUTH_EXPIRED_MESSAGE } from '../errors';

export interface Organization {
  id: string;
  name: string;
  type: string;
  is_verified: boolean;
  is_oversight: boolean;
}

export interface CaseSummary {
  id: string;
  case_ref: string;
  status: string;
  vehicle_plate: string;
  category: string;
  created_at: string;
}

export interface SubmitReportParams {
  id: string;
  organizationId: string;
  unlistedEntityName?: string;
  vehiclePlate: string;
  category: string;
  customCategoryText?: string;
  description: string;
  incidentAt: string;
  locationLat?: number;
  locationLng?: number;
  locationText?: string;
  sapsCase?: string;
  photos?: { uri: string; size: number }[];
  videos?: { uri: string; size: number; durationSeconds: number }[];
  audio?: { uri: string; size: number; durationSeconds: number } | null;
}

/** Fetch all verified organizations (and the oversight row) for the select. */
export async function fetchOrganizations(): Promise<Organization[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, type, is_verified, is_oversight')
    .order('name');
  if (error) throw new Error('Something went wrong. Try again.');
  return data as Organization[];
}

/** Fetch up to 3 most recent cases for the logged-in commuter (OP8). */
export async function fetchMyCases(): Promise<CaseSummary[]> {
  const { data, error } = await supabase
    .from('my_case_view')
    .select('id, case_ref, status, vehicle_plate, category, created_at')
    .order('created_at', { ascending: false })
    .limit(3);
  if (error) throw new Error('Something went wrong. Try again.');
  return data as CaseSummary[];
}

function isNetworkError(msg: string): boolean {
  return /NetworkError|Failed to fetch|Network request failed|network|offline/i.test(msg);
}

async function uploadOne(
  reportId: string,
  kind: 'photo' | 'video' | 'audio',
  uri: string,
  ext: string,
  contentType: string,
  size: number,
  durationSeconds: number | null,
  index: number,
): Promise<void> {
  // Phase 2 storage policy: object name must be `{report_id}/{file}`.
  const path = `${reportId}/${kind}-${index}-${Date.now()}.${ext}`;
  const blob = await (await fetch(uri)).blob();
  const { error } = await supabase.storage
    .from('evidence')
    .upload(path, blob, { contentType });
  if (error) throw new Error(friendlyMessage(error));
  const { error: rowError } = await supabase.from('report_media').insert({
    report_id: reportId,
    kind,
    storage_path: path,
    size_bytes: size,
    duration_seconds: durationSeconds,
  });
  if (rowError) throw rowError;
}

/**
 * OP7 – Submit an incident report.
 * 1. Insert the report row (storage policy requires the report to exist).
 * 2. Upload each media file to evidence/{report_id}/… and insert its report_media row.
 * If the report insert fails nothing is uploaded. If a media upload fails after the
 * report exists, the report is kept and `mediaFailed` is returned (the client cannot
 * delete storage objects under the Phase 2 policy).
 */
export async function submitReport(
  params: SubmitReportParams,
): Promise<{ case_ref: string; mediaFailed?: boolean }> {
  try {
    const { data, error: insertError } = await supabase
      .from('reports')
      .insert({
        id: params.id,
        organization_id: params.organizationId,
        unlisted_entity_name: params.unlistedEntityName ?? null,
        vehicle_plate: params.vehiclePlate,
        category: params.category,
        custom_category_text: params.customCategoryText ?? null,
        description: params.description,
        incident_at: params.incidentAt,
        location_lat: params.locationLat ?? null,
        location_lng: params.locationLng ?? null,
        location_text: params.locationText ?? null,
        saps_case_number: params.sapsCase ?? null,
      })
      .select('case_ref')
      .single();

    let caseRef: string;
    if (insertError) {
      // Retry after a lost response: the report may already exist.
      if ((insertError as { code?: string }).code === '23505') {
        const { data: existing, error: lookupError } = await supabase
          .from('my_case_view')
          .select('case_ref')
          .eq('id', params.id)
          .single();
        if (lookupError) throw insertError;
        caseRef = (existing as { case_ref: string }).case_ref;
      } else {
        throw insertError;
      }
    } else {
      caseRef = (data as { case_ref: string }).case_ref;
    }

    let mediaFailed = false;
    try {
      let i = 0;
      for (const p of params.photos ?? []) {
        const ext = p.uri.split('.').pop()?.toLowerCase() === 'png' ? 'png' : 'jpg';
        await uploadOne(params.id, 'photo', p.uri, ext, ext === 'png' ? 'image/png' : 'image/jpeg', p.size, null, i++);
      }
      for (const v of params.videos ?? []) {
        await uploadOne(params.id, 'video', v.uri, 'mp4', 'video/mp4', v.size, v.durationSeconds, i++);
      }
      if (params.audio) {
        await uploadOne(params.id, 'audio', params.audio.uri, 'm4a', 'audio/x-m4a', params.audio.size, params.audio.durationSeconds, i++);
      }
    } catch {
      mediaFailed = true;
    }

    return mediaFailed ? { case_ref: caseRef, mediaFailed } : { case_ref: caseRef };
  } catch (err) {
    if (isAuthError(err)) throw new Error(AUTH_EXPIRED_MESSAGE);
    const msg = err instanceof Error ? err.message : String((err as { message?: string })?.message ?? '');
    if (msg.includes('rate_limit_reports') || msg.includes('rate limit')) {
      throw new Error("You're sending reports too quickly. Try again later.");
    }
    if (isNetworkError(msg)) {
      throw new Error('Network connection lost. Your report draft has been saved locally.');
    }
    throw new Error(friendlyMessage(err));
  }
}

/** Submit a previously saved draft (called on reconnect). */
export async function submitDraft(draft: ReportDraft): Promise<{ case_ref: string }> {
  return submitReport({
    id: draft.id,
    organizationId: draft.organizationId,
    unlistedEntityName: draft.unlistedEntityName,
    vehiclePlate: draft.vehiclePlate,
    category: draft.category,
    customCategoryText: draft.customCategoryText,
    description: draft.description,
    incidentAt: draft.incidentAt,
    locationLat: draft.locationLat,
    locationLng: draft.locationLng,
    locationText: draft.locationText,
    sapsCase: draft.sapsCase,
    ...(draft.mediaJson ? JSON.parse(draft.mediaJson) : {}),
  });
}
