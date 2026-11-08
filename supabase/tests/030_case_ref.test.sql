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

-- T-BR7-1: case references are TC-YYYY-NNNN, a per-year counter, never containing ID digits.
delete from public.reports;
delete from public.case_counters;
select is(tests.ref_of(tests.new_report(tests.u('thabo'), tests.org('dorljota'), 'Overcharging', 'AA 1 GP', '2026-02-01 10:00+02')),
  'TC-2026-0001', 'T-BR7-1 the first report of 2026 is TC-2026-0001');
select is(tests.ref_of(tests.new_report(tests.u('thabo'), tests.org('dorljota'), 'Overcharging', 'AA 2 GP', '2026-03-01 10:00+02')),
  'TC-2026-0002', 'T-BR7-1 the second is TC-2026-0002');
select is(tests.ref_of(tests.new_report(tests.u('thabo'), tests.org('dorljota'), 'Overcharging', 'AA 3 GP', '2027-03-01 10:00+02')),
  'TC-2027-0001', 'T-BR7-1 a report in 2027 restarts at TC-2027-0001');
update public.case_counters set last_value = 9999 where year = 2026;
select is(tests.ref_of(tests.new_report(tests.u('thabo'), tests.org('dorljota'), 'Overcharging', 'AA 4 GP', '2026-06-01 10:00+02')),
  'TC-2026-10000', 'T-BR7-1 the 10,000th report of a year grows to 5 digits');
select is((select count(distinct case_ref) from public.reports), 4::bigint, 'T-BR7-1 every reference is unique');
select ok(not exists (select 1 from public.reports where case_ref !~ '^TC-[0-9]{4}-[0-9]{4,}$'), 'T-BR7-1 every reference has the TC-YYYY-NNNN shape');
select ok(not exists (select 1 from public.reports where case_ref like '%9803145%'), 'T-BR7-1 no reference contains digits of an ID number');
-- the year is the South African calendar year (UTC+2): 31 Dec 23:30 UTC is already 1 Jan in South Africa
select is(tests.ref_of(tests.new_report(tests.u('thabo'), tests.org('dorljota'), 'Overcharging', 'AA 5 GP', '2028-12-31 23:30+00')),
  'TC-2029-0001', 'T-BR7-1 the year follows South African time');

select * from finish();
rollback;
