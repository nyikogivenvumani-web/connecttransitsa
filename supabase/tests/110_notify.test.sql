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

-- T-US3-3: a status change creates push (and SMS when there is a phone number) notifications with the exact text.
delete from public.notification_outbox;
create temp table t_n on commit drop as select
  tests.new_report(tests.u('thabo'), tests.org('dorljota'), 'Overcharging', 'NT 1 GP') as with_phone,
  tests.new_report(tests.u('lerato'), tests.org('dorljota'), 'Overcharging', 'NT 2 GP') as no_phone,
  tests.new_report(tests.u('thabo'), tests.org('dorljota'), 'Overcharging', 'NT 3 GP') as anonymous;
update public.users set phone_number = null where id = tests.u('lerato');
update public.reports set reporter_id = null where id = (select anonymous from t_n);
update public.reports set status = 'Under Review' where id in (select with_phone from t_n union select no_phone from t_n union select anonymous from t_n);
select is((select count(*) from public.notification_outbox where report_id = (select with_phone from t_n)), 2::bigint, 'T-US3-3 a commuter with a phone gets a push and an SMS');
select is((select count(*) from public.notification_outbox where report_id = (select no_phone from t_n)), 1::bigint, 'T-US3-3 a commuter without a phone gets only a push');
select is((select count(*) from public.notification_outbox where report_id = (select anonymous from t_n)), 0::bigint, 'T-US3-3 nothing is sent when the reporter is unknown');
select is((select body from public.notification_outbox where report_id = (select with_phone from t_n) and channel = 'push'),
  'Update on Case #' || (select case_ref from public.reports where id = (select with_phone from t_n)) || ': Status changed to Under Review. Tap to view formal decision.', 'T-US3-3 the text is exactly as in PRD 4.5');
select is((select array_agg(channel order by channel) from public.notification_outbox where report_id = (select with_phone from t_n)), array['push','sms'], 'T-US3-3 the channels are push and sms');
select is((select count(*) from public.notification_outbox where status <> 'pending'), 0::bigint, 'T-US3-3 new notifications are pending');
update public.reports set status = 'Resolved', admin_decision = 'Warned', decision_reasoning = 'The CCTV confirms the overcharging complaint.' where id = (select with_phone from t_n);
select is((select count(*) from public.notification_outbox where report_id = (select with_phone from t_n)), 4::bigint, 'T-US3-3 every later status change notifies again');
update public.reports set description = 'no status change here' where id = (select no_phone from t_n);
select is((select count(*) from public.notification_outbox where report_id = (select no_phone from t_n)), 1::bigint, 'T-US3-3 a change that is not a status change sends nothing');

select * from finish();
rollback;
