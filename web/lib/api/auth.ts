/** A7 sign-in for the web portals, and the role → route rules used by middleware. */
import { supabase } from '../supabase';

export type WebRole = 'transport_admin' | 'saps' | 'system_admin';

export function homePathForRole(role: WebRole): string {
  return role === 'transport_admin' ? '/admin' : role === 'saps' ? '/saps' : '/system';
}

export async function signInAdmin(email: string, password: string): Promise<{ role: WebRole }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error('Incorrect email or password.');
  const { data: row } = await supabase.from('users').select('role').eq('id', data.user.id).single();
  const role = (row as { role?: string } | null)?.role;
  if (role !== 'transport_admin' && role !== 'saps' && role !== 'system_admin') {
    await supabase.auth.signOut();
    throw new Error('This account cannot use the web dashboard.');
  }
  return { role };
}

/**
 * Route guard. Returns a path to redirect to, or null to let the request through.
 * /login and /live/* (public share page) are open.
 */
export function routeDecision(pathname: string, role: string | null): string | null {
  if (pathname === '/login' || pathname.startsWith('/live')) return null;
  const area = ['/admin', '/saps', '/system'].find((p) => pathname === p || pathname.startsWith(p + '/'));
  if (!area) return null;
  if (role !== 'transport_admin' && role !== 'saps' && role !== 'system_admin') return '/login';
  const home = homePathForRole(role);
  return area === home ? null : home;
}
