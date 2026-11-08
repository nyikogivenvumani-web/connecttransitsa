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

-- T-BR12-1..3, T-SEC-21a/b, T-SEC-22a/b
create temp table t_e on commit drop as select
  tests.new_report(tests.u('thabo'), tests.org('dorljota'), 'Overcharging', 'EV 1 GP') as ur,        -- will be Under Review (DORLJOTA)
  tests.new_report(tests.u('thabo'), tests.org('metrobus'), 'Sexual Misconduct', 'EV 2 GP') as esc,  -- Escalated (Metrobus)
  tests.new_report(tests.u('thabo'), tests.org('dorljota'), 'Overcharging', 'EV 3 GP') as sub,       -- Submitted
  tests.new_report(tests.u('thabo'), tests.org('dorljota'), 'Overcharging', 'EV 4 GP') as nouser;    -- reporter removed
grant select on t_e to public;
update public.reports set status = 'Under Review' where id = (select ur from t_e);
update public.reports set reporter_id = null where id = (select nouser from t_e);
update public.reports set status = 'Under Review' where id = (select nouser from t_e);
delete from public.notification_outbox;

-- T-BR12-1: who and when
select tests.as_user(tests.u('sipho'));
select lives_ok($$ select public.request_evidence((select ur from t_e), 'Please send a clearer photo of the vehicle number plate.') $$, 'T-BR12-1 the admin can ask for evidence on an Under Review case');
select is((select evidence_request_status from public.admin_case_view where id = (select ur from t_e)), 'open', 'T-BR12-1 the admin view shows the open request');
select is((select evidence_request_message from public.admin_case_view where id = (select ur from t_e)), 'Please send a clearer photo of the vehicle number plate.', 'T-BR12-1 and its message');
select throws_ok($$ select public.request_evidence((select ur from t_e), 'A second request while one is still open.') $$, 'P0001', 'request_already_open', 'T-BR12-1 a second open request is rejected');
select throws_ok($$ select public.request_evidence((select sub from t_e), 'This case has not been opened for review yet.') $$, 'P0001', 'request_case_status', 'T-BR12-1 a Submitted case is rejected');
select throws_ok($$ select public.request_evidence(tests.rep(3), 'This case is already resolved, nothing to add.') $$, 'P0001', 'request_case_status', 'T-BR12-1 a Resolved case is rejected');
select throws_ok($$ select public.request_evidence((select esc from t_e), 'This case belongs to Metrobus not DORLJOTA.') $$, 'P0001', 'not_authorized', 'T-BR12-1 an admin of another organization is rejected');
select tests.as_user(tests.u('nomsa'));
select lives_ok($$ select public.request_evidence((select esc from t_e), 'Please add the time you boarded the bus in a note.') $$, 'T-BR12-1 an Escalated case can be asked for evidence');
select throws_ok($$ select public.request_evidence(tests.rep(4), 'This case is already dismissed, nothing to add.') $$, 'P0001', 'request_case_status', 'T-BR12-1 a Dismissed case is rejected');
select tests.as_postgres();
update public.evidence_requests set status = 'cancelled' where report_id = (select ur from t_e);
select tests.as_user(tests.u('sipho'));
select throws_ok($$ select public.request_evidence((select ur from t_e), 'short') $$, '23514', null, 'T-BR12-1 a message under 20 characters is rejected');
select tests.as_postgres();
update public.evidence_requests set status = 'cancelled' where report_id = (select ur from t_e);
select tests.as_user(tests.u('sipho'));
select throws_ok($$ select public.request_evidence((select ur from t_e), repeat('x', 501)) $$, '23514', null, 'T-BR12-1 a message over 500 characters is rejected');
select lives_ok($$ select public.request_evidence((select ur from t_e), repeat('x', 500)) $$, 'T-BR12-1 exactly 500 characters is accepted (2nd request)');
select tests.as_postgres();
update public.evidence_requests set status = 'cancelled' where report_id = (select ur from t_e) and status = 'open';
select tests.as_user(tests.u('sipho'));
select lives_ok($$ select public.request_evidence((select ur from t_e), 'Third and last request for more evidence.') $$, 'T-BR12-1 a 3rd request is accepted');
select tests.as_postgres();
update public.evidence_requests set status = 'cancelled' where report_id = (select ur from t_e) and status = 'open';
select tests.as_user(tests.u('sipho'));
select throws_ok($$ select public.request_evidence((select ur from t_e), 'A fourth request is one too many here.') $$, 'P0001', 'request_limit', 'T-BR12-1 a 4th request in total is rejected');

