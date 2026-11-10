-- ConnectTransit SA seed: placeholder organizations, six test accounts and six test reports. TEST DATA ONLY: replace the organizations with the verified list before release.
-- Accounts get an unusable password here; scripts/seed-storage.mts sets real ones from SEED_TEST_PASSWORD.
insert into public.organizations (id, name, type, is_oversight) values
  ('10000000-0000-0000-0000-000000000001', 'DORLJOTA', 'Taxi', false),
  ('10000000-0000-0000-0000-000000000002', 'Metrobus', 'Bus', false),
  ('10000000-0000-0000-0000-000000000003', 'Putco', 'Bus', false),
  ('10000000-0000-0000-0000-000000000004', 'Uber', 'E-Hailing', false),
  ('10000000-0000-0000-0000-000000000005', 'Bolt', 'E-Hailing', false),
  ('10000000-0000-0000-0000-000000000006', 'Other/Unregistered', 'Taxi', true);

-- users (the sign-up trigger creates public.users and public.user_private)
insert into auth.users (instance_id, id, aud, role, email, phone, email_confirmed_at, phone_confirmed_at, encrypted_password, raw_app_meta_data, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'thabo@example.co.za', '27820000001', now(), now(), md5(random()::text),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Thabo Mokoena","id_number":"9803145009088"}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'lerato@example.co.za', null, now(), null, md5(random()::text),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Lerato Nkosi","id_number":"0107224012081"}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'sipho@example.co.za', null, now(), null, md5(random()::text),
    '{"provider":"email","providers":["email"],"role":"transport_admin"}', '{"full_name":"Sipho Dlamini","id_number":"8505055009088"}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'nomsa@example.co.za', null, now(), null, md5(random()::text),
    '{"provider":"email","providers":["email"],"role":"transport_admin"}', '{"full_name":"Nomsa Khumalo","id_number":"8808085009080"}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'saps.dispatch@example.co.za', null, now(), null, md5(random()::text),
    '{"provider":"email","providers":["email"],"role":"saps"}', '{"full_name":"SAPS Dispatch","id_number":"7909095009085"}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'sysadmin@example.co.za', null, now(), null, md5(random()::text),
    '{"provider":"email","providers":["email"],"role":"system_admin"}', '{"full_name":"System Admin","id_number":"7010105009080"}');
insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select id::text, id, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), 'email', now(), now(), now() from auth.users;

insert into public.org_admins (user_id, organization_id) values
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002');

-- reports (created in the past so the rate limits are not triggered)
insert into public.reports (id, reporter_id, organization_id, unlisted_entity_name, vehicle_plate, category, description, incident_at, location_lat, location_lng, location_text, created_at) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', null, 'CA 829-102', 'Overcharging', 'The driver charged R40 for a R25 trip and refused to give change.', now() - interval '10 days' - interval '1 hour', -33.9249, 18.4241, 'Bree Street taxi rank', now() - interval '10 days'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', null, 'BC 12 GP', 'Reckless & Negligent Driving', 'The driver jumped two red lights with passengers standing in the aisle.', now() - interval '9 days' - interval '1 hour', -26.2041, 28.0473, 'Johannesburg CBD', now() - interval '9 days'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', null, 'DD 44 TR GP', 'Unroadworthy Vehicle', 'The taxi had no working brake lights and a cracked windscreen.', now() - interval '8 days' - interval '1 hour', -26.2, 28.04, 'Park Station', now() - interval '8 days'),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', null, 'CA 614-990', 'Harassment', 'The driver shouted at passengers who asked him to slow down.', now() - interval '7 days' - interval '1 hour', -33.93, 18.42, 'Civic Centre', now() - interval '7 days'),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', null, 'CA 901-334', 'Sexual Misconduct', 'A passenger was touched inappropriately by the driver on the evening route.', now() - interval '6 days' - interval '1 hour', -33.95, 18.46, 'Mowbray', now() - interval '6 days'),
  ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'Khaya Express', 'ND 55 TR', 'Overcrowding & Safety Hazard', 'A minibus with about 25 people inside and the door tied shut with rope.', now() - interval '5 days' - interval '1 hour', -29.85, 31.02, 'Durban Station', now() - interval '5 days');

-- statuses: r2 Under Review, r3 Resolved, r4 Dismissed (r5 is Escalated by the trigger, r1 and r6 stay Submitted)
update public.reports set status = 'Under Review' where id in ('20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004');
update public.reports set status = 'Resolved', admin_decision = 'Operator warned', decision_reasoning = 'The vehicle was inspected and the owner has been told to fix it within 7 days.' where id = '20000000-0000-0000-0000-000000000003';
update public.reports set status = 'Dismissed', admin_decision = 'No breach found', decision_reasoning = 'The bus telematics show no speeding or abuse on that route that day.' where id = '20000000-0000-0000-0000-000000000004';

insert into public.report_media (report_id, kind, storage_path, size_bytes) values
  ('20000000-0000-0000-0000-000000000001', 'photo', '20000000-0000-0000-0000-000000000001/seed-1.jpg', 20000);
insert into public.evidence_requests (report_id, message, requested_by) values
  ('20000000-0000-0000-0000-000000000002', 'Please send a clearer photo or video that shows the vehicle number plate.', '00000000-0000-0000-0000-000000000003');

-- The seed must not leave notifications to be sent
delete from public.notification_outbox;
