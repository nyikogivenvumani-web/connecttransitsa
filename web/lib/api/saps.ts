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
