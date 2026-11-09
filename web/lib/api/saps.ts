/** SAPS portal API (OP19, OP20). Reads saps_queue directly (RLS: role saps only). */
import { supabase } from '../supabase';
import { friendlyError } from './admin';

export interface SapsItem {
  id: string;
  status: 'new' | 'acknowledged';
  webhook_status: 'pending' | 'sent' | 'failed';
  created_at: string;
  payload: {
    case_ref?: string;
    vehicle_plate?: string;
    category?: string;
    description?: string;
    location_text?: string | null;
    saps_case_number?: string | null;
    reporter_full_name?: string | null;
    reporter_id_number?: string | null;
  };
}

export async function fetchSapsQueue(): Promise<SapsItem[]> {
  const { data, error } = await supabase
    .from('saps_queue')
    .select('id, status, webhook_status, created_at, payload')
    .eq('kind', 'report')
    .order('created_at', { ascending: false });
  if (error) throw friendlyError(error);
  return data as SapsItem[];
}

export async function acknowledgeEscalation(id: string): Promise<void> {
  const { error } = await supabase.from('saps_queue').update({ status: 'acknowledged' }).eq('id', id);
  if (error) throw friendlyError(error);
}

export interface ActiveSos {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  last_recorded_at: string | null;
  started_at: string;
  used_cached_location: boolean;
}

/** OP21: active SOS events with the latest location and the commuter's name (from the SAPS copy). */
export async function fetchActiveSos(): Promise<ActiveSos[]> {
  const events = await supabase
    .from('sos_events')
    .select('id, last_lat, last_lng, last_recorded_at, started_at, used_cached_location')
    .eq('status', 'active')
    .order('started_at', { ascending: false });
  if (events.error) throw friendlyError(events.error);
  const queue = await supabase.from('saps_queue').select('sos_event_id, payload').eq('kind', 'sos');
  if (queue.error) throw friendlyError(queue.error);
  const names = new Map<string, string>();
  for (const q of (queue.data ?? []) as Array<{ sos_event_id: string; payload: { reporter_full_name?: string } }>) {
    names.set(q.sos_event_id, q.payload.reporter_full_name ?? 'Unknown commuter');
  }
  return ((events.data ?? []) as Array<{ id: string; last_lat: number | null; last_lng: number | null; last_recorded_at: string | null; started_at: string; used_cached_location: boolean }>).map((e) => ({
    id: e.id, name: names.get(e.id) ?? 'Unknown commuter', lat: e.last_lat, lng: e.last_lng,
    last_recorded_at: e.last_recorded_at, started_at: e.started_at, used_cached_location: e.used_cached_location,
  }));
}
