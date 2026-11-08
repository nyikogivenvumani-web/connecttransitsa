-- 0006_functions: the commuter and admin operations (plan Section 10). Every one pins search_path.

create function public.sa_id_status(p_id text) returns text language plpgsql stable set search_path = '' as $$
declare v_yy int; v_birth date; v_sum int := 0; v_d int; v_i int; v_dbl boolean := false;
begin
  if p_id is null or p_id !~ '^[0-9]{13}$' then return 'invalid'; end if;
  v_yy := substr(p_id, 1, 2)::int;
  begin
    v_birth := make_date(case when v_yy <= (extract(year from current_date)::int % 100) then 2000 + v_yy else 1900 + v_yy end, substr(p_id, 3, 2)::int, substr(p_id, 5, 2)::int);
  exception when others then return 'invalid'; end;
  if substr(p_id, 11, 1) not in ('0', '1') then return 'invalid'; end if;
  for v_i in reverse 13..1 loop
    v_d := substr(p_id, v_i, 1)::int;
    if v_dbl then v_d := v_d * 2; if v_d > 9 then v_d := v_d - 9; end if; end if;
    v_sum := v_sum + v_d; v_dbl := not v_dbl;
  end loop;
  if v_sum % 10 <> 0 then return 'invalid'; end if;
  if v_birth > current_date - interval '16 years' then return 'under_age'; end if;
  return 'ok';
end $$;
create function public.validate_sa_id(p_id text) returns boolean language sql stable set search_path = '' as $$ select public.sa_id_status(p_id) = 'ok' $$;

-- BR8: public lookup. Public fields only; Dismissed cases hidden; 30 searches an hour.
create function public.public_case_lookup(p_plate text)
returns table (category text, vehicle_plate text, organization_name text, status text, incident_at timestamptz, description text, admin_decision text, decision_reasoning text)
language plpgsql security definer set search_path = '' as $$
declare v_norm text := public.plate_normalize(p_plate);
begin
  if public.app_role() is distinct from 'commuter' then raise exception 'not_authorized'; end if;
  if char_length(v_norm) < 3 then return; end if;
  if (select count(*) from public.rate_events where user_id = auth.uid() and kind = 'plate_search' and created_at > now() - interval '1 hour') >= 30 then raise exception 'rate_limit_search'; end if;
  insert into public.rate_events (user_id, kind) values (auth.uid(), 'plate_search');
  return query select r.category, r.vehicle_plate, coalesce(r.unlisted_entity_name, o.name), r.status, r.incident_at, r.description, r.admin_decision, r.decision_reasoning
    from public.reports r join public.organizations o on o.id = r.organization_id
    where r.plate_normalized = v_norm and r.status <> 'Dismissed' order by r.incident_at desc;
end $$;

create function public.admin_update_case(p_report_id uuid, p_status text, p_decision text default null, p_reasoning text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_admin_report(p_report_id) then raise exception 'not_authorized'; end if;
  update public.reports set status = p_status, admin_decision = coalesce(p_decision, admin_decision), decision_reasoning = coalesce(p_reasoning, decision_reasoning)
   where id = p_report_id;
end $$;

create function public.tag_oversight_report(p_report_id uuid, p_org_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  if public.app_role() is distinct from 'system_admin' then raise exception 'not_authorized'; end if;
  if not exists (select 1 from public.reports r join public.organizations o on o.id = r.organization_id where r.id = p_report_id and o.is_oversight) then raise exception 'not_oversight_report'; end if;
  if exists (select 1 from public.organizations where id = p_org_id and is_oversight) or not exists (select 1 from public.organizations where id = p_org_id) then raise exception 'invalid_organization'; end if;
  update public.reports set organization_id = p_org_id where id = p_report_id;
end $$;

create function public.register_push_token(p_token text) returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_authorized'; end if;
  if p_token is null or p_token !~ '^ExponentPushToken\[.+\]$' then raise exception 'invalid_push_token'; end if;
  insert into public.push_tokens (user_id, token) values (auth.uid(), p_token) on conflict do nothing;
end $$;

create function public.request_evidence(p_report_id uuid, p_message text) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.can_admin_report(p_report_id) then raise exception 'not_authorized'; end if;
  insert into public.evidence_requests (report_id, message, requested_by) values (p_report_id, p_message, auth.uid()) returning id into v_id;
  return v_id;
end $$;

create function public.cancel_evidence_request(p_request_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare v_report uuid; v_status text;
begin
  select report_id, status into v_report, v_status from public.evidence_requests where id = p_request_id;
  if v_report is null or not public.can_admin_report(v_report) then raise exception 'not_authorized'; end if;
  if v_status <> 'open' then raise exception 'request_not_open'; end if;
  update public.evidence_requests set status = 'cancelled' where id = p_request_id;
end $$;

create function public.answer_evidence_request(p_request_id uuid, p_note text, p_media jsonb default '[]') returns void language plpgsql security definer set search_path = '' as $$
declare v_report uuid; v_status text; m record;
begin
  select report_id, status into v_report, v_status from public.evidence_requests where id = p_request_id;
  if v_report is null or auth.uid() is null or not public.owns_report(v_report) then raise exception 'not_authorized'; end if;
  if v_status <> 'open' then raise exception 'request_not_open'; end if;
  update public.evidence_requests set reply_note = p_note where id = p_request_id; -- length check
  for m in select * from jsonb_to_recordset(coalesce(p_media, '[]')) as x(kind text, storage_path text, size_bytes int, duration_seconds int) loop
    if m.storage_path is null or m.storage_path not like v_report::text || '/%' then raise exception 'invalid_media_path'; end if;
    insert into public.report_media (report_id, kind, storage_path, size_bytes, duration_seconds, request_id)
    values (v_report, m.kind, m.storage_path, m.size_bytes, m.duration_seconds, p_request_id);
  end loop;
  update public.evidence_requests set status = 'answered', answered_at = now() where id = p_request_id;
end $$;

-- Live SOS page: coordinates and status only, found by the secret share token
create function public.sos_share_view(p_token text) returns table (status text, lat double precision, lng double precision, recorded_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select s.status, s.last_lat, s.last_lng, s.last_recorded_at from public.sos_events s where s.share_token = p_token
$$;

grant execute on function public.sa_id_status(text), public.validate_sa_id(text), public.public_case_lookup(text), public.admin_update_case(uuid, text, text, text),
  public.tag_oversight_report(uuid, uuid), public.register_push_token(text), public.request_evidence(uuid, text), public.cancel_evidence_request(uuid),
  public.answer_evidence_request(uuid, text, jsonb) to authenticated, service_role;
grant execute on function public.sos_share_view(text) to anon, authenticated, service_role;
grant execute on function public.cleanup_sos_locations(), public.cleanup_rate_events(), public.purge_saps_pii(), public.delete_account_data(uuid) to service_role;
