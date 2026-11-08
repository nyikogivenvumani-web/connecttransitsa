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

-- T-BR11-4: SOS locations are removed after 24 hours. Also: a new SOS is queued for SAPS.
insert into public.sos_events (id, user_id, status, started_at, last_lat, last_lng, last_recorded_at) values
  ('30000000-0000-0000-0000-000000000001', tests.u('thabo'), 'stopped', now() - interval '3 days', -26.2, 28.0, now() - interval '25 hours'),
  ('30000000-0000-0000-0000-000000000002', tests.u('lerato'), 'active', now() - interval '2 hours', -26.3, 28.1, now() - interval '1 hour');
insert into public.sos_locations (sos_event_id, lat, lng, recorded_at) values
  ('30000000-0000-0000-0000-000000000001', -26.2, 28.0, now() - interval '25 hours'), ('30000000-0000-0000-0000-000000000001', -26.21, 28.01, now() - interval '30 hours'),
  ('30000000-0000-0000-0000-000000000002', -26.3, 28.1, now() - interval '1 hour'), ('30000000-0000-0000-0000-000000000002', -26.31, 28.11, now() - interval '23 hours');
select is((select count(*) from public.saps_queue where kind = 'sos' and sos_event_id in ('30000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002')), 2::bigint,
  'T-US4-3 each new SOS event is queued for SAPS');
select is((select payload ->> 'reporter_full_name' from public.saps_queue where sos_event_id = '30000000-0000-0000-0000-000000000002'), 'Lerato Nkosi', 'T-US4-3 the SOS queue row carries the name');
select lives_ok($$ select public.cleanup_sos_locations() $$, 'T-BR11-4 cleanup_sos_locations runs');
select is((select count(*) from public.sos_locations where sos_event_id = '30000000-0000-0000-0000-000000000001'), 0::bigint, 'T-BR11-4 locations older than 24 hours are deleted');
select is((select count(*) from public.sos_locations where sos_event_id = '30000000-0000-0000-0000-000000000002'), 2::bigint, 'T-BR11-4 newer locations are kept');
select is((select last_lat from public.sos_events where id = '30000000-0000-0000-0000-000000000001'), null, 'T-BR11-4 coordinates of an old SOS event are cleared');
select isnt((select last_lat from public.sos_events where id = '30000000-0000-0000-0000-000000000002'), null, 'T-BR11-4 coordinates of a recent SOS event are kept');
select is((select length(share_token) from public.sos_events where id = '30000000-0000-0000-0000-000000000002'), 32, 'T-BR11-4 the share token is 32 characters');
select is((select count(distinct share_token) from public.sos_events), (select count(*) from public.sos_events), 'T-BR11-4 share tokens are unique');

select * from finish();
rollback;
