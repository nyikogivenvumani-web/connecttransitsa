/** OP12–OP14 client calls. */
import { supabase } from '../supabase';

export interface StartSosParams {
  id: string;
  lat: number | null;
  lng: number | null;
  usedCachedLocation: boolean;
  clientElapsedMs: number;
}

export async function startSos(p: StartSosParams): Promise<{ id: string; share_token: string }> {
  const { data, error } = await supabase.functions.invoke('sos-start', {
    body: { id: p.id, lat: p.lat, lng: p.lng, used_cached_location: p.usedCachedLocation, client_elapsed_ms: p.clientElapsedMs },
  });
  if (error || !data?.id) throw new Error(error?.message ?? 'SOS start failed');
  return data as { id: string; share_token: string };
}

export async function sendLocation(eventId: string, lat: number, lng: number): Promise<void> {
  const at = new Date().toISOString();
  const ins = await supabase.from('sos_locations').insert({ sos_event_id: eventId, lat, lng, recorded_at: at });
  if (ins.error) throw new Error(ins.error.message);
  const upd = await supabase.from('sos_events').update({ last_lat: lat, last_lng: lng, last_recorded_at: at }).eq('id', eventId);
  if (upd.error) throw new Error(upd.error.message);
}

export async function stopSos(eventId: string): Promise<void> {
  const { error } = await supabase.from('sos_events').update({ status: 'stopped', stopped_at: new Date().toISOString() }).eq('id', eventId);
  if (error) throw new Error(error.message);
}
