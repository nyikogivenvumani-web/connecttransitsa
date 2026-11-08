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

-- T-SEC-1a..17b: one allow and one deny per row of plan Section 9, acting as the seed users. (SEC13 is in 080, SEC21/22 in 150, SEC15/16 in 130.)
-- An unverified commuter used by SEC4b
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
values ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-0000000000d1', 'authenticated', 'authenticated', 'unverified@example.co.za', '{}',
  jsonb_build_object('full_name', 'Un Verified', 'id_number', tests.sa_id('950505500008')));
update auth.users set email_confirmed_at = null, phone_confirmed_at = null where id = 'a0000000-0000-0000-0000-0000000000d1';

-- SEC1 users: read own row only, and only the listed columns
select tests.as_user(tests.u('thabo'));
select is((select count(*) from public.users), 1::bigint, 'T-SEC-1a a user reads their own profile row');
select is((select full_name from public.users), 'Thabo Mokoena', 'T-SEC-1a and it is theirs');
select is((select count(*) from public.users where id = tests.u('lerato')), 0::bigint, 'T-SEC-1b a user cannot read someone else''s profile');
select throws_ok($$ select created_at from public.users $$, '42501', null, 'T-SEC-1b a column outside the list is refused');
select tests.as_anon();
select throws_ok($$ select * from public.users $$, '42501', null, 'T-SEC-1b a visitor cannot read profiles');
-- SEC2 user_private
select tests.as_service();
select is((select count(*) from public.user_private), 7::bigint, 'T-SEC-2a the service role can read ID numbers');
select tests.as_user(tests.u('thabo'));
select throws_ok($$ select id_number from public.user_private $$, '42501', null, 'T-SEC-2b a user cannot read ID numbers, not even their own');
select tests.as_user(tests.u('saps'));
select throws_ok($$ select * from public.user_private $$, '42501', null, 'T-SEC-2b SAPS cannot read the ID table directly');
select tests.as_anon();
select throws_ok($$ select * from public.user_private $$, '42501', null, 'T-SEC-2b a visitor cannot read the ID table');
-- SEC3 users: update language only
select tests.as_user(tests.u('thabo'));
select lives_ok($$ update public.users set preferred_language = 'en' where id = tests.u('thabo') $$, 'T-SEC-3a a user can update their language');
select throws_ok($$ update public.users set role = 'system_admin' where id = tests.u('thabo') $$, '42501', null, 'T-SEC-3b a user cannot change their own role');
select throws_ok($$ update public.users set email = 'x@example.com' where id = tests.u('thabo') $$, '42501', null, 'T-SEC-3b a user cannot change their email');
select throws_ok($$ update public.users set phone_number = '+27829999999' where id = tests.u('thabo') $$, '42501', null, 'T-SEC-3b a user cannot change their phone');
select throws_ok($$ update public.users set full_name = 'Someone Else' where id = tests.u('thabo') $$, '42501', null, 'T-SEC-3b a user cannot change their name');
select tests.as_postgres();
select tests.as_user(tests.u('thabo'));
select is(tests.affected($q$update public.users set preferred_language = 'en' where id = tests.u('lerato')$q$), 0::bigint, 'T-SEC-3b a user cannot update someone else''s row');

-- SEC4 reports: create
select tests.as_user(tests.u('thabo'));
select lives_ok($$ insert into public.reports (id, organization_id, vehicle_plate, category, description, incident_at)
  values ('20000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-000000000001', 'SEC 4 GP', 'Overcharging', 'The driver charged double', now() - interval '1 hour') $$,
  'T-SEC-4a a verified commuter can create a report for themselves');