-- T-SEC-21
select tests.as_user(tests.u('thabo'));
select throws_ok($$ select public.request_evidence((select ur from t_e), 'A commuter must not ask for evidence.') $$, 'P0001', 'not_authorized', 'T-SEC-21b a commuter cannot request evidence');
select tests.as_user(tests.u('saps'));
select throws_ok($$ select public.request_evidence((select esc from t_e), 'SAPS goes through the admin, not here.') $$, 'P0001', 'not_authorized', 'T-SEC-21b SAPS cannot request evidence');
select tests.as_anon();
select throws_ok($$ select public.request_evidence((select ur from t_e), 'A visitor must not ask for evidence.') $$, '42501', null, 'T-SEC-21b a visitor cannot request evidence');

-- T-BR12-3: notifications and cancelling
select tests.as_postgres();
select is((select count(*) from public.notification_outbox where report_id = (select esc from t_e) and channel = 'push'), 1::bigint, 'T-BR12-3 a request creates a push notification');
select is((select count(*) from public.notification_outbox where report_id = (select esc from t_e) and channel = 'sms'), 1::bigint, 'T-BR12-3 and an SMS (the reporter has a phone number)');
select is((select body from public.notification_outbox where report_id = (select esc from t_e) and channel = 'push'),
  'Update on Case #' || (select case_ref from public.reports where id = (select esc from t_e)) || ': Further evidence requested. Tap to respond.', 'T-BR12-3 with the exact text');
select tests.as_user(tests.u('nomsa'));
select lives_ok($$ select public.cancel_evidence_request(tests.req_of((select esc from t_e))) $$, 'T-BR12-3 the admin can cancel an open request');
select is(tests.req_status((select esc from t_e)), 'cancelled', 'T-BR12-3 it is cancelled');
select throws_ok($$ select public.cancel_evidence_request(tests.req_of((select esc from t_e))) $$, 'P0001', 'request_not_open', 'T-BR12-3 a request that is not open cannot be cancelled');
select tests.as_user(tests.u('sipho'));
select throws_ok($$ select public.cancel_evidence_request(tests.req_of((select esc from t_e))) $$, 'P0001', 'not_authorized', 'T-SEC-21b an admin of another organization cannot cancel');
select tests.as_postgres();
delete from public.notification_outbox;
select tests.as_user(tests.u('sipho'));
select lives_ok($$ select public.request_evidence((select nouser from t_e), 'Reporter was removed, still asking for more.') $$, 'T-BR12-3 a request on a case with no reporter is allowed');
select tests.as_postgres();
select is((select count(*) from public.notification_outbox), 0::bigint, 'T-BR12-3 and sends nothing when reporter_id is null');

-- T-BR12-2 / T-SEC-22: the reporter answers
create temp table t_a on commit drop as select
  tests.new_report(tests.u('thabo'), tests.org('dorljota'), 'Overcharging', 'EV 5 GP') as r;
grant select on t_a to public;
insert into public.report_media (report_id, kind, storage_path, size_bytes)
  select r, 'photo', r || '/o' || g || '.jpg', 1000 from t_a, generate_series(1, 3) g;
update public.reports set status = 'Under Review' where id = (select r from t_a);
select tests.as_user(tests.u('sipho'));
select lives_ok($$ select public.request_evidence((select r from t_a), 'Please send any other photos or a voice note.') $$, 'T-BR12-2 setup: an open request on a case that already has 3 photos');
select tests.as_user(tests.u('lerato'));
select throws_ok($$ select public.answer_evidence_request(tests.req_of((select r from t_a)), 'Not mine', '[]'::jsonb) $$,
  'P0001', 'not_authorized', 'T-SEC-22b another commuter cannot answer');
select tests.as_anon();
select throws_ok($$ select public.answer_evidence_request(gen_random_uuid(), 'x', '[]'::jsonb) $$, '42501', null, 'T-SEC-22b a visitor cannot answer');
select tests.as_user(tests.u('thabo'));
select throws_ok($$ select public.answer_evidence_request(tests.req_of((select r from t_a)), repeat('x', 501), '[]'::jsonb) $$,
  '23514', null, 'T-BR12-2 a note over 500 characters is rejected');
