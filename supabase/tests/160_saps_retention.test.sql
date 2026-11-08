-- Generated pgTAP test. Run with: supabase test db
begin;
select * from no_plan();

-- Test helpers (rolled back with the transaction; nothing here reaches the real database).
create schema tests;
create sequence tests.seq;
grant usage on schema tests to public;
create function tests.u(n text) returns uuid language sql immutable as $$
  select (case n when 'thabo' then '00000000-0000-0000-0000-000000000001' when 'lerato' then '00000000-0000-0000-0000-000000000002'
    when 'sipho' then '00000000-0000-0000-0000-000000000003' when 'nomsa' then '00000000-0000-0000-0000-000000000004'
    when 'saps' then '00000000-0000-0000-0000-000000000005' when 'sysadmin' then '00000000-0000-0000-0000-000000000006' end)::uuid $$;
create function tests.org(n text) returns uuid language sql immutable as $$
  select (case n when 'dorljota' then '10000000-0000-0000-0000-000000000001' when 'metrobus' then '10000000-0000-0000-0000-000000000002'
    when 'putco' then '10000000-0000-0000-0000-000000000003' when 'uber' then '10000000-0000-0000-0000-000000000004'
    when 'bolt' then '10000000-0000-0000-0000-000000000005' when 'other' then '10000000-0000-0000-0000-000000000006' end)::uuid $$;
