import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { startSosEvent } from '../_shared/sosStart.ts';

/** sos-start (OP12): called by the commuter's phone after three taps. Needs the caller's JWT. */
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info' };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'Method Not Allowed' });
  const auth = req.headers.get('Authorization');
  if (!auth) return json(401, { error: 'Unauthorized' });

  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });

  const input = await req.json().catch(() => ({}));
  const result = await startSosEvent(input, {
    now: () => Date.now(),
    userId: async () => (await caller.auth.getUser()).data.user?.id ?? null,
    insert: async (row) => {
      const { data, error } = await admin.from('sos_events').insert(row).select('id, share_token').single();
      if (error) throw error;
      return data as { id: string; share_token: string };
    },
    findExisting: async (id, userId) => {
      const { data } = await admin.from('sos_events').select('id, share_token').eq('id', id).eq('user_id', userId).maybeSingle();
      return data as { id: string; share_token: string } | null;
    },
  });
  return json(result.status, result.body);
});