select is((select reporter_id from public.my_case_view where id = '20000000-0000-0000-0000-0000000000a1'), tests.u('thabo'), 'T-SEC-4a reporter_id defaults to the caller');
select is((select status from public.my_case_view where id = '20000000-0000-0000-0000-0000000000a1'), 'Submitted', 'T-SEC-4a the new report is Submitted');
select throws_ok($$ insert into public.reports (id, reporter_id, organization_id, vehicle_plate, category, description, incident_at)
  values ('20000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'SEC 4 GP', 'Overcharging', 'Pretending to be lerato', now() - interval '1 hour') $$,
  '42501', null, 'T-SEC-4b a user cannot create a report as someone else');
select throws_ok($$ insert into public.reports (id, organization_id, vehicle_plate, category, description, incident_at, status)
  values ('20000000-0000-0000-0000-0000000000a3', '10000000-0000-0000-0000-000000000001', 'SEC 4 GP', 'Overcharging', 'Choosing a status', now() - interval '1 hour', 'Resolved') $$,
  '42501', null, 'T-SEC-4b a user cannot choose the status');
select throws_ok($$ insert into public.reports (id, organization_id, vehicle_plate, category, description, incident_at, case_ref)
  values ('20000000-0000-0000-0000-0000000000a4', '10000000-0000-0000-0000-000000000001', 'SEC 4 GP', 'Overcharging', 'Choosing a case ref', now() - interval '1 hour', 'TC-1-1') $$,
  '42501', null, 'T-SEC-4b a user cannot choose the case reference');
select tests.as_user(tests.u('sipho'));
select throws_ok($$ insert into public.reports (id, organization_id, vehicle_plate, category, description, incident_at, reporter_id)
  values ('20000000-0000-0000-0000-0000000000a5', '10000000-0000-0000-0000-000000000001', 'SEC 4 GP', 'Overcharging', 'Admin cannot report', now() - interval '1 hour', '00000000-0000-0000-0000-000000000003') $$,
  '42501', null, 'T-SEC-4b a Transport Admin cannot create a report');
select tests.as_user('a0000000-0000-0000-0000-0000000000d1');
select throws_ok($$ insert into public.reports (id, organization_id, vehicle_plate, category, description, incident_at, reporter_id)
  values ('20000000-0000-0000-0000-0000000000a6', '10000000-0000-0000-0000-000000000001', 'SEC 4 GP', 'Overcharging', 'Not verified', now() - interval '1 hour', 'a0000000-0000-0000-0000-0000000000d1') $$,
  '42501', null, 'T-SEC-4b a commuter with no verified email or phone cannot report');
select tests.as_anon();
select throws_ok($$ insert into public.reports (id, organization_id, vehicle_plate, category, description, incident_at)
  values ('20000000-0000-0000-0000-0000000000a7', '10000000-0000-0000-0000-000000000001', 'SEC 4 GP', 'Overcharging', 'Visitor', now() - interval '1 hour') $$,
  '42501', null, 'T-SEC-4b a visitor cannot create a report');

-- SEC5 my_case_view
select tests.as_user(tests.u('thabo'));
select is((select count(*) from public.my_case_view), 7::bigint, 'T-SEC-5a the reporter sees all their cases (6 seed + 1 new)');
select tests.as_user(tests.u('lerato'));
select is((select count(*) from public.my_case_view), 0::bigint, 'T-SEC-5b another commuter sees none of them');
select tests.as_user(tests.u('sipho'));
select is((select count(*) from public.my_case_view), 0::bigint, 'T-SEC-5b a Transport Admin sees none through the commuter view');
select tests.as_anon();
select throws_ok($$ select * from public.my_case_view $$, '42501', null, 'T-SEC-5b a visitor cannot read it');

-- SEC6 no direct update or delete
select tests.as_user(tests.u('thabo'));
select throws_ok($$ update public.reports set description = 'edit' where id = tests.rep(1) $$, '42501', null, 'T-SEC-6b a reporter cannot update a report directly');
select throws_ok($$ delete from public.reports where id = tests.rep(1) $$, '42501', null, 'T-SEC-6b a reporter cannot delete a report');
select tests.as_user(tests.u('sipho'));
select throws_ok($$ update public.reports set status = 'Resolved' where id = tests.rep(1) $$, '42501', null, 'T-SEC-6b an admin cannot update a report directly');
select tests.as_user(tests.u('sysadmin'));
select throws_ok($$ delete from public.reports where id = tests.rep(1) $$, '42501', null, 'T-SEC-6b even a System Admin cannot delete a report through the API');
select tests.as_user(tests.u('saps'));
select throws_ok($$ update public.reports set status = 'Resolved' where id = tests.rep(5) $$, '42501', null, 'T-SEC-6b SAPS cannot update a report directly');

-- SEC7 admin_case_view
select tests.as_user(tests.u('sipho'));
select is((select count(*) from public.admin_case_view where id = tests.rep(1)), 1::bigint, 'T-SEC-7a an admin sees their organization''s case');
select tests.as_user(tests.u('nomsa'));
select is((select count(*) from public.admin_case_view where id = tests.rep(1)), 0::bigint, 'T-SEC-7b an admin of another organization does not');
select tests.as_user(tests.u('thabo'));
select is((select count(*) from public.admin_case_view), 0::bigint, 'T-SEC-7b a commuter sees nothing, not even their own case');

-- SEC8 admin_update_case
select tests.as_user(tests.u('sipho'));
select lives_ok($$ select public.admin_update_case(tests.rep(1), 'Under Review') $$, 'T-SEC-8a an admin moves their own case to Under Review');
select is((select status from public.admin_case_view where id = tests.rep(1)), 'Under Review', 'T-SEC-8a the status changed');
select throws_ok($$ select public.admin_update_case(tests.rep(1), 'Resolved', 'Warned', 'too short') $$, '23514', null, 'T-SEC-8a BR5 still applies through the function');
select lives_ok($$ select public.admin_update_case(tests.rep(1), 'Resolved', 'Operator warned', 'CCTV footage confirms the overcharging.') $$, 'T-SEC-8a an admin can decide their case');
select throws_ok($$ select public.admin_update_case(tests.rep(4), 'Under Review') $$, 'P0001', 'not_authorized', 'T-SEC-8b an admin cannot touch another organization''s case');
select throws_ok($$ select public.admin_update_case(tests.rep(1), 'Dismissed', 'x', 'CCTV footage confirms the overcharging.') $$, 'P0001', 'case_already_decided', 'T-SEC-8b a decided case stays decided');
select tests.as_user(tests.u('thabo'));
select throws_ok($$ select public.admin_update_case(tests.rep(5), 'Under Review') $$, 'P0001', 'not_authorized', 'T-SEC-8b a commuter cannot use it');
select tests.as_anon();
select throws_ok($$ select public.admin_update_case(tests.rep(5), 'Under Review') $$, '42501', null, 'T-SEC-8b a visitor cannot use it');

-- SEC9 saps views and queue
select tests.as_user(tests.u('saps'));
select is((select count(*) from public.saps_case_view where id = tests.rep(5)), 1::bigint, 'T-SEC-9a SAPS sees the escalated case');
select is((select count(*) from public.saps_case_view where id = tests.rep(1)), 0::bigint, 'T-SEC-9a SAPS does not see a non-escalated case');
select is((select reporter_id_number from public.saps_case_view where id = tests.rep(5)), '9803145009088', 'T-SEC-9a SAPS sees the reporter ID number of an escalated case');
select is((select reporter_full_name from public.saps_case_view where id = tests.rep(5)), 'Thabo Mokoena', 'T-SEC-9a SAPS sees the reporter name of an escalated case');
select cmp_ok((select count(*) from public.saps_queue), '>=', 1::bigint, 'T-SEC-9a SAPS reads the queue');
select lives_ok($$ update public.saps_queue set status = 'acknowledged' where report_id = tests.rep(5) $$, 'T-SEC-9a SAPS can acknowledge');
select throws_ok($$ update public.saps_queue set payload = '{}' where report_id = tests.rep(5) $$, '42501', null, 'T-SEC-9b SAPS cannot change the payload');
select tests.as_user(tests.u('sipho'));
select is((select count(*) from public.saps_case_view), 0::bigint, 'T-SEC-9b a Transport Admin cannot see the SAPS view');
select is((select count(*) from public.saps_queue), 0::bigint, 'T-SEC-9b a Transport Admin cannot see the SAPS queue');
select tests.as_user(tests.u('thabo'));
select is((select count(*) from public.saps_queue), 0::bigint, 'T-SEC-9b a commuter cannot see the SAPS queue, even for their own report');
select is((select count(*) from public.saps_case_view), 0::bigint, 'T-SEC-9b a commuter cannot see the SAPS view');
select is(tests.affected($q$update public.saps_queue set status = 'acknowledged'$q$), 0::bigint, 'T-SEC-9b a commuter cannot acknowledge');
select tests.as_anon();
select throws_ok($$ select * from public.saps_case_view $$, '42501', null, 'T-SEC-9b a visitor cannot read the SAPS view');

-- SEC10 organizations
select tests.as_user(tests.u('thabo'));
select is((select count(*) from public.organizations), 6::bigint, 'T-SEC-10a a logged-in user lists the organizations');
select tests.as_anon();
select throws_ok($$ select * from public.organizations $$, '42501', null, 'T-SEC-10b a visitor cannot list them');

-- SEC11 organizations and org_admins: System Admin writes
select tests.as_user(tests.u('sysadmin'));
select lives_ok($$ insert into public.organizations (name, type) values ('Golden Arrow', 'Bus') $$, 'T-SEC-11a a System Admin can add an organization');
select lives_ok($$ update public.organizations set name = 'Golden Arrow Bus' where name = 'Golden Arrow' $$, 'T-SEC-11a and rename it');
select lives_ok($$ insert into public.org_admins (user_id, organization_id) values ('a0000000-0000-0000-0000-0000000000d1', '10000000-0000-0000-0000-000000000003') $$, 'T-SEC-11a and assign an admin');
select tests.as_user(tests.u('sipho'));
select throws_ok($$ insert into public.organizations (name, type) values ('Rogue Taxi', 'Taxi') $$, '42501', null, 'T-SEC-11b a Transport Admin cannot add an organization');
select throws_ok($$ insert into public.org_admins (user_id, organization_id) values ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002') $$, '42501', null, 'T-SEC-11b a Transport Admin cannot change their organization');
select tests.as_user(tests.u('thabo'));
select is(tests.affected($q$update public.organizations set name = 'Mine' where name = 'Putco'$q$), 0::bigint, 'T-SEC-11b a commuter cannot edit organizations');
select tests.as_user(tests.u('sipho'));
select is((select count(*) from public.org_admins), 1::bigint, 'T-SEC-11b an admin sees only their own org_admins row');

-- SEC12 tag_oversight_report
select tests.as_user(tests.u('sysadmin'));
select is((select count(*) from public.admin_case_view where id = tests.rep(6)), 1::bigint, 'T-SEC-12a a System Admin sees the Other/Unregistered queue');
select lives_ok($$ select public.tag_oversight_report(tests.rep(6), tests.org('uber')) $$, 'T-SEC-12a a System Admin can tag it to an organization');
select is((select organization_name from public.admin_case_view where id = tests.rep(6)), null, 'T-SEC-12a it left the oversight queue (a System Admin no longer sees it there)');
select tests.as_postgres();
select is((select organization_id from public.reports where id = tests.rep(6)), tests.org('uber'), 'T-SEC-12a the organization changed');
select tests.as_user(tests.u('sysadmin'));
select throws_ok($$ select public.tag_oversight_report(tests.rep(6), tests.org('bolt')) $$, 'P0001', 'not_oversight_report', 'T-SEC-12b only oversight reports can be tagged');
select tests.as_user(tests.u('sipho'));
select throws_ok($$ select public.tag_oversight_report(tests.rep(6), tests.org('bolt')) $$, 'P0001', 'not_authorized', 'T-SEC-12b a Transport Admin cannot tag');
select tests.as_user(tests.u('thabo'));
select throws_ok($$ select public.tag_oversight_report(tests.rep(6), tests.org('bolt')) $$, 'P0001', 'not_authorized', 'T-SEC-12b a commuter cannot tag');

-- SEC14 sos
select tests.as_user(tests.u('thabo'));
select lives_ok($$ insert into public.sos_events (id, user_id, last_lat, last_lng, last_recorded_at) values ('30000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', -26.2, 28.0, now()) $$, 'T-SEC-14a a user starts their own SOS');
select lives_ok($$ insert into public.sos_locations (sos_event_id, lat, lng) values ('30000000-0000-0000-0000-0000000000a1', -26.21, 28.01) $$, 'T-SEC-14a and adds locations to it');
select lives_ok($$ update public.sos_events set last_lat = -26.22, last_lng = 28.02, last_recorded_at = now() where id = '30000000-0000-0000-0000-0000000000a1' $$, 'T-SEC-14a and updates its position');
select lives_ok($$ update public.sos_events set status = 'stopped', stopped_at = now() where id = '30000000-0000-0000-0000-0000000000a1' $$, 'T-SEC-14a and stops it');
select throws_ok($$ insert into public.sos_events (id, user_id) values ('30000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000002') $$, '42501', null, 'T-SEC-14b a user cannot start an SOS for someone else');
select throws_ok($$ insert into public.sos_events (id, user_id, share_token) values ('30000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000001', 'chosen') $$, '42501', null, 'T-SEC-14b a user cannot choose the share token');
select tests.as_user(tests.u('lerato'));
select is((select count(*) from public.sos_events), 0::bigint, 'T-SEC-14b another commuter cannot read it');
select is((select count(*) from public.sos_locations), 0::bigint, 'T-SEC-14b nor its locations');
select throws_ok($$ insert into public.sos_locations (sos_event_id, lat, lng) values ('30000000-0000-0000-0000-0000000000a1', 0, 0) $$, '42501', null, 'T-SEC-14b nor write to it');
select is(tests.affected($q$update public.sos_events set status = 'stopped' where id = '30000000-0000-0000-0000-0000000000a1'$q$), 0::bigint, 'T-SEC-14b nor stop it');
select tests.as_user(tests.u('saps'));
select is((select count(*) from public.sos_events), 1::bigint, 'T-SEC-14a SAPS reads SOS events');
select tests.as_postgres();
select is((select status from public.sos_events where id = '30000000-0000-0000-0000-0000000000a1'), 'stopped', 'T-SEC-14b the SOS is as its owner left it');
create temp table t_tok as select share_token from public.sos_events where id = '30000000-0000-0000-0000-0000000000a1';
grant select on t_tok to public;
select tests.as_anon();
select is((select count(*) from public.sos_share_view((select share_token from t_tok))), 1::bigint, 'T-SEC-14a a visitor with the share token can open the live page');
select is(pg_get_function_result('public.sos_share_view(text)'::regprocedure), 'TABLE(status text, lat double precision, lng double precision, recorded_at timestamp with time zone)', 'T-SEC-14a the live page gets coordinates and status only');
select is((select count(*) from public.sos_share_view('wrongtoken')), 0::bigint, 'T-SEC-14b a wrong token returns nothing');
select throws_ok($$ select * from public.sos_events $$, '42501', null, 'T-SEC-14b a visitor cannot read the table');

-- SEC17 push tokens, outbox, rate events
select tests.as_user(tests.u('thabo'));
select lives_ok($$ select public.register_push_token('ExponentPushToken[abc123]') $$, 'T-SEC-17a a user registers their own push token');
select lives_ok($$ select public.register_push_token('ExponentPushToken[abc123]') $$, 'T-SEC-17a registering the same token twice is fine');
select is((select count(*) from public.push_tokens), 1::bigint, 'T-SEC-17a the user reads their own token');
select throws_ok($$ select public.register_push_token('not a token') $$, 'P0001', 'invalid_push_token', 'T-SEC-17b a malformed token is rejected');
select throws_ok($$ insert into public.push_tokens (user_id, token) values ('00000000-0000-0000-0000-000000000002', 'ExponentPushToken[zzz]') $$, '42501', null, 'T-SEC-17b a user cannot register a token for someone else');
select tests.as_user(tests.u('lerato'));
select is((select count(*) from public.push_tokens), 0::bigint, 'T-SEC-17b another user cannot read the token');
select throws_ok($$ select * from public.notification_outbox $$, '42501', null, 'T-SEC-17b a user cannot read the notification outbox');
select throws_ok($$ select * from public.rate_events $$, '42501', null, 'T-SEC-17b a user cannot read rate events');
select throws_ok($$ insert into public.rate_events (user_id, kind) values ('00000000-0000-0000-0000-000000000002', 'report') $$, '42501', null, 'T-SEC-17b a user cannot write rate events');
select tests.as_anon();
select throws_ok($$ select * from public.push_tokens $$, '42501', null, 'T-SEC-17b a visitor cannot read tokens');

select * from finish();
rollback;
