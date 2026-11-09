# dispatch-notification

Secrets: `DISPATCH_WEBHOOK_SECRET`, `CLICKATELL_API_KEY` (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided).

Database Webhook (create in the dashboard when hosted: Database → Webhooks):
- Table `public.notification_outbox`, event INSERT
- Type: Supabase Edge Functions → `dispatch-notification`, method POST
- Header `x-webhook-secret: <DISPATCH_WEBHOOK_SECRET>`

Locally, post a row to `http://127.0.0.1:54321/functions/v1/dispatch-notification` with the same header to test.
