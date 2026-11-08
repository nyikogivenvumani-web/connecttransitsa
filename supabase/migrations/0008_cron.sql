-- 0008_cron: scheduled cleanup jobs.
create extension if not exists pg_cron;
select cron.schedule('cleanup_sos_locations', '0 * * * *', 'select public.cleanup_sos_locations()');
select cron.schedule('cleanup_rate_events', '15 3 * * *', 'select public.cleanup_rate_events()');
select cron.schedule('purge_saps_pii', '30 3 * * *', 'select public.purge_saps_pii()');
