/**
 * lib/api/reports.ts
 * Report operations (OP7, OP8) for Phase 4.
 */
import { supabase } from '../supabase';
import type { ReportDraft } from '../db/drafts';

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

/**
 * OP7 – Submit an incident report.
 * 1. Upload media files to evidence/{id}/…
 * 2. Insert the report row
 * 3. Insert report_media rows
 * On insert failure, removes the uploaded files.
 */
export async function submitReport(
  params: SubmitReportParams,
): Promise<{ case_ref: string }> {
  const uploadedPaths: string[] = [];

  try {
    // Upload photos
    for (const photo of params.photos ?? []) {
      const ext = photo.uri.split('.').pop() ?? 'jpg';
      const path = `evidence/${params.id}/photo-${Date.now()}.${ext}`;
      const response = await fetch(photo.uri);
      const blob = await response.blob();
      const { error } = await supabase.storage
        .from('evidence')
        .upload(path, blob, { contentType: 'image/jpeg' });
      if (error) throw error;
      uploadedPaths.push(path);
    }

    // Upload videos
    for (const video of params.videos ?? []) {
      const ext = video.uri.split('.').pop() ?? 'mp4';
      const path = `evidence/${params.id}/video-${Date.now()}.${ext}`;
      const response = await fetch(video.uri);
      const blob = await response.blob();
      const { error } = await supabase.storage
        .from('evidence')
        .upload(path, blob, { contentType: 'video/mp4' });
      if (error) throw error;
      uploadedPaths.push(path);
    }

    // Upload audio
    if (params.audio) {
      const path = `evidence/${params.id}/audio-${Date.now()}.m4a`;
      const response = await fetch(params.audio.uri);
      const blob = await response.blob();
      const { error } = await supabase.storage
        .from('evidence')
        .upload(path, blob, { contentType: 'audio/m4a' });
      if (error) throw error;
      uploadedPaths.push(path);
    }

    // Insert report row
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

    if (insertError) throw insertError;

    // Insert report_media rows
    const mediaRows = [
      ...(params.photos ?? []).map((_, i) => ({
        report_id: params.id,
        kind: 'photo',
        storage_path: uploadedPaths[i],
        size_bytes: params.photos![i].size,
      })),
    ];
    if (mediaRows.length > 0) {
      await supabase.from('report_media').insert(mediaRows);
    }

    return { case_ref: (data as { case_ref: string }).case_ref };
  } catch (err) {
    // T-INT-3: clean up uploaded files if the report insert failed
    for (const path of uploadedPaths) {
      await supabase.storage.from('evidence').remove([path]);
    }

    // Surface user-facing messages
    const msg = err instanceof Error ? err.message : '';
    if (
      msg.includes('rate_limit_reports') ||
      msg.includes('rate limit')
    ) {
      throw new Error("You're sending reports too quickly. Try again later.");
    }
    if (
      msg.includes('NetworkError') ||
      msg.includes('Failed to fetch') ||
      msg.includes('network') ||
      msg.includes('offline')
    ) {
      throw new Error(
        'Network connection lost. Your report draft has been saved locally.',
      );
    }
    throw err;
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
  });
}