create function tests.rep(n int) returns uuid language sql immutable as $$ select ('20000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid $$;
create function tests.sa_id(prefix12 text) returns text language plpgsql as $$
declare i int; d int; s int := 0; dbl boolean := true;
begin
  for i in reverse 12..1 loop
    d := substr(prefix12, i, 1)::int;
    if dbl then d := d * 2; if d > 9 then d := d - 9; end if; end if;
    s := s + d; dbl := not dbl;
  end loop;
  return prefix12 || ((10 - (s % 10)) % 10)::text;
end $$;
create function tests.as_postgres() returns void language plpgsql as $$
begin execute 'reset role'; perform set_config('request.jwt.claims', '', true); end $$;
create function tests.as_user(uid uuid) returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;
create function tests.as_anon() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
end $$;
create function tests.as_service() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  execute 'set local role service_role';
end $$;
-- Insert a report as the database owner (call while not switched to another role). Returns its id.
create function tests.new_report(p_reporter uuid, p_org uuid, p_category text default 'Reckless & Negligent Driving',
  p_plate text default 'XX 11 GP', p_created timestamptz default null) returns uuid language plpgsql as $$
declare rid uuid := gen_random_uuid(); v_created timestamptz := coalesce(p_created, now() - interval '3 days' - nextval('tests.seq') * interval '2 hours');
begin
  insert into public.reports (id, organization_id, reporter_id, vehicle_plate, category, description, incident_at, created_at)
  values (rid, p_org, p_reporter, p_plate, p_category, 'Test description of the incident', v_created - interval '1 hour', v_created);
  return rid;
end $$;

-- Number of rows a statement changed, run as the current role (RLS hides rows without raising an error)
create function tests.affected(q text) returns bigint language plpgsql as $$
declare n bigint; begin execute q; get diagnostics n = row_count; return n; end $$;

create function tests.ref_of(rid uuid) returns text language plpgsql as $$ declare r text; begin select case_ref into r from public.reports where id = rid; return r; end $$;
create function tests.req_of(rid uuid) returns uuid language sql security definer as $$ select id from public.evidence_requests where report_id = rid order by created_at desc limit 1 $$;
create function tests.req_status(rid uuid) returns text language sql security definer as $$ select status from public.evidence_requests where report_id = rid order by created_at desc limit 1 $$;
grant execute on all functions in schema tests to public;

-- T-BR13-1: SAPS copy is kept 12 months after account deletion, then name and ID number are removed.
select is((select count(*) from cron.job where jobname in ('cleanup_sos_locations', 'cleanup_rate_events', 'purge_saps_pii')), 3::bigint, 'T-BR13-1 the three jobs are scheduled');
select is((select schedule from cron.job where jobname = 'cleanup_sos_locations'), '0 * * * *', 'T-BR13-1 cleanup_sos_locations runs hourly');
select is((select schedule from cron.job where jobname = 'cleanup_rate_events'), '15 3 * * *', 'T-BR13-1 cleanup_rate_events runs daily');
select is((select schedule from cron.job where jobname = 'purge_saps_pii'), '30 3 * * *', 'T-BR13-1 purge_saps_pii runs daily');

insert into public.sos_events (id, user_id) values ('30000000-0000-0000-0000-0000000000b1', tests.u('thabo')), ('30000000-0000-0000-0000-0000000000b2', tests.u('lerato'));
insert into public.push_tokens (user_id, token) values (tests.u('thabo'), 'ExponentPushToken[del]');
select is((select purge_after from public.saps_queue where report_id = tests.rep(5)), null, 'T-BR13-1 an active account has no purge date');
select lives_ok($$ select public.delete_account_data(tests.u('thabo')) $$, 'T-BR13-1 account data deletion runs');
select is((select full_name from public.users where id = tests.u('thabo')), 'Deleted user', 'T-BR13-1 the name is replaced');
select is((select email from public.users where id = tests.u('thabo')), null, 'T-BR13-1 the email is cleared');
select is((select phone_number from public.users where id = tests.u('thabo')), null, 'T-BR13-1 the phone is cleared');
select is((select count(*) from public.user_private where user_id = tests.u('thabo')), 0::bigint, 'T-BR13-1 the ID number row is deleted');
select is((select count(*) from public.push_tokens where user_id = tests.u('thabo')), 0::bigint, 'T-BR13-1 push tokens are deleted');
select is((select count(*) from public.sos_events where user_id = tests.u('thabo')), 0::bigint, 'T-BR13-1 SOS events are deleted');
select is((select count(*) from public.reports where reporter_id = tests.u('thabo')), 0::bigint, 'T-BR13-1 reports are anonymised');
select is((select count(*) from public.reports where id = tests.rep(5)), 1::bigint, 'T-BR13-1 but the report itself stays');
select is((select count(*) from public.evidence_requests where status = 'open' and report_id in (select id from public.reports where reporter_id is null)), 0::bigint, 'T-BR13-1 open evidence requests are closed');
select ok((select purge_after between now() + interval '364 days' and now() + interval '367 days' from public.saps_queue where report_id = tests.rep(5)), 'T-BR13-1 the SAPS row is purged in 12 months');
select is((select payload ->> 'reporter_full_name' from public.saps_queue where report_id = tests.rep(5)), 'Thabo Mokoena', 'T-BR13-1 the SAPS copy still has the name until then');
select is((select payload ->> 'reporter_id_number' from public.saps_queue where report_id = tests.rep(5)), '9803145009088', 'T-BR13-1 and the ID number');
select is((select count(*) from public.saps_queue where kind = 'sos' and purge_after is not null), 1::bigint, 'T-BR13-1 the deleted user''s SOS queue row also gets a purge date');
select is((select count(*) from public.saps_queue where kind = 'sos' and purge_after is null), 1::bigint, 'T-BR13-1 another user''s SOS queue row does not');

select lives_ok($$ select public.purge_saps_pii() $$, 'T-BR13-1 purge_saps_pii runs');
select is((select payload ->> 'reporter_full_name' from public.saps_queue where report_id = tests.rep(5)), 'Thabo Mokoena', 'T-BR13-1 nothing is purged before the date');
update public.saps_queue set purge_after = now() - interval '1 day' where report_id = tests.rep(5);
select lives_ok($$ select public.purge_saps_pii() $$, 'T-BR13-1 purge_saps_pii runs after the date');
select is((select payload ? 'reporter_full_name' from public.saps_queue where report_id = tests.rep(5)), false, 'T-BR13-1 the name is removed after the date');
select is((select payload ? 'reporter_id_number' from public.saps_queue where report_id = tests.rep(5)), false, 'T-BR13-1 the ID number is removed after the date');
select is((select payload ->> 'category' from public.saps_queue where report_id = tests.rep(5)), 'Sexual Misconduct', 'T-BR13-1 the rest of the record stays');
select is((select count(*) from public.saps_queue where kind = 'sos' and purge_after is null and payload ? 'reporter_full_name'), 1::bigint, 'T-BR13-1 rows of active accounts are untouched');

select * from finish();
rollback;
