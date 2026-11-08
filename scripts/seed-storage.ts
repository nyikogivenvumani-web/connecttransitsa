// Dev only. Run after `npx supabase db reset`: sets real passwords on the seed accounts and uploads the seed evidence photo.
// Needs SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SEED_TEST_PASSWORD in .env. Never commit real values.
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.SEED_TEST_PASSWORD;
if (!url || !key || !password) {
  console.error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or SEED_TEST_PASSWORD in .env');
  process.exit(1);
}
if (!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(url)) {
  console.error('Refusing to seed a non-local Supabase project: ' + url);
  process.exit(1);
}
const admin = createClient(url, key, { auth: { persistSession: false } });

const seedUsers = [1, 2, 3, 4, 5, 6].map((n) => '00000000-0000-0000-0000-00000000000' + n);
for (const id of seedUsers) {
  const { error } = await admin.auth.admin.updateUserById(id, { password });
  if (error) { console.error('Could not set the password for ' + id + ': ' + error.message); process.exit(1); }
}

// 1x1 JPEG
const jpeg = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
const { error: upErr } = await admin.storage.from('evidence')
  .upload('20000000-0000-0000-0000-000000000001/seed-1.jpg', jpeg, { contentType: 'image/jpeg', upsert: true });
if (upErr) { console.error('Could not upload the seed photo: ' + upErr.message); process.exit(1); }

console.log('Seed accounts now use SEED_TEST_PASSWORD and the seed evidence photo is uploaded.');
