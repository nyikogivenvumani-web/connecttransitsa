-- 0003_rls: row level security on every table, column grants, and all policies (plan Section 9).
-- Ownership helpers (security definer so a policy can look at tables the caller cannot read).
create function public.owns_report(p_report uuid) returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.reports where id = p_report and reporter_id = auth.uid()) $$;
create function public.can_admin_report(p_report uuid) returns boolean language sql stable security definer set search_path = '' as
$$ select public.app_role() = 'transport_admin' and exists (select 1 from public.reports where id = p_report and organization_id = public.app_org_id()) $$;
create function public.can_saps_report(p_report uuid) returns boolean language sql stable security definer set search_path = '' as
$$ select public.app_role() = 'saps' and exists (select 1 from public.reports where id = p_report and is_escalated) $$;
create function public.owns_sos(p_event uuid) returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.sos_events where id = p_event and user_id = auth.uid()) $$;
create function public.report_open_for_media(p_report uuid) returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.reports where id = p_report and reporter_id = auth.uid() and created_at > now() - interval '15 minutes') $$;
create function public.has_open_request(p_report uuid) returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.evidence_requests e join public.reports r on r.id = e.report_id
  where e.report_id = p_report and e.status = 'open' and r.reporter_id = auth.uid()) $$;
grant execute on function public.owns_report(uuid), public.can_admin_report(uuid), public.can_saps_report(uuid), public.owns_sos(uuid),
  public.report_open_for_media(uuid), public.has_open_request(uuid) to authenticated, service_role;

alter table public.users enable row level security;
alter table public.user_private enable row level security;
alter table public.organizations enable row level security;
alter table public.org_admins enable row level security;
alter table public.case_counters enable row level security;
alter table public.reports enable row level security;
alter table public.report_media enable row level security;
alter table public.evidence_requests enable row level security;
alter table public.sos_events enable row level security;
alter table public.sos_locations enable row level security;
alter table public.saps_queue enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.push_tokens enable row level security;
alter table public.rate_events enable row level security;

-- SEC1, SEC3: users
grant select (id, role, full_name, email, phone_number, preferred_language) on public.users to authenticated;
grant update (preferred_language) on public.users to authenticated;
create policy users_select_own on public.users for select to authenticated using (id = auth.uid());
create policy users_update_own on public.users for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- SEC2: user_private has no grant and no policy for the API roles.
-- SEC10, SEC11: organizations and org_admins
grant select, insert, update, delete on public.organizations to authenticated;
create policy org_select on public.organizations for select to authenticated using (is_verified or is_oversight or public.app_role() = 'system_admin');
create policy org_insert on public.organizations for insert to authenticated with check (public.app_role() = 'system_admin');
create policy org_update on public.organizations for update to authenticated using (public.app_role() = 'system_admin') with check (public.app_role() = 'system_admin');
create policy org_delete on public.organizations for delete to authenticated using (public.app_role() = 'system_admin');
grant select, insert, update, delete on public.org_admins to authenticated;
create policy orgadm_select on public.org_admins for select to authenticated using (user_id = auth.uid() or public.app_role() = 'system_admin');
create policy orgadm_insert on public.org_admins for insert to authenticated with check (public.app_role() = 'system_admin');
create policy orgadm_update on public.org_admins for update to authenticated using (public.app_role() = 'system_admin') with check (public.app_role() = 'system_admin');
create policy orgadm_delete on public.org_admins for delete to authenticated using (public.app_role() = 'system_admin');
-- SEC4, SEC5, SEC6: reports. Create and read-own only; no update or delete for any API role.
grant select on public.reports to authenticated;
grant insert (id, reporter_id, organization_id, unlisted_entity_name, vehicle_plate, category, custom_category_text, description, incident_at,
  location_lat, location_lng, location_text, saps_case_number) on public.reports to authenticated;
create policy reports_select_own on public.reports for select to authenticated using (reporter_id = auth.uid());
create policy reports_insert_own on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and public.app_role() = 'commuter' and public.is_verified());
-- report_media: the reporter adds original media for 15 minutes after creating the report; later files come through answer_evidence_request
grant select on public.report_media to authenticated;
grant insert (report_id, kind, storage_path, size_bytes, duration_seconds) on public.report_media to authenticated;
create policy media_select on public.report_media for select to authenticated
  using (public.owns_report(report_id) or public.can_admin_report(report_id) or public.can_saps_report(report_id));
create policy media_insert on public.report_media for insert to authenticated
  with check (request_id is null and public.report_open_for_media(report_id));
-- evidence_requests: the reporter reads them (never requested_by); everything else goes through functions
grant select (id, report_id, message, status, reply_note, created_at, answered_at) on public.evidence_requests to authenticated;
create policy evreq_select_reporter on public.evidence_requests for select to authenticated using (public.owns_report(report_id));
-- SEC14: sos
grant select on public.sos_events to authenticated;
grant insert (id, user_id, last_lat, last_lng, last_recorded_at, used_cached_location, dispatch_ms) on public.sos_events to authenticated;
grant update (status, stopped_at, last_lat, last_lng, last_recorded_at) on public.sos_events to authenticated;
create policy sos_select on public.sos_events for select to authenticated using (user_id = auth.uid() or public.app_role() = 'saps');
create policy sos_insert on public.sos_events for insert to authenticated with check (user_id = auth.uid());
create policy sos_update on public.sos_events for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select on public.sos_locations to authenticated;
grant insert (sos_event_id, lat, lng, recorded_at) on public.sos_locations to authenticated;
create policy soslocs_select on public.sos_locations for select to authenticated using (public.owns_sos(sos_event_id) or public.app_role() = 'saps');
create policy soslocs_insert on public.sos_locations for insert to authenticated with check (public.owns_sos(sos_event_id));
-- SEC9: saps_queue
grant select on public.saps_queue to authenticated;
grant update (status) on public.saps_queue to authenticated;
create policy saps_select on public.saps_queue for select to authenticated using (public.app_role() = 'saps');
create policy saps_update on public.saps_queue for update to authenticated using (public.app_role() = 'saps') with check (public.app_role() = 'saps');
-- SEC17: push_tokens (own rows). notification_outbox, rate_events and case_counters: no API access at all.
grant select, insert, delete on public.push_tokens to authenticated;
create policy push_select on public.push_tokens for select to authenticated using (user_id = auth.uid());
create policy push_insert on public.push_tokens for insert to authenticated with check (user_id = auth.uid());
create policy push_delete on public.push_tokens for delete to authenticated using (user_id = auth.uid());
