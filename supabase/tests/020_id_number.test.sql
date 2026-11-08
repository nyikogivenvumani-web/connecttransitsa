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

-- T-BR6-1: validate_sa_id. T-BR6-2: an invalid ID creates no account.
select ok(public.validate_sa_id(tests.sa_id('900101500008')), 'T-BR6-1 a valid ID number is accepted');
select ok(public.validate_sa_id('9803145009088'), 'T-BR6-1 the seed ID number is valid');
select ok(not public.validate_sa_id(substr(tests.sa_id('900101500008'), 1, 12)), 'T-BR6-1 12 digits is rejected');
select ok(not public.validate_sa_id(tests.sa_id('900101500008') || '1'), 'T-BR6-1 14 digits is rejected');
select ok(not public.validate_sa_id('90010150000AB'), 'T-BR6-1 letters are rejected');
select ok(not public.validate_sa_id(null), 'T-BR6-1 null is rejected');
select ok(not public.validate_sa_id(substr(tests.sa_id('900101500008'), 1, 12) || ((right(tests.sa_id('900101500008'), 1)::int + 1) % 10)::text),
  'T-BR6-1 a wrong check digit is rejected');
select ok(not public.validate_sa_id(tests.sa_id('990231500008')), 'T-BR6-1 an impossible date (31 February) is rejected');
select ok(not public.validate_sa_id(tests.sa_id('900101500028')), 'T-BR6-1 a citizenship digit of 2 is rejected');
select is(public.sa_id_status(tests.sa_id('150615500008')), 'under_age', 'T-BR6-1 a valid ID of someone under 16 is reported as under_age');
select ok(not public.validate_sa_id(tests.sa_id('150615500008')), 'T-BR6-1 someone under 16 is rejected');
select ok(public.validate_sa_id(tests.sa_id(to_char(current_date - interval '16 years', 'YYMMDD') || '500008')), 'T-BR6-1 someone who turns 16 today is accepted');
select ok(not public.validate_sa_id(tests.sa_id(to_char(current_date - interval '16 years' + interval '1 day', 'YYMMDD') || '500008')),
  'T-BR6-1 someone who turns 16 tomorrow is rejected');

select throws_ok($$ insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
  values ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-0000000000b1', 'authenticated', 'authenticated', 'bad1@example.co.za', '{}',
  jsonb_build_object('full_name', 'Bad Id', 'id_number', '1234567890123')) $$, 'P0001', 'invalid_sa_id', 'T-BR6-2 sign-up with an invalid ID fails');
select throws_ok($$ insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
  values ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-0000000000b2', 'authenticated', 'authenticated', 'bad2@example.co.za', '{}',
  jsonb_build_object('full_name', 'Too Young', 'id_number', tests.sa_id('150615500008'))) $$, 'P0001', 'under_age', 'T-BR6-2 sign-up under 16 fails');
select throws_ok($$ insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
  values ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-0000000000b3', 'authenticated', 'authenticated', 'bad3@example.co.za', '{}',
  jsonb_build_object('full_name', 'No Id')) $$, 'P0001', 'invalid_sa_id', 'T-BR6-2 sign-up without an ID fails');
select throws_ok($$ insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
  values ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-0000000000b4', 'authenticated', 'authenticated', 'bad4@example.co.za', '{}',
  jsonb_build_object('id_number', tests.sa_id('900101500008'))) $$, 'P0001', 'name_required', 'T-BR6-2 sign-up without a name fails');
select is((select count(*) from auth.users where email like 'bad_@example.co.za'), 0::bigint, 'T-BR6-2 no account was created for any of them');
select is((select count(*) from public.users where full_name in ('Bad Id', 'Too Young', 'No Id')), 0::bigint, 'T-BR6-2 no profile rows were created either');
select throws_ok($$ insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
  values ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-0000000000b5', 'authenticated', 'authenticated', 'dup@example.co.za', '{}',
  jsonb_build_object('full_name', 'Dup', 'id_number', '9803145009088')) $$, '23505', null, 'T-BR6-2 an ID number that is already registered is rejected');
-- admin accounts are created by the server (app metadata) and need no ID number
select lives_ok($$ insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
  values ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-0000000000c1', 'authenticated', 'authenticated', 'newadmin@example.co.za',
  '{"role":"transport_admin"}', jsonb_build_object('full_name', 'New Admin')) $$, 'T-BR6-2 an admin account needs no ID number');
select is((select role from public.users where id = 'a0000000-0000-0000-0000-0000000000c1'), 'transport_admin', 'T-BR6-2 the admin role comes from app metadata');
select is((select count(*) from public.user_private where user_id = 'a0000000-0000-0000-0000-0000000000c1'), 0::bigint, 'T-BR6-2 an admin has no user_private row');

select * from finish();
rollback;
