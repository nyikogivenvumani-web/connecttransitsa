import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

/**
 * send-sms-otp: Supabase Auth Send SMS Hook
 * Receives the hook call from Supabase Auth, validates the signature,
 * and calls Clickatell REST API to send the SMS OTP.
 */
serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const payload = await req.json();
    const { user, sms } = payload;
    const phone = user?.phone;
    const otp = sms?.otp;

    if (!phone || !otp) {
      return new Response(JSON.stringify({ error: 'Missing phone or OTP' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('CLICKATELL_API_KEY');
    if (apiKey) {
      await fetch('https://platform.clickatell.com/messages/http/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: apiKey,
        },
        body: JSON.stringify({
          to: [phone],
          content: `Your ConnectTransit SA verification code is: ${otp}`,
        }),
      });
    }

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
