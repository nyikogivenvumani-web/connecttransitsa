import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * delete-account (OP6):
 * Commuter account self-deletion enforcing POPIA and BR13:
 * 1. Checks that the authenticated caller is deleting their own account.
 * 2. Clears PII in public.users (name set to 'Deleted user', phone/email cleared).
 * 3. Deletes public.user_private row.
 * 4. Disassociates submitted reports (sets reporter_id to null).
 * 5. Deletes auth.users account using service role client.
 */
serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userId = user.id;

  try {
    // 1. Delete user_private
    await adminClient.from('user_private').delete().eq('user_id', userId);

    // 2. Anonymize profile in public.users
    await adminClient
      .from('users')
      .update({
        full_name: 'Deleted user',
        email: null,
        phone_number: null,
      })
      .eq('id', userId);

    // 3. Nullify reporter_id on reports
    await adminClient
      .from('reports')
      .update({ reporter_id: null })
      .eq('reporter_id', userId);

    // 4. Delete auth user
    await adminClient.auth.admin.deleteUser(userId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
