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

-- T-BR2-1: severe categories are escalated. T-BR2-2: escalated reports create exactly one SAPS queue row.
delete from public.reports;
create temp table t_sev on commit drop as
  select c as category, tests.new_report(tests.u('thabo'), tests.org('metrobus'), c, 'SEV ' || row_number() over (), now() - interval '5 days' - row_number() over () * interval '2 hours') as id
  from unnest(array['Sexual Misconduct', 'Physical Assault']) c;
create temp table t_non on commit drop as
  select c as category, tests.new_report(tests.u('thabo'), tests.org('metrobus'), c, 'NON ' || row_number() over (), now() - interval '6 days' - row_number() over () * interval '2 hours') as id
  from unnest(array['Reckless & Negligent Driving','Overcrowding & Safety Hazard','Extortion & Fare Intimidation','Overcharging','Harassment',
    'Drunk or Impaired Driving','Unroadworthy Vehicle','Refusal of Service or Route Deviation']) c;
select is((select count(*) from public.reports r join t_sev s on s.id = r.id where r.status = 'Escalated' and r.is_escalated), 2::bigint,
  'T-BR2-1 Sexual Misconduct and Physical Assault are created as Escalated');
select is((select count(*) from public.reports r join t_non s on s.id = r.id where r.status = 'Submitted' and not r.is_escalated), 8::bigint,
  'T-BR2-1 every other category is created as Submitted');
select is((select count(*) from public.saps_queue q join t_sev s on s.id = q.report_id), 2::bigint, 'T-BR2-2 each escalated report has exactly one SAPS queue row');
select is((select count(*) from public.saps_queue q join t_non s on s.id = q.report_id), 0::bigint, 'T-BR2-2 other reports have none');
select is((select count(*) from public.saps_queue q join t_sev s on s.id = q.report_id where q.kind = 'report' and q.status = 'new'), 2::bigint, 'T-BR2-2 the queue rows are new and of kind report');
select ok((select bool_and(payload ?& array['case_ref','vehicle_plate','category','description','location_lat','location_lng','location_text','saps_case_number','reporter_full_name','reporter_id_number'])
  from public.saps_queue q join t_sev s on s.id = q.report_id), 'T-BR2-2 the payload has every field listed in plan 8.5');
select is((select payload ->> 'reporter_id_number' from public.saps_queue q join t_sev s on s.id = q.report_id limit 1), '9803145009088', 'T-BR2-2 the payload carries the reporter ID number');
select is((select payload ->> 'reporter_full_name' from public.saps_queue q join t_sev s on s.id = q.report_id limit 1), 'Thabo Mokoena', 'T-BR2-2 the payload carries the reporter name');
select is((select payload ->> 'case_ref' from public.saps_queue q join t_sev s on s.id = q.report_id where s.category = 'Physical Assault'),
  (select case_ref from public.reports r join t_sev s on s.id = r.id where s.category = 'Physical Assault'), 'T-BR2-2 the payload case_ref matches the report');
-- a client cannot choose its own status or escalation: the trigger decides
select is((select status from public.reports where id = (select id from t_non limit 1)), 'Submitted', 'T-BR2-1 non-severe reports start as Submitted');

select * from finish();
rollback;
