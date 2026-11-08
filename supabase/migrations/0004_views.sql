-- 0004_views: my_case_view (commuter, runs as the caller), admin_case_view (no commuter columns, BR1), saps_case_view.
create view public.my_case_view with (security_invoker = true) as
select r.id, r.case_ref, r.reporter_id, r.organization_id, o.name as organization_name, r.unlisted_entity_name, r.vehicle_plate, r.category,
  r.custom_category_text, r.description, r.incident_at, r.location_lat, r.location_lng, r.location_text, r.saps_case_number, r.status, r.is_escalated,
  r.admin_decision, r.decision_reasoning, r.decided_at, r.created_at, r.updated_at,
  e.id as evidence_request_id, e.status as evidence_request_status, e.message as evidence_request_message, e.reply_note as evidence_reply_note
from public.reports r
join public.organizations o on o.id = r.organization_id
left join lateral (select x.id, x.status, x.message, x.reply_note from public.evidence_requests x where x.report_id = r.id order by x.created_at desc limit 1) e on true;

-- Owner view: filters by the caller's organization. It has no reporter_id, name, phone, email, ID number or address.
create view public.admin_case_view as
select r.id, r.case_ref, r.organization_id, o.name as organization_name, r.unlisted_entity_name, r.vehicle_plate, r.category, r.custom_category_text,
  r.description, r.incident_at, r.location_lat, r.location_lng, r.location_text, r.status, r.is_escalated, r.admin_decision, r.decision_reasoning,
  r.decided_at, r.created_at, r.updated_at,
  e.id as evidence_request_id, e.status as evidence_request_status, e.message as evidence_request_message, e.reply_note as evidence_reply_note
from public.reports r
join public.organizations o on o.id = r.organization_id
left join lateral (select x.id, x.status, x.message, x.reply_note from public.evidence_requests x where x.report_id = r.id order by x.created_at desc limit 1) e on true
where (public.app_role() = 'transport_admin' and r.organization_id = public.app_org_id())
   or (public.app_role() = 'system_admin' and o.is_oversight);

-- SAPS: escalated cases only. Name and ID number come from the SAPS copy so they survive account deletion for 12 months (BR13).
create view public.saps_case_view as
select r.id, r.case_ref, r.vehicle_plate, r.category, r.description, r.incident_at, r.location_lat, r.location_lng, r.location_text, r.saps_case_number,
  r.status, o.name as organization_name, r.created_at, q.id as queue_id, q.status as queue_status,
  q.payload ->> 'reporter_full_name' as reporter_full_name, q.payload ->> 'reporter_id_number' as reporter_id_number
from public.reports r
join public.organizations o on o.id = r.organization_id
join public.saps_queue q on q.report_id = r.id and q.kind = 'report'
where r.is_escalated and public.app_role() = 'saps';

grant select on public.my_case_view, public.admin_case_view, public.saps_case_view to authenticated;
