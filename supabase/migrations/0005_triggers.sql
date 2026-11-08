-- 0005_triggers: all triggers and the cleanup functions (plan 8.5). Every function pins search_path.

-- BR6: sign-up creates users (+ user_private). Role comes only from app metadata (set by the server), never from user metadata.
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_role text := coalesce(new.raw_app_meta_data ->> 'role', 'commuter');
  v_name text := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  v_id text := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'id_number', '')), '');
  v_status text;
begin
  if v_role not in ('commuter', 'transport_admin', 'saps', 'system_admin') then v_role := 'commuter'; end if;
  if v_name is null then raise exception 'name_required'; end if;
  if v_id is not null or v_role = 'commuter' then
    v_status := public.sa_id_status(v_id);
    if v_status = 'under_age' then raise exception 'under_age'; end if;
    if v_status <> 'ok' then raise exception 'invalid_sa_id'; end if;
  end if;
  insert into public.users (id, role, full_name, email, phone_number)
  values (new.id, v_role, v_name, lower(new.email),
    case when nullif(new.phone, '') is null then null when new.phone like '+%' then new.phone else '+' || new.phone end);
  if v_id is not null then insert into public.user_private (user_id, id_number) values (new.id, v_id); end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- BR9: 5 reports per hour and 20 per day (counted by the report's own created_at)
create function public.limit_reports() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.reporter_id is null then return new; end if;
  if (select count(*) from public.reports where reporter_id = new.reporter_id and created_at > new.created_at - interval '1 hour' and created_at <= new.created_at) >= 5
     or (select count(*) from public.reports where reporter_id = new.reporter_id and created_at > new.created_at - interval '1 day' and created_at <= new.created_at) >= 20
  then raise exception 'rate_limit_reports'; end if;
  return new;
end $$;
-- BR2: severe categories start Escalated
create function public.escalate_severe() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.category in ('Sexual Misconduct', 'Physical Assault') then new.status := 'Escalated'; new.is_escalated := true;
  else new.status := 'Submitted'; new.is_escalated := false; end if;
  return new;
end $$;
-- BR7: TC-YYYY-NNNN, per-year counter, South African calendar year
create function public.set_case_ref() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_year int := extract(year from (new.created_at at time zone 'Africa/Johannesburg')); v_n int;
begin
  insert into public.case_counters (year, last_value) values (v_year, 1)
  on conflict (year) do update set last_value = public.case_counters.last_value + 1 returning last_value into v_n;
  new.case_ref := 'TC-' || v_year || '-' || case when v_n >= 1000 then v_n::text else lpad(v_n::text, 4, '0') end;
  return new;
end $$;
create trigger trg_10_limit_reports before insert on public.reports for each row execute function public.limit_reports();
create trigger trg_20_escalate_severe before insert on public.reports for each row execute function public.escalate_severe();
create trigger trg_30_set_case_ref before insert on public.reports for each row execute function public.set_case_ref();

create function public.queue_saps_report() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.is_escalated then
    insert into public.saps_queue (kind, report_id, payload)
    select 'report', new.id, jsonb_build_object('case_ref', new.case_ref, 'vehicle_plate', new.vehicle_plate, 'category', new.category,
      'description', new.description, 'location_lat', new.location_lat, 'location_lng', new.location_lng, 'location_text', new.location_text,
      'saps_case_number', new.saps_case_number, 'reporter_full_name', u.full_name, 'reporter_id_number', p.id_number)
    from (select 1) x left join public.users u on u.id = new.reporter_id left join public.user_private p on p.user_id = new.reporter_id;
  end if;
  return null;
end $$;
create trigger queue_saps_report after insert on public.reports for each row execute function public.queue_saps_report();

-- BR5 and BR10: allowed status changes (plan 8.3)
create function public.check_status_change() returns trigger language plpgsql set search_path = '' as $$
begin
  if old.status in ('Resolved', 'Dismissed') then
    -- final. The only allowed change is anonymising the reporter (account deletion)
    if (to_jsonb(new) - 'reporter_id' - 'updated_at' - 'plate_normalized') is distinct from (to_jsonb(old) - 'reporter_id' - 'updated_at' - 'plate_normalized') then raise exception 'case_already_decided'; end if;
    return new;
  end if;
  if new.status is distinct from old.status then
    if not ((old.status in ('Submitted', 'Escalated') and new.status = 'Under Review')
         or (old.status = 'Under Review' and new.status in ('Resolved', 'Dismissed'))) then raise exception 'invalid_status_change'; end if;
    if new.status in ('Resolved', 'Dismissed') then new.decided_at := now(); end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger check_status_change before update on public.reports for each row execute function public.check_status_change();

-- BR12: evidence requests
create function public.check_evidence_request() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select status from public.reports where id = new.report_id) not in ('Under Review', 'Escalated') then raise exception 'request_case_status'; end if;
  if exists (select 1 from public.evidence_requests where report_id = new.report_id and status = 'open') then raise exception 'request_already_open'; end if;
  if (select count(*) from public.evidence_requests where report_id = new.report_id) >= 3 then raise exception 'request_limit'; end if;
  return new;
end $$;
create trigger check_evidence_request before insert on public.evidence_requests for each row execute function public.check_evidence_request();

