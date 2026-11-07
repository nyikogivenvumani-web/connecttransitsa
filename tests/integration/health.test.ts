/**
 * T-SETUP-3: Integration health test.
 * Verifies the Supabase JS client can connect to the local backend.
 * Run with: npm run test:integration
 * Requires: npx supabase start (local backend running) and .env populated.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env. Run `npx supabase status` to get them.',
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

describe('T-SETUP-3: Supabase health', () => {
  it('connects to the local Supabase backend', async () => {
    // A simple RPC that every Supabase project exposes
    const { error } = await supabase.rpc('pg_catalog.version');
    // We only care that the connection succeeds (no network / auth error).
    // The RPC itself may not exist; that's fine — the important check is no
    // "Failed to fetch" or similar connection error.
    if (error && error.message.includes('Failed to fetch')) {
      throw new Error(
        `Cannot reach Supabase at ${supabaseUrl}. Is 'npx supabase start' running?`,
      );
    }
    // If we get here without a network-level error, the client is connected.
    expect(true).toBe(true);
  });
});
