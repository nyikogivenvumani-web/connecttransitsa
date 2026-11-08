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

-- T-BR1-1: Identity Masking. Transport Admins read cases only through admin_case_view, which has no commuter columns.
select columns_are('public', 'admin_case_view', array['id','case_ref','organization_id','organization_name','unlisted_entity_name','vehicle_plate','category',
  'custom_category_text','description','incident_at','location_lat','location_lng','location_text','status','is_escalated','admin_decision','decision_reasoning',
  'decided_at','created_at','updated_at','evidence_request_id','evidence_request_status','evidence_request_message','evidence_reply_note'], 'T-BR1-1 admin_case_view has exactly the allowed columns');
select is((select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'admin_case_view'
  and column_name in ('reporter_id','full_name','phone_number','email','id_number','home_address','user_id')), 0::bigint, 'T-BR1-1 no commuter column is in the view');
select tests.as_user(tests.u('sipho'));
select is((select count(*) from public.admin_case_view), 3::bigint, 'T-BR1-1 sipho sees the 3 DORLJOTA cases');
select is((select count(*) from public.admin_case_view where organization_id <> tests.org('dorljota')), 0::bigint, 'T-BR1-1 sipho sees no other organization');
select is((select count(*) from public.reports), 0::bigint, 'T-BR1-1 sipho cannot read the reports table directly');
select is((select count(*) from public.users where id <> tests.u('sipho')), 0::bigint, 'T-BR1-1 sipho cannot read other profiles');
select tests.as_user(tests.u('nomsa'));
select is((select count(*) from public.admin_case_view), 2::bigint, 'T-BR1-1 nomsa sees the 2 Metrobus cases');
select tests.as_user(tests.u('lerato'));
select is((select count(*) from public.admin_case_view), 0::bigint, 'T-BR1-1 a commuter sees nothing in the admin view');
select tests.as_user(tests.u('saps'));
select is((select count(*) from public.admin_case_view), 0::bigint, 'T-BR1-1 SAPS sees nothing in the admin view');
select tests.as_anon();
select throws_ok($$ select * from public.admin_case_view $$, '42501', null, 'T-BR1-1 a visitor cannot read the admin view');
select tests.as_user(tests.u('sipho'));
select is((select count(*) from public.admin_case_view where id = tests.rep(6)), 0::bigint, 'T-BR1-1 an Other/Unregistered report is not visible to an ordinary organization');

select * from finish();
rollback;
