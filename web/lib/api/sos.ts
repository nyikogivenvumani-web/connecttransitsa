/** P1 – public live location (OP22). Anyone with the token; the function returns coordinates and status only (SEC14). */
import { supabase } from '../supabase';
import { friendlyError } from './admin';

export interface SharedLocation { status: string; lat: number | null; lng: number | null; recorded_at: string | null }

export async function fetchShared(token: string): Promise<SharedLocation | null> {
  const { data, error } = await supabase.rpc('sos_share_view', { p_token: token });
  if (error) throw friendlyError(error);
  const rows = (data ?? []) as SharedLocation[];
  return rows[0] ?? null;
}
