import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { dispatchNotification, type OutboxRow } from '../_shared/dispatch.ts';

/**
 * dispatch-notification: called by the Database Webhook on INSERT into notification_outbox.
 * Uses the service role (the outbox and push_tokens are not reachable by the API roles).
 * The webhook must send the header `x-webhook-secret` equal to the DISPATCH_WEBHOOK_SECRET secret.
 */
serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const secret = Deno.env.get('DISPATCH_WEBHOOK_SECRET');
  if (!secret || req.headers.get('x-webhook-secret') !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = await req.json();
  const row = payload.record as OutboxRow | undefined;
  if (!row?.id) return new Response('Bad Request', { status: 400 });

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const result = await dispatchNotification(row, {
    fetch,
    clickatellKey: Deno.env.get('CLICKATELL_API_KEY'),
    getTokens: async (userId) => {
      const { data } = await db.from('push_tokens').select('token').eq('user_id', userId);
      return (data ?? []).map((t: { token: string }) => t.token);
    },
    getPhone: async (userId) => {
      const { data } = await db.from('users').select('phone_number').eq('id', userId).maybeSingle();
      return (data as { phone_number: string | null } | null)?.phone_number ?? null;
    },
    getCaseRef: async (reportId) => {
      if (!reportId) return null;
      const { data } = await db.from('reports').select('case_ref').eq('id', reportId).maybeSingle();
      return (data as { case_ref: string } | null)?.case_ref ?? null;
    },
    markStatus: async (id, status) => {
      await db.from('notification_outbox').update({ status }).eq('id', id);
    },
  });

  return new Response(JSON.stringify({ result }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
