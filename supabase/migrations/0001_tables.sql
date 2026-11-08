-- 0001_tables: all tables, constraints and indexes (plan 8.1, 8.4).
-- Secure by default: new objects in public give nothing to the API roles until a later migration grants it.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'commuter' check (role in ('commuter', 'transport_admin', 'saps', 'system_admin')),
  full_name text not null check (char_length(full_name) between 1 and 100),
  email text unique check (email = lower(email)),
  phone_number text unique check (phone_number ~ '^\+27[0-9]{9}$'),
  preferred_language text not null default 'en' check (preferred_language = 'en'),
  created_at timestamptz not null default now()
);

create table public.user_private (
  user_id uuid primary key references public.users (id) on delete cascade,
  id_number text not null unique check (id_number ~ '^[0-9]{13}$'),
  created_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 150),
  type text not null check (type in ('Taxi', 'Bus', 'E-Hailing')),
  is_verified boolean not null default true,
  is_oversight boolean not null default false,
  check (is_verified or is_oversight)
);
create unique index organizations_one_oversight on public.organizations (is_oversight) where is_oversight;

create table public.org_admins (
  user_id uuid primary key references public.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete restrict
);

create table public.case_counters (year int primary key, last_value int not null default 0);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  case_ref text not null unique,
  reporter_id uuid default auth.uid() references public.users (id) on delete set null,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  unlisted_entity_name text check (char_length(unlisted_entity_name) between 1 and 150),
  vehicle_plate text not null check (char_length(vehicle_plate) between 1 and 15),
  plate_normalized text generated always as (upper(regexp_replace(vehicle_plate, '[^A-Za-z0-9]', '', 'g'))) stored,
  category text not null check (category in ('Sexual Misconduct', 'Physical Assault', 'Reckless & Negligent Driving', 'Overcrowding & Safety Hazard',
    'Extortion & Fare Intimidation', 'Overcharging', 'Harassment', 'Drunk or Impaired Driving', 'Unroadworthy Vehicle', 'Refusal of Service or Route Deviation', 'Other')),
  custom_category_text text check (char_length(custom_category_text) between 1 and 100),
  description text not null check (char_length(description) between 1 and 2000),
  incident_at timestamptz not null,
  location_lat double precision check (location_lat between -90 and 90),
  location_lng double precision check (location_lng between -180 and 180),
  location_text text check (char_length(location_text) <= 200),
  saps_case_number text check (char_length(saps_case_number) <= 30),
  status text not null default 'Submitted' check (status in ('Submitted', 'Under Review', 'Escalated', 'Resolved', 'Dismissed')),
  is_escalated boolean not null default false,
  admin_decision text check (char_length(admin_decision) <= 200),
  decision_reasoning text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint category_other_needs_text check (category <> 'Other' or custom_category_text is not null),
  constraint decision_needs_reasoning check (status not in ('Resolved', 'Dismissed') or (admin_decision is not null and char_length(decision_reasoning) >= 20))
);
create index reports_org_status on public.reports (organization_id, status, created_at desc);
create index reports_reporter on public.reports (reporter_id, created_at desc);
create index reports_plate on public.reports (plate_normalized);
create index reports_escalated on public.reports (is_escalated, created_at desc);

create table public.evidence_requests (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  message text not null check (char_length(message) between 20 and 500),
  status text not null default 'open' check (status in ('open', 'answered', 'cancelled', 'closed_by_decision')),
  requested_by uuid references public.users (id) on delete set null,
  reply_note text check (char_length(reply_note) <= 500),
  created_at timestamptz not null default now(),
  answered_at timestamptz
);
create index evidence_requests_report on public.evidence_requests (report_id);

create table public.report_media (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  kind text not null check (kind in ('photo', 'video', 'audio')),
  storage_path text not null,
  size_bytes integer not null check (size_bytes > 0),
  duration_seconds integer check (duration_seconds >= 0),
  request_id uuid references public.evidence_requests (id) on delete set null,
  created_at timestamptz not null default now(),
  check (kind <> 'photo' or duration_seconds is null)
);
create index report_media_report on public.report_media (report_id);

create table public.sos_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  share_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  status text not null default 'active' check (status in ('active', 'stopped')),
  started_at timestamptz not null default now(),
  stopped_at timestamptz,
  last_lat double precision,
  last_lng double precision,
  last_recorded_at timestamptz,
  used_cached_location boolean not null default false,
  dispatch_ms integer
);

create table public.sos_locations (
  id uuid primary key default gen_random_uuid(),
  sos_event_id uuid not null references public.sos_events (id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  recorded_at timestamptz not null default now()
);
create index sos_locations_event on public.sos_locations (sos_event_id, recorded_at desc);

create table public.saps_queue (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('report', 'sos')),
  report_id uuid references public.reports (id) on delete set null,
  sos_event_id uuid references public.sos_events (id) on delete set null,
  payload jsonb not null default '{}',
  status text not null default 'new' check (status in ('new', 'acknowledged')),
  webhook_status text not null default 'pending' check (webhook_status in ('pending', 'sent', 'failed')),
  webhook_attempts integer not null default 0,
  created_at timestamptz not null default now(),
  purge_after timestamptz
);
create index saps_queue_status on public.saps_queue (status, created_at desc);

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  report_id uuid references public.reports (id) on delete cascade,
  channel text not null check (channel in ('push', 'sms')),
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  created_at timestamptz not null default now()
);

create table public.push_tokens (
  user_id uuid not null references public.users (id) on delete cascade,
  token text not null,
  primary key (user_id, token)
);

create table public.rate_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  kind text not null check (kind in ('report', 'plate_search')),
  created_at timestamptz not null default now()
);
create index rate_events_lookup on public.rate_events (user_id, kind, created_at desc);
