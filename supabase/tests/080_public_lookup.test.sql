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

-- T-BR8-1..3 and T-SEC-13a/b: public lookup by vehicle plate. Seed plates: r1 CA 829-102 (Submitted), r4 CA 614-990 (Dismissed), r5 CA 901-334 (Escalated).
select tests.as_user(tests.u('lerato'));
select is((select count(*) from public.public_case_lookup('ca 829-102')), 1::bigint, 'T-BR8-1 a plate is found ignoring case');
select is((select count(*) from public.public_case_lookup('CA829102')), 1::bigint, 'T-BR8-1 a plate is found ignoring spaces and dashes');
select is((select count(*) from public.public_case_lookup('c-a 8 29 - 102')), 1::bigint, 'T-BR8-1 a plate is found with extra spaces and dashes');
select is((select count(*) from public.public_case_lookup('CA')), 0::bigint, 'T-BR8-1 fewer than 3 characters returns nothing');
select is((select count(*) from public.public_case_lookup('--  ')), 0::bigint, 'T-BR8-1 only separators returns nothing');
select is((select count(*) from public.public_case_lookup('ZZ 99 ZZ')), 0::bigint, 'T-BR8-1 an unknown plate returns nothing');
select is((select count(*) from public.public_case_lookup('CA 901-334')), 1::bigint, 'T-BR8-2 an Escalated case is visible');
select is((select count(*) from public.public_case_lookup('CA 614-990')), 0::bigint, 'T-BR8-2 a Dismissed case is hidden from other commuters');
select is(pg_get_function_result('public.public_case_lookup(text)'::regprocedure),
  'TABLE(category text, vehicle_plate text, organization_name text, status text, incident_at timestamp with time zone, description text, admin_decision text, decision_reasoning text)',
  'T-BR8-2 only the public fields are returned (no reporter, media, location, SAPS number or reference)');
select is((select organization_name from public.public_case_lookup('CA 829-102')), 'DORLJOTA', 'T-BR8-2 the organization name is returned');
select tests.as_user(tests.u('thabo'));
select is((select count(*) from public.public_case_lookup('CA 614-990')), 0::bigint, 'T-BR8-2 even the reporter does not see their own Dismissed case here');
select is((select count(*) from public.my_case_view where status = 'Dismissed'), 1::bigint, 'T-BR8-2 the reporter still sees it in their own cases');
select tests.as_anon();
select throws_ok($$ select * from public.public_case_lookup('CA 829-102') $$, '42501', null, 'T-SEC-13b a visitor who is not logged in cannot search');
select tests.as_user(tests.u('sipho'));
select throws_ok($$ select * from public.public_case_lookup('CA 829-102') $$, 'P0001', 'not_authorized', 'T-SEC-13b a Transport Admin cannot use the commuter search');
select tests.as_user(tests.u('lerato'));
select lives_ok($$ select * from public.public_case_lookup('CA 829-102') $$, 'T-SEC-13a a logged-in commuter can search');
select tests.as_postgres();
delete from public.rate_events;
select tests.as_user(tests.u('lerato'));
select lives_ok($$ select public.public_case_lookup('ZZZ ' || g) from generate_series(1, 30) g $$, 'T-BR8-3 30 searches in an hour are accepted');
select throws_ok($$ select * from public.public_case_lookup('ZZZ 31') $$, 'P0001', 'rate_limit_search', 'T-BR8-3 the 31st search in an hour is rejected');
select tests.as_postgres();
select is((select count(*) from public.rate_events where user_id = tests.u('lerato') and kind = 'plate_search'), 30::bigint, 'T-BR8-3 searches were recorded, and the rejected one was not');

select * from finish();
rollback;
