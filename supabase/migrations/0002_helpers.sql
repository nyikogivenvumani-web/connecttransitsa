-- 0002_helpers: role helpers and plate normalising. Security definer with a fixed search_path.
create function public.app_role() returns text language sql stable security definer set search_path = '' as
$$ select role from public.users where id = auth.uid() $$;

create function public.app_org_id() returns uuid language sql stable security definer set search_path = '' as
$$ select organization_id from public.org_admins where user_id = auth.uid() $$;

create function public.is_verified() returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from auth.users where id = auth.uid() and (email_confirmed_at is not null or phone_confirmed_at is not null)) $$;

create function public.plate_normalize(p text) returns text language sql immutable set search_path = '' as
$$ select upper(regexp_replace(coalesce(p, ''), '[^A-Za-z0-9]', '', 'g')) $$;

grant execute on function public.app_role(), public.app_org_id(), public.is_verified(), public.plate_normalize(text) to authenticated, service_role;
