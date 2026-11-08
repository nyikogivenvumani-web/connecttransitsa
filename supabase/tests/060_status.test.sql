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

-- T-BR5-1: a decision needs a summary and a reason of 20+ characters. T-BR10-1: the allowed status changes (plan 8.3).
create temp table t_s on commit drop as select
  tests.new_report(tests.u('thabo'), tests.org('dorljota'), 'Overcharging', 'ST 1 GP') as submitted,
  tests.new_report(tests.u('thabo'), tests.org('metrobus'), 'Physical Assault', 'ST 2 GP') as escalated,
  tests.new_report(tests.u('thabo'), tests.org('dorljota'), 'Overcharging', 'ST 3 GP') as reviewing;
update public.reports set status = 'Under Review' where id = (select reviewing from t_s);

select throws_ok($$ update public.reports set status = 'Resolved', admin_decision = 'Warned', decision_reasoning = 'too short' where id = (select reviewing from t_s) $$,
  '23514', null, 'T-BR5-1 Resolved with a reason under 20 characters is rejected');
select throws_ok($$ update public.reports set status = 'Dismissed', admin_decision = 'None', decision_reasoning = '1234567890123456789' where id = (select reviewing from t_s) $$,
  '23514', null, 'T-BR5-1 Dismissed with 19 characters is rejected');
select throws_ok($$ update public.reports set status = 'Resolved', decision_reasoning = '12345678901234567890' where id = (select reviewing from t_s) $$,
  '23514', null, 'T-BR5-1 Resolved without a decision summary is rejected');
select throws_ok($$ update public.reports set status = 'Resolved', admin_decision = repeat('x', 201), decision_reasoning = '12345678901234567890' where id = (select reviewing from t_s) $$,
  '23514', null, 'T-BR5-1 a decision summary over 200 characters is rejected');
select lives_ok($$ update public.reports set status = 'Resolved', admin_decision = 'Operator warned', decision_reasoning = '12345678901234567890' where id = (select reviewing from t_s) $$,
  'T-BR5-1 exactly 20 characters is accepted');
select isnt((select decided_at from public.reports where id = (select reviewing from t_s)), null, 'T-BR5-1 decided_at is set when a case is decided');

-- T-BR10-1
select lives_ok($$ update public.reports set status = 'Under Review' where id = (select submitted from t_s) $$, 'T-BR10-1 Submitted to Under Review is accepted');
select lives_ok($$ update public.reports set status = 'Under Review' where id = (select escalated from t_s) $$, 'T-BR10-1 Escalated to Under Review is accepted');
select lives_ok($$ update public.reports set status = 'Dismissed', admin_decision = 'No breach', decision_reasoning = 'The CCTV shows no breach of the route rules.' where id = (select escalated from t_s) $$,
  'T-BR10-1 Under Review to Dismissed is accepted');
select throws_ok($$ update public.reports set status = 'Resolved', admin_decision = 'x', decision_reasoning = '12345678901234567890' where id = (select reviewing from t_s) $$,
  'P0001', 'case_already_decided', 'T-BR10-1 a Resolved case cannot be decided again');
select throws_ok($$ update public.reports set status = 'Under Review' where id = (select escalated from t_s) $$, 'P0001', 'case_already_decided', 'T-BR10-1 a Dismissed case cannot go back to Under Review');
select throws_ok($$ update public.reports set description = 'changed later' where id = (select reviewing from t_s) $$, 'P0001', 'case_already_decided', 'T-BR10-1 a decided case cannot be edited');
select lives_ok($$ update public.reports set reporter_id = null where id = (select reviewing from t_s) $$, 'T-BR10-1 a decided case can still be anonymised (account deletion)');

create temp table t_s2 on commit drop as select
  tests.new_report(tests.u('thabo'), tests.org('dorljota'), 'Overcharging', 'ST 4 GP') as a,
  tests.new_report(tests.u('thabo'), tests.org('metrobus'), 'Sexual Misconduct', 'ST 5 GP') as b;
select throws_ok($$ update public.reports set status = 'Resolved', admin_decision = 'x', decision_reasoning = '12345678901234567890' where id = (select a from t_s2) $$,
  'P0001', 'invalid_status_change', 'T-BR10-1 Submitted cannot jump to Resolved');
select throws_ok($$ update public.reports set status = 'Escalated' where id = (select a from t_s2) $$, 'P0001', 'invalid_status_change', 'T-BR10-1 a case cannot be escalated by hand');
select throws_ok($$ update public.reports set status = 'Submitted' where id = (select b from t_s2) $$, 'P0001', 'invalid_status_change', 'T-BR10-1 Escalated cannot go back to Submitted');
select throws_ok($$ update public.reports set status = 'Dismissed', admin_decision = 'x', decision_reasoning = '12345678901234567890' where id = (select b from t_s2) $$,
  'P0001', 'invalid_status_change', 'T-BR10-1 Escalated cannot be dismissed without review first');
select lives_ok($$ update public.reports set description = 'edited while open' where id = (select a from t_s2) $$, 'T-BR10-1 an open case can have other fields changed by the system');
select isnt((select updated_at from public.reports where id = (select a from t_s2)), (select created_at from public.reports where id = (select a from t_s2)), 'T-BR10-1 updated_at moves on every change');

select * from finish();
rollback;
