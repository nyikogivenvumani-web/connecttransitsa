# dispatch-saps

Secrets: `DISPATCH_WEBHOOK_SECRET`, `SAPS_WEBHOOK_URL`, `SAPS_WEBHOOK_SECRET`.

1. Database Webhook on `public.saps_queue`, event INSERT → Edge Function `dispatch-saps`, header `x-webhook-secret: <DISPATCH_WEBHOOK_SECRET>`.
2. Retries: schedule a POST every minute to the function with the same header and body `{"retry": true}`
   (Supabase dashboard: Integrations → Cron, or any external scheduler). Backoff after the first try is 1, 5, 15 and 30 minutes; after 5 failed tries the row shows "Delivery to SAPS failed" on A3.
3. Each request carries `X-ConnectTransit-Signature: sha256=<hex HMAC-SHA256 of the raw body, key SAPS_WEBHOOK_SECRET>`.
4. Locally: `npx tsx scripts/mock-saps.ts` listens on port 4010 and prints each verified delivery.
