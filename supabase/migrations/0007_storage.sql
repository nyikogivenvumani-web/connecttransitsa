-- 0007_storage: private evidence bucket (25 MB) and the policies for SEC15, SEC16, SEC22. Object names are '{report_id}/{file}'.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidence', 'evidence', false, 26214400, array['image/jpeg', 'image/png', 'video/mp4', 'audio/mp4', 'audio/aac', 'audio/x-m4a'])
on conflict (id) do update set public = false, file_size_limit = 26214400, allowed_mime_types = excluded.allowed_mime_types;

create function public.evidence_report_id(p_name text) returns uuid language plpgsql immutable set search_path = '' as $$
begin return (storage.foldername(p_name))[1]::uuid; exception when others then return null; end $$;
grant execute on function public.evidence_report_id(text) to authenticated, service_role;

create policy evidence_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'evidence' and public.evidence_report_id(name) is not null
    and (public.report_open_for_media(public.evidence_report_id(name)) or public.has_open_request(public.evidence_report_id(name))));
create policy evidence_select on storage.objects for select to authenticated
  using (bucket_id = 'evidence' and public.evidence_report_id(name) is not null
    and (public.owns_report(public.evidence_report_id(name)) or public.can_admin_report(public.evidence_report_id(name)) or public.can_saps_report(public.evidence_report_id(name))));
