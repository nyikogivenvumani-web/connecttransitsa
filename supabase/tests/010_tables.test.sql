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

-- T-DB-1: every table and column in plan Section 8.1 exists; sign-up creates the profile rows.
-- T-DB-2: the role, status, phone and similar checks reject bad values.
select has_table('public', t, 'T-DB-1 table ' || t || ' exists')
from unnest(array['users','user_private','organizations','org_admins','reports','report_media','evidence_requests','sos_events',
  'sos_locations','saps_queue','notification_outbox','push_tokens','rate_events','case_counters']) t;

select columns_are('public', 'users', array['id','role','full_name','email','phone_number','preferred_language','created_at'], 'T-DB-1 users columns');
select columns_are('public', 'user_private', array['user_id','id_number','created_at'], 'T-DB-1 user_private columns');
select columns_are('public', 'organizations', array['id','name','type','is_verified','is_oversight'], 'T-DB-1 organizations columns');
select columns_are('public', 'org_admins', array['user_id','organization_id'], 'T-DB-1 org_admins columns');
select columns_are('public', 'reports', array['id','case_ref','reporter_id','organization_id','unlisted_entity_name','vehicle_plate','plate_normalized',
  'category','custom_category_text','description','incident_at','location_lat','location_lng','location_text','saps_case_number','status',
  'is_escalated','admin_decision','decision_reasoning','decided_at','created_at','updated_at'], 'T-DB-1 reports columns');
select columns_are('public', 'report_media', array['id','report_id','kind','storage_path','size_bytes','duration_seconds','request_id','created_at'], 'T-DB-1 report_media columns');
select columns_are('public', 'evidence_requests', array['id','report_id','message','status','requested_by','reply_note','created_at','answered_at'], 'T-DB-1 evidence_requests columns');
select columns_are('public', 'sos_events', array['id','user_id','share_token','status','started_at','stopped_at','last_lat','last_lng','last_recorded_at','used_cached_location','dispatch_ms'], 'T-DB-1 sos_events columns');
select columns_are('public', 'sos_locations', array['id','sos_event_id','lat','lng','recorded_at'], 'T-DB-1 sos_locations columns');
select columns_are('public', 'saps_queue', array['id','kind','report_id','sos_event_id','payload','status','webhook_status','webhook_attempts','created_at','purge_after'], 'T-DB-1 saps_queue columns');
select columns_are('public', 'notification_outbox', array['id','user_id','report_id','channel','body','status','created_at'], 'T-DB-1 notification_outbox columns');
select columns_are('public', 'push_tokens', array['user_id','token'], 'T-DB-1 push_tokens columns');
select columns_are('public', 'rate_events', array['id','user_id','kind','created_at'], 'T-DB-1 rate_events columns');
select columns_are('public', 'case_counters', array['year','last_value'], 'T-DB-1 case_counters columns');

select col_not_null('public', 'reports', 'vehicle_plate', 'T-DB-1 reports.vehicle_plate is required');
select col_default_is('public', 'reports', 'status', 'Submitted', 'T-DB-1 reports.status defaults to Submitted');
select col_default_is('public', 'users', 'role', 'commuter', 'T-DB-1 users.role defaults to commuter');
select col_is_unique('public', 'organizations', 'name', 'T-DB-1 organization names are unique');
select col_is_unique('public', 'user_private', 'id_number', 'T-DB-1 ID numbers are unique');

-- sign-up creates the rows (the real sign-up is GoTrue inserting into auth.users)
insert into auth.users (instance_id, id, aud, role, email, phone, raw_app_meta_data, raw_user_meta_data)
values ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
  'New.Person@Example.co.za', '27829990001', '{}', jsonb_build_object('full_name', 'New Person', 'id_number', tests.sa_id('900101500008')));
select is((select count(*) from public.users where id = 'a0000000-0000-0000-0000-000000000001'), 1::bigint, 'T-DB-1 sign-up creates a users row');
select is((select count(*) from public.user_private where user_id = 'a0000000-0000-0000-0000-000000000001'), 1::bigint, 'T-DB-1 sign-up creates a user_private row');
select is((select role from public.users where id = 'a0000000-0000-0000-0000-000000000001'), 'commuter', 'T-DB-1 a self sign-up is always a commuter');
select is((select email from public.users where id = 'a0000000-0000-0000-0000-000000000001'), 'new.person@example.co.za', 'T-DB-1 the email is stored in lower case');
select is((select phone_number from public.users where id = 'a0000000-0000-0000-0000-000000000001'), '+27829990001', 'T-DB-1 the phone number is stored with +');

-- a role asked for in the (client-controlled) user metadata is ignored; only app metadata can set a role
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
values ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated',
  'sneaky@example.co.za', '{}', jsonb_build_object('full_name', 'Sneaky', 'role', 'system_admin', 'id_number', tests.sa_id('910202500008')));
select is((select role from public.users where id = 'a0000000-0000-0000-0000-000000000002'), 'commuter', 'T-DB-1 metadata from the client cannot make an admin');

-- T-DB-2
select throws_ok($$ update public.users set role = 'boss' where id = tests.u('thabo') $$, '23514', null, 'T-DB-2 an unknown role is rejected');
select throws_ok($$ update public.users set phone_number = '0821234567' where id = tests.u('thabo') $$, '23514', null, 'T-DB-2 a phone number without +27 is rejected');
select throws_ok($$ update public.users set preferred_language = 'zu' where id = tests.u('thabo') $$, '23514', null, 'T-DB-2 only English is allowed in v1');
select col_has_check('public', 'reports', 'status', 'T-DB-2 reports.status has a check constraint');
select throws_ok($$ update public.reports set status = 'Closed' where id = tests.rep(1) $$, 'P0001', 'invalid_status_change', 'T-DB-2 an unknown status is rejected');
select throws_ok($$ update public.reports set category = 'Littering' where id = tests.rep(1) $$, '23514', null, 'T-DB-2 an unknown category is rejected');
select throws_ok($$ insert into public.organizations (name, type) values ('Taxi Co', 'Rail') $$, '23514', null, 'T-DB-2 an unknown organization type is rejected');
select throws_ok($$ insert into public.organizations (name, type, is_oversight) values ('Second Oversight', 'Taxi', true) $$, '23505', null, 'T-DB-2 only one Other/Unregistered row can exist');
select throws_ok($$ insert into public.user_private (user_id, id_number) values (tests.u('sipho'), '12345') $$, '23514', null, 'T-DB-2 an ID number must be 13 digits');
select throws_ok($$ select tests.new_report(tests.u('thabo'), tests.org('dorljota'), 'Other') $$, '23514', null, 'T-DB-2 category Other needs custom text');

select * from finish();
rollback;
