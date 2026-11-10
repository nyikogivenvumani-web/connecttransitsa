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

-- Number of rows a statement changed, run as the current role (RLS hides rows without raising an error).
-- Real Supabase also blocks direct DELETE on storage.objects with a trigger error; that counts as 0 rows changed.
create function tests.affected(q text) returns bigint language plpgsql as $$
declare n bigint; begin execute q; get diagnostics n = row_count; return n;
exception when others then return 0; end $$;

create function tests.ref_of(rid uuid) returns text language plpgsql as $$ declare r text; begin select case_ref into r from public.reports where id = rid; return r; end $$;
create function tests.req_of(rid uuid) returns uuid language sql security definer as $$ select id from public.evidence_requests where report_id = rid order by created_at desc limit 1 $$;
create function tests.req_status(rid uuid) returns text language sql security definer as $$ select status from public.evidence_requests where report_id = rid order by created_at desc limit 1 $$;
grant execute on all functions in schema tests to public;

-- T-SEC-15a..16b and the bucket settings. Object names are '{report_id}/{file}' inside the private bucket 'evidence'.
select is((select public from storage.buckets where id = 'evidence'), false, 'T-SEC-15 the evidence bucket is private');
select is((select file_size_limit from storage.buckets where id = 'evidence'), 26214400::bigint, 'T-SEC-15 the bucket limit is 25 MB');
select is((select allowed_mime_types from storage.buckets where id = 'evidence'), array['image/jpeg','image/png','video/mp4','audio/mp4','audio/aac','audio/x-m4a'], 'T-SEC-15 only JPEG, PNG, MP4 and M4A/AAC are allowed');

create temp table t_f on commit drop as select
  tests.new_report(tests.u('thabo'), tests.org('dorljota'), 'Overcharging', 'FILE 1 GP', now() - interval '5 minutes') as fresh,
  tests.new_report(tests.u('thabo'), tests.org('metrobus'), 'Overcharging', 'FILE 2 GP', now() - interval '16 minutes') as stale;
grant select on t_f to public;
select tests.as_user(tests.u('thabo'));
select lives_ok($$ insert into storage.objects (bucket_id, name, owner) select 'evidence', fresh || '/photo1.jpg', auth.uid() from t_f $$, 'T-SEC-15a the reporter uploads into their own new report');
select throws_ok($$ insert into storage.objects (bucket_id, name, owner) select 'evidence', stale || '/photo1.jpg', auth.uid() from t_f $$, '42501', null, 'T-SEC-15b not after the 15 minutes are over (original media)');
select throws_ok($$ insert into storage.objects (bucket_id, name, owner) values ('evidence', 'not-a-uuid/photo1.jpg', auth.uid()) $$, '42501', null, 'T-SEC-15b a path that is not a report id is refused');
select throws_ok($$ insert into storage.objects (bucket_id, name, owner) values ('evidence', 'photo1.jpg', auth.uid()) $$, '42501', null, 'T-SEC-15b a path with no report folder is refused');
select throws_ok($$ insert into storage.objects (bucket_id, name, owner) values ('other-bucket', tests.rep(1) || '/x.jpg', auth.uid()) $$, '42501', null, 'T-SEC-15b the evidence policy does not open other buckets');
select tests.as_user(tests.u('lerato'));
select throws_ok($$ insert into storage.objects (bucket_id, name, owner) select 'evidence', fresh || '/photo2.jpg', auth.uid() from t_f $$, '42501', null, 'T-SEC-15b another commuter cannot upload into it');
select tests.as_user(tests.u('sipho'));
select throws_ok($$ insert into storage.objects (bucket_id, name, owner) select 'evidence', fresh || '/photo3.jpg', auth.uid() from t_f $$, '42501', null, 'T-SEC-15b an admin cannot upload into it');
select tests.as_anon();
select throws_ok($$ insert into storage.objects (bucket_id, name) select 'evidence', fresh || '/photo4.jpg' from t_f $$, '42501', null, 'T-SEC-15b a visitor cannot upload');

