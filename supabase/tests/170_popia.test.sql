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

-- T-NFR-12: after account deletion no row in public holds the person's name, email, phone or ID number (the SAPS copy is the BR13 exception).
create function tests.pii_tables(needle text) returns text language plpgsql as $$
declare t record; n int; found text := '';
begin
  for t in select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by 1 loop
    execute format('select count(*) from public.%I x where x::text ilike %L', t.table_name, '%' || needle || '%') into n;
    if n > 0 then found := found || t.table_name || ' '; end if;
  end loop;
  return btrim(found);
end $$;

insert into public.sos_events (id, user_id) values ('30000000-0000-0000-0000-0000000000c1', tests.u('thabo'));
insert into public.push_tokens (user_id, token) values (tests.u('thabo'), 'ExponentPushToken[popia]');
select ok(tests.pii_tables('Thabo Mokoena') like '%users%', 'T-NFR-12 sanity: the name is found before deletion');
select ok(tests.pii_tables('9803145009088') like '%user_private%', 'T-NFR-12 sanity: the ID number is found before deletion');

select lives_ok($$ select public.delete_account_data(tests.u('thabo')) $$, 'T-NFR-12 account data deletion runs');

select is(tests.pii_tables('Thabo Mokoena'), 'saps_queue', 'T-NFR-12 the name remains only in the SAPS copy');
select is(tests.pii_tables('9803145009088'), 'saps_queue', 'T-NFR-12 the ID number remains only in the SAPS copy');
select is(tests.pii_tables('thabo@example.co.za'), '', 'T-NFR-12 the email is nowhere in public');
select is(tests.pii_tables('27820000001'), 'saps_queue', 'T-NFR-12 the phone number remains only in the SAPS copy of an SOS');
select is((select count(*) from public.saps_queue q where q.payload::text ilike '%Thabo Mokoena%' and q.purge_after is null), 0::bigint, 'T-NFR-12 every SAPS row that still has the name has a purge date');

update public.saps_queue set purge_after = now() - interval '1 day' where purge_after is not null;
select public.purge_saps_pii();
select is(tests.pii_tables('Thabo Mokoena'), '', 'T-NFR-12 after the retention period the name is nowhere');
select is(tests.pii_tables('9803145009088'), '', 'T-NFR-12 after the retention period the ID number is nowhere');
select is(tests.pii_tables('27820000001'), '', 'T-NFR-12 after the retention period the phone number is nowhere');

select * from finish();
rollback;
