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

-- T-BR4-1: media limits (3 photos 5 MB, 1 video 25 MB 30 s, 1 audio 10 MB 60 s), counted separately for the report and for each evidence request.
create temp table t_r on commit drop as select tests.new_report(tests.u('thabo'), tests.org('dorljota'), 'Overcharging', 'MEDIA 1 GP') as id;
select lives_ok($$ insert into public.report_media (report_id, kind, storage_path, size_bytes) select id, 'photo', id || '/p1.jpg', 5242880 from t_r $$, 'T-BR4-1 a photo of exactly 5 MB is accepted');
select lives_ok($$ insert into public.report_media (report_id, kind, storage_path, size_bytes) select id, 'photo', id || '/p2.jpg', 1000 from t_r $$, 'T-BR4-1 the 2nd photo is accepted');
select lives_ok($$ insert into public.report_media (report_id, kind, storage_path, size_bytes) select id, 'photo', id || '/p3.jpg', 1000 from t_r $$, 'T-BR4-1 the 3rd photo is accepted');
select throws_ok($$ insert into public.report_media (report_id, kind, storage_path, size_bytes) select id, 'photo', id || '/p4.jpg', 1000 from t_r $$, 'P0001', 'media_limit_photo', 'T-BR4-1 the 4th photo is rejected');
select throws_ok($$ insert into public.report_media (report_id, kind, storage_path, size_bytes) select id, 'photo', id || '/big.jpg', 5242881 from t_r $$, 'P0001', 'media_too_large', 'T-BR4-1 a photo over 5 MB is rejected');
select throws_ok($$ insert into public.report_media (report_id, kind, storage_path, size_bytes, duration_seconds) select id, 'video', id || '/big.mp4', 26214401, 10 from t_r $$, 'P0001', 'media_too_large', 'T-BR4-1 a video over 25 MB is rejected');
select throws_ok($$ insert into public.report_media (report_id, kind, storage_path, size_bytes, duration_seconds) select id, 'video', id || '/long.mp4', 1000, 31 from t_r $$, 'P0001', 'media_too_long', 'T-BR4-1 a video over 30 seconds is rejected');
select throws_ok($$ insert into public.report_media (report_id, kind, storage_path, size_bytes) select id, 'video', id || '/nodur.mp4', 1000 from t_r $$, 'P0001', 'media_too_long', 'T-BR4-1 a video with no duration is rejected');
select lives_ok($$ insert into public.report_media (report_id, kind, storage_path, size_bytes, duration_seconds) select id, 'video', id || '/v1.mp4', 26214400, 30 from t_r $$, 'T-BR4-1 a video of exactly 25 MB and 30 seconds is accepted');
select throws_ok($$ insert into public.report_media (report_id, kind, storage_path, size_bytes, duration_seconds) select id, 'video', id || '/v2.mp4', 1000, 5 from t_r $$, 'P0001', 'media_limit_video', 'T-BR4-1 a 2nd video is rejected');
select throws_ok($$ insert into public.report_media (report_id, kind, storage_path, size_bytes, duration_seconds) select id, 'audio', id || '/big.m4a', 10485761, 10 from t_r $$, 'P0001', 'media_too_large', 'T-BR4-1 audio over 10 MB is rejected');
select throws_ok($$ insert into public.report_media (report_id, kind, storage_path, size_bytes, duration_seconds) select id, 'audio', id || '/long.m4a', 1000, 61 from t_r $$, 'P0001', 'media_too_long', 'T-BR4-1 audio over 60 seconds is rejected');
select lives_ok($$ insert into public.report_media (report_id, kind, storage_path, size_bytes, duration_seconds) select id, 'audio', id || '/a1.m4a', 10485760, 60 from t_r $$, 'T-BR4-1 audio of exactly 10 MB and 60 seconds is accepted');
select throws_ok($$ insert into public.report_media (report_id, kind, storage_path, size_bytes, duration_seconds) select id, 'audio', id || '/a2.m4a', 1000, 5 from t_r $$, 'P0001', 'media_limit_audio', 'T-BR4-1 a 2nd audio note is rejected');
select throws_ok($$ insert into public.report_media (report_id, kind, storage_path, size_bytes, duration_seconds) select id, 'photo', id || '/p.jpg', 1000, 5 from t_r $$, '23514', null, 'T-BR4-1 a photo cannot have a duration');
select throws_ok($$ insert into public.report_media (report_id, kind, storage_path, size_bytes) select id, 'gif', id || '/x.gif', 1000 from t_r $$, '23514', null, 'T-BR4-1 an unknown media kind is rejected');
select is((select count(*) from public.report_media m join t_r r on r.id = m.report_id), 5::bigint, 'T-BR4-1 only the accepted files were stored (3 photos, 1 video, 1 audio)');

select * from finish();
rollback;
