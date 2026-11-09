import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { dispatchSaps, hmacSha256Hex, type SapsRow } from '../_shared/dispatchSaps.ts';
import { isAuthorizedWebhook } from '../_shared/webhookAuth.ts';

/**
 * dispatch-saps: called by the Database Webhook on INSERT into saps_queue (header x-webhook-secret),
 * and every minute by a scheduler with body {"retry": true} to resend rows that are due again.
 * Secrets: DISPATCH_WEBHOOK_SECRET, SAPS_WEBHOOK_URL, SAPS_WEBHOOK_SECRET.
 */
serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  if (!isAuthorizedWebhook(req.headers.get('x-webhook-secret'), Deno.env.get('DISPATCH_WEBHOOK_SECRET'))) {
    return new Response('Unauthorized', { status: 401 });
  }

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const deps = {
    fetch,
    url: Deno.env.get('SAPS_WEBHOOK_URL'),
    secret: Deno.env.get('SAPS_WEBHOOK_SECRET'),
    sign: hmacSha256Hex,
    update: async (id: string, patch: { webhook_status: string; webhook_attempts: number }) => {
      await db.from('saps_queue').update(patch).eq('id', id);
    },
  };

  const payload = await req.json().catch(() => ({}));
  let rows: SapsRow[] = [];
  if (payload.record?.id) rows = [payload.record as SapsRow];
  else if (payload.retry) {
    const { data } = await db.from('saps_queue').select('*').eq('webhook_status', 'pending').gt('webhook_attempts', 0);
    rows = (data ?? []) as SapsRow[];
  } else return new Response('Bad Request', { status: 400 });

  const results: string[] = [];
  for (const r of rows) results.push(await dispatchSaps(r, deps));
  return new Response(JSON.stringify({ results }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