select throws_ok($$ select public.answer_evidence_request(tests.req_of((select r from t_a)), 'Photo attached.',
  jsonb_build_array(jsonb_build_object('kind', 'photo', 'storage_path', 'wrong-folder/x.jpg', 'size_bytes', 1000))) $$, 'P0001', 'invalid_media_path', 'T-BR12-2 a file outside the report folder is rejected');
select throws_ok($$ select public.answer_evidence_request(tests.req_of((select r from t_a)), 'Four photos.',
  (select jsonb_agg(jsonb_build_object('kind', 'photo', 'storage_path', r || '/a' || g || '.jpg', 'size_bytes', 1000)) from t_a, generate_series(1, 4) g)) $$, 'P0001', 'media_limit_photo', 'T-BR12-2 a 4th photo in the answer is rejected');
select lives_ok($$ select public.answer_evidence_request(tests.req_of((select r from t_a)), 'Here are three more photos and a voice note.',
  (select jsonb_agg(m) from (
    select jsonb_build_object('kind', 'photo', 'storage_path', r || '/a' || g || '.jpg', 'size_bytes', 1000) m from t_a, generate_series(1, 3) g
    union all select jsonb_build_object('kind', 'audio', 'storage_path', r || '/a.m4a', 'size_bytes', 2000, 'duration_seconds', 20) from t_a) x)) $$,
  'T-BR12-2 the reporter answers with 3 photos and 1 audio (counted separately from the original 3 photos)');
select is((select status from public.my_case_view where id = (select r from t_a) limit 1), 'Under Review', 'T-BR12-2 the case stays Under Review');
select tests.as_postgres();
select is((select status from public.evidence_requests where report_id = (select r from t_a)), 'answered', 'T-BR12-2 the request is answered');
select isnt((select answered_at from public.evidence_requests where report_id = (select r from t_a)), null, 'T-BR12-2 answered_at is set');
select is((select reply_note from public.evidence_requests where report_id = (select r from t_a)), 'Here are three more photos and a voice note.', 'T-BR12-2 the note is saved');
select is((select count(*) from public.report_media where report_id = (select r from t_a) and request_id is not null), 4::bigint, 'T-BR12-2 the new files are linked to the request');
select is((select count(*) from public.report_media where report_id = (select r from t_a) and request_id is null), 3::bigint, 'T-BR12-2 the original files are untouched');
select tests.as_user(tests.u('thabo'));
select throws_ok($$ select public.answer_evidence_request(tests.req_of((select r from t_a)), 'Answering again.', '[]'::jsonb) $$,
  'P0001', 'request_not_open', 'T-BR12-2 an answered request cannot be answered again');
select tests.as_user(tests.u('sipho'));
select is((select evidence_request_status from public.admin_case_view where id = (select r from t_a)), 'answered', 'T-BR12-3 the admin view shows the request as answered');
select is((select evidence_reply_note from public.admin_case_view where id = (select r from t_a)), 'Here are three more photos and a voice note.', 'T-BR12-3 and the reply note');

-- T-BR12-3: deciding the case closes an open request
select tests.as_postgres();
create temp table t_d on commit drop as select tests.new_report(tests.u('thabo'), tests.org('dorljota'), 'Overcharging', 'EV 6 GP') as r;
grant select on t_d to public;
update public.reports set status = 'Under Review' where id = (select r from t_d);
select tests.as_user(tests.u('sipho'));
select lives_ok($$ select public.request_evidence((select r from t_d), 'Please confirm which route you were on.') $$, 'T-BR12-3 setup: an open request');
select lives_ok($$ select public.admin_update_case((select r from t_d), 'Dismissed', 'No breach', 'The driver was on the correct route per the logs.') $$, 'T-BR12-3 the admin decides the case');
select tests.as_postgres();
select is((select status from public.evidence_requests where report_id = (select r from t_d)), 'closed_by_decision', 'T-BR12-3 the open request is closed by the decision');
select throws_ok($$ select public.answer_evidence_request(tests.req_of((select r from t_d)), 'Too late.', '[]'::jsonb) $$,
  'P0001', 'not_authorized', 'T-BR12-2 a closed request cannot be answered (service role has no commuter identity)');

select * from finish();
rollback;
