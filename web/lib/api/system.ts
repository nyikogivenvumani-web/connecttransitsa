/** System Admin API (OP23–OP26). */
import { supabase } from '../supabase';
import { friendlyError } from './admin';

export interface OrgRow { id: string; name: string; type: 'Taxi' | 'Bus' | 'E-Hailing'; is_oversight: boolean }
export interface OversightCase {
  id: string; case_ref: string; unlisted_entity_name: string | null; vehicle_plate: string; category: string; description: string; created_at: string;
}
export interface NewAdmin { email: string; full_name: string; role: 'transport_admin' | 'saps'; organization_id?: string }

const GENERIC = 'Something went wrong. Try again.';
const DUPLICATE = 'That organization already exists.';

function orgError(e: { code?: string; message?: string }): Error {
  if (e.code === '23505' || /duplicate|unique/i.test(e.message ?? '')) return new Error(DUPLICATE);
  return friendlyError(e);
}

export async function fetchOrganizations(): Promise<OrgRow[]> {
  const { data, error } = await supabase.from('organizations').select('id, name, type, is_oversight').order('name');
  if (error) throw friendlyError(error);
  return data as OrgRow[];
}

export async function createOrganization(name: string, type: string): Promise<void> {
  const { error } = await supabase.from('organizations').insert({ name: name.trim(), type });
  if (error) throw orgError(error);
}

export async function updateOrganization(id: string, name: string, type: string): Promise<void> {
  const { error } = await supabase.from('organizations').update({ name: name.trim(), type }).eq('id', id);
  if (error) throw orgError(error);
}

export async function createAdminUser(input: NewAdmin): Promise<void> {
  const { data, error } = await supabase.functions.invoke('create-admin-user', { body: input });
  if (error) {
    // supabase-js hides the response body in error.context for non-2xx replies
    const res = (error as { context?: Response }).context;
    const body = res && typeof res.json === 'function' ? await res.json().catch(() => null) : null;
    throw new Error(body?.error && body.error !== 'invalid_input' && body.error !== 'not_authorized' ? body.error : GENERIC);
  }
  if (!data?.id) throw new Error(GENERIC);
}

/** Reports filed under "Other/Unregistered". admin_case_view returns these rows to a System Admin and has no commuter columns. */
export async function fetchOversightCases(): Promise<OversightCase[]> {
  const { data, error } = await supabase
    .from('admin_case_view')
    .select('id, case_ref, unlisted_entity_name, vehicle_plate, category, description, created_at')
    .order('created_at', { ascending: false });
  if (error) throw friendlyError(error);
  return data as OversightCase[];
}

export async function tagOversightReport(reportId: string, organizationId: string): Promise<void> {
  const { error } = await supabase.rpc('tag_oversight_report', { p_report_id: reportId, p_org_id: organizationId });
  if (error) throw friendlyError(error);
}
