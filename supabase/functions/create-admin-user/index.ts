import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createAdminUser } from '../_shared/createAdmin.ts';

/** create-admin-user (OP24): System Admin creates a Transport Admin or SAPS account and sends an invite. */
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
  const result = await createAdminUser(input, {
    callerRole: async () => {
      const { data: { user } } = await caller.auth.getUser();
      if (!user) return null;
      const { data } = await admin.from('users').select('role').eq('id', user.id).maybeSingle();
      return (data as { role?: string } | null)?.role ?? null;
    },
    createUser: async ({ email, full_name, role }) => {
      const { data, error } = await admin.auth.admin.createUser({
        email, email_confirm: true, password: crypto.randomUUID() + crypto.randomUUID(),
        app_metadata: { role }, user_metadata: { full_name },
      });
      if (error || !data.user) throw new Error(error?.message ?? 'create failed');
      return { id: data.user.id };
    },
    addOrgAdmin: async (userId, organizationId) => {
      const { error } = await admin.from('org_admins').insert({ user_id: userId, organization_id: organizationId });
      if (error) throw new Error(error.message);
    },
    deleteUser: async (userId) => { await admin.auth.admin.deleteUser(userId); },
    sendInvite: async (email) => {
      const { error } = await admin.auth.resetPasswordForEmail(email);
      if (error) throw new Error(error.message);
    },
  });
  return json(result.status, result.body);
});