-- T-SEC-22: while an evidence request is open, the reporter may upload into that (older) report
select tests.as_user(tests.u('thabo'));
select lives_ok($$ insert into storage.objects (bucket_id, name, owner) values ('evidence', tests.rep(2) || '/reply1.jpg', auth.uid()) $$, 'T-SEC-22a the reporter uploads a reply to an open request on an older report');
select throws_ok($$ insert into storage.objects (bucket_id, name, owner) values ('evidence', tests.rep(1) || '/reply1.jpg', auth.uid()) $$, '42501', null, 'T-SEC-22b but not into an older report with no open request');
select tests.as_user(tests.u('lerato'));
select throws_ok($$ insert into storage.objects (bucket_id, name, owner) values ('evidence', tests.rep(2) || '/reply2.jpg', auth.uid()) $$, '42501', null, 'T-SEC-22b another commuter cannot answer it');
select tests.as_postgres();
update public.evidence_requests set status = 'cancelled' where report_id = tests.rep(2) and status = 'open';
select tests.as_user(tests.u('thabo'));
select throws_ok($$ insert into storage.objects (bucket_id, name, owner) values ('evidence', tests.rep(2) || '/reply3.jpg', auth.uid()) $$, '42501', null, 'T-SEC-22b a cancelled request no longer accepts files');

-- T-SEC-16: who can read
select tests.as_postgres();
insert into storage.objects (bucket_id, name, owner) values
  ('evidence', tests.rep(1) || '/seed.jpg', tests.u('thabo')),   -- DORLJOTA, not escalated
  ('evidence', tests.rep(4) || '/seed.jpg', tests.u('thabo')),   -- Metrobus, not escalated
  ('evidence', tests.rep(5) || '/seed.jpg', tests.u('thabo'));   -- Metrobus, escalated
select tests.as_user(tests.u('thabo'));
select is((select count(*) from storage.objects where name = tests.rep(1) || '/seed.jpg'), 1::bigint, 'T-SEC-16a the reporter reads their own evidence');
select tests.as_user(tests.u('sipho'));
select is((select count(*) from storage.objects where name = tests.rep(1) || '/seed.jpg'), 1::bigint, 'T-SEC-16a the admin of the report''s organization reads it');
select is((select count(*) from storage.objects where name = tests.rep(4) || '/seed.jpg'), 0::bigint, 'T-SEC-16b but not another organization''s evidence');
select tests.as_user(tests.u('nomsa'));
select is((select count(*) from storage.objects where name = tests.rep(1) || '/seed.jpg'), 0::bigint, 'T-SEC-16b the other organization''s admin cannot read it');
select is((select count(*) from storage.objects where name = tests.rep(4) || '/seed.jpg'), 1::bigint, 'T-SEC-16a nomsa reads Metrobus evidence');
select tests.as_user(tests.u('saps'));
select is((select count(*) from storage.objects where name = tests.rep(5) || '/seed.jpg'), 1::bigint, 'T-SEC-16a SAPS reads evidence of an escalated report');
select is((select count(*) from storage.objects where name = tests.rep(4) || '/seed.jpg'), 0::bigint, 'T-SEC-16b SAPS cannot read evidence of a non-escalated report');
select tests.as_user(tests.u('lerato'));
select is((select count(*) from storage.objects where bucket_id = 'evidence'), 0::bigint, 'T-SEC-16b another commuter reads nothing');
select tests.as_anon();
select is((select count(*) from storage.objects where bucket_id = 'evidence'), 0::bigint, 'T-SEC-16b a visitor reads nothing');
select tests.as_user(tests.u('thabo'));
select is(tests.affected($q$delete from storage.objects where name = '$q$ || tests.rep(1) || $q$/seed.jpg'$q$), 0::bigint, 'T-SEC-16b nobody deletes evidence through the API');
select is(tests.affected($q$update storage.objects set name = '$q$ || tests.rep(1) || $q$/renamed.jpg' where name = '$q$ || tests.rep(1) || $q$/seed.jpg'$q$), 0::bigint, 'T-SEC-16b or renames it');

select tests.as_postgres();
select * from finish();
rollback;