create function public.close_requests_on_decision() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.evidence_requests set status = 'closed_by_decision' where report_id = new.id and status = 'open';
  return null;
end $$;
create trigger close_requests_on_decision after update of status on public.reports for each row
  when (new.status in ('Resolved', 'Dismissed') and old.status is distinct from new.status) execute function public.close_requests_on_decision();

-- Notifications (PRD 4.5): push always, SMS when the reporter has a phone number, nothing when the reporter is unknown
create function public.queue_notifications(p_report uuid, p_body text) returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid; v_phone text;
begin
  select r.reporter_id, u.phone_number into v_user, v_phone from public.reports r left join public.users u on u.id = r.reporter_id where r.id = p_report;
  if v_user is null then return; end if;
  insert into public.notification_outbox (user_id, report_id, channel, body) values (v_user, p_report, 'push', p_body);
  if v_phone is not null then insert into public.notification_outbox (user_id, report_id, channel, body) values (v_user, p_report, 'sms', p_body); end if;
end $$;
create function public.notify_on_status() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.queue_notifications(new.id, 'Update on Case #' || new.case_ref || ': Status changed to ' || new.status || '. Tap to view formal decision.');
  return null;
end $$;
create trigger notify_on_status after update of status on public.reports for each row when (old.status is distinct from new.status) execute function public.notify_on_status();
create function public.notify_on_evidence_request() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.queue_notifications(new.report_id, 'Update on Case #' || (select case_ref from public.reports where id = new.report_id) || ': Further evidence requested. Tap to respond.');
  return null;
end $$;
create trigger notify_on_evidence_request after insert on public.evidence_requests for each row execute function public.notify_on_evidence_request();

-- BR4: media limits, counted separately for the original report (request_id null) and for each evidence request
create function public.check_media_limits() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_max_bytes int; v_max_secs int; v_max_count int;
begin
  if new.kind not in ('photo', 'video', 'audio') then return new; end if; -- the table check reports it
  if new.kind = 'photo' and new.duration_seconds is not null then raise exception 'photo_has_duration' using errcode = '23514'; end if;
  v_max_bytes := case new.kind when 'photo' then 5242880 when 'video' then 26214400 else 10485760 end;
  v_max_secs := case new.kind when 'video' then 30 when 'audio' then 60 end;
  v_max_count := case new.kind when 'photo' then 3 else 1 end;
  if new.size_bytes > v_max_bytes then raise exception 'media_too_large'; end if;
  if v_max_secs is not null and (new.duration_seconds is null or new.duration_seconds > v_max_secs) then raise exception 'media_too_long'; end if;
  if (select count(*) from public.report_media where report_id = new.report_id and kind = new.kind and request_id is not distinct from new.request_id) >= v_max_count
  then raise exception 'media_limit_%', new.kind; end if;
  return new;
end $$;
create trigger check_media_limits before insert on public.report_media for each row execute function public.check_media_limits();

-- BR11: a new SOS is queued for SAPS
create function public.queue_saps_sos() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.saps_queue (kind, sos_event_id, payload)
  select 'sos', new.id, jsonb_build_object('share_token', new.share_token, 'last_lat', new.last_lat, 'last_lng', new.last_lng, 'started_at', new.started_at,
    'reporter_full_name', u.full_name, 'reporter_phone', u.phone_number, 'reporter_id_number', p.id_number)
  from (select 1) x left join public.users u on u.id = new.user_id left join public.user_private p on p.user_id = new.user_id;
  return null;
end $$;
create trigger queue_saps_sos after insert on public.sos_events for each row execute function public.queue_saps_sos();

-- Cleanup jobs (scheduled in 0008)
create function public.cleanup_sos_locations() returns void language sql security definer set search_path = '' as $$
  delete from public.sos_locations where recorded_at < now() - interval '24 hours';
  update public.sos_events set last_lat = null, last_lng = null where last_recorded_at < now() - interval '24 hours' and (last_lat is not null or last_lng is not null);
$$;
create function public.cleanup_rate_events() returns void language sql security definer set search_path = '' as $$
  delete from public.rate_events where created_at < now() - interval '2 days';
$$;
create function public.purge_saps_pii() returns void language sql security definer set search_path = '' as $$
  update public.saps_queue set payload = payload - 'reporter_full_name' - 'reporter_id_number' - 'reporter_phone' where purge_after is not null and purge_after <= now();
$$;
-- Account deletion (PRD 6.2, BR13). Called by the delete-account Edge Function with the service role.
create function public.delete_account_data(p_user uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.saps_queue set purge_after = now() + interval '12 months'
   where report_id in (select id from public.reports where reporter_id = p_user) or sos_event_id in (select id from public.sos_events where user_id = p_user);
  update public.evidence_requests set status = 'cancelled' where status = 'open' and report_id in (select id from public.reports where reporter_id = p_user);
  update public.reports set reporter_id = null where reporter_id = p_user;
  delete from public.sos_events where user_id = p_user;
  delete from public.push_tokens where user_id = p_user;
  delete from public.notification_outbox where user_id = p_user;
  delete from public.user_private where user_id = p_user;
  update public.users set full_name = 'Deleted user', email = null, phone_number = null where id = p_user;
end $$;
