/**
 * Supabase client for the web portals (Next.js App Router).
 * Uses @supabase/ssr so cookies are handled server-side and client-side.
 * Rules: only uses NEXT_PUBLIC_ variables in this file.
 */
import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/** Singleton for client components */
export const supabase = createClient();
