/**
 * Supabase client for the commuter app.
 *
 * Rules (Section 2 #10):
 * - Only uses EXPO_PUBLIC_ variables (safe; every table/bucket has RLS).
 * - Session stored in expo-secure-store with a chunked adapter because
 *   SecureStore values are limited to ~2 KB.
 * - flowType: 'pkce' as required by Section 1 Step 2.
 */
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

// Chunk size safely under SecureStore's ~2 KB key limit.
const CHUNK_SIZE = 1900;

const ChunkedSecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const chunkCountStr = await SecureStore.getItemAsync(`${key}_chunks`);
    if (!chunkCountStr) {
      return SecureStore.getItemAsync(key);
    }
    const chunkCount = parseInt(chunkCountStr, 10);
    const chunks = await Promise.all(
      Array.from({ length: chunkCount }, (_, i) =>
        SecureStore.getItemAsync(`${key}_${i}`),
      ),
    );
    return chunks.every((c) => c !== null) ? chunks.join('') : null;
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.deleteItemAsync(`${key}_chunks`).catch(() => undefined);
      return SecureStore.setItemAsync(key, value);
    }
    const chunks = value.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'g')) ?? [];
    await SecureStore.setItemAsync(`${key}_chunks`, String(chunks.length));
    await Promise.all(
      chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}_${i}`, chunk)),
    );
  },

  async removeItem(key: string): Promise<void> {
    const chunkCountStr = await SecureStore.getItemAsync(`${key}_chunks`);
    if (chunkCountStr) {
      const chunkCount = parseInt(chunkCountStr, 10);
      await SecureStore.deleteItemAsync(`${key}_chunks`);
      await Promise.all(
        Array.from({ length: chunkCount }, (_, i) =>
          SecureStore.deleteItemAsync(`${key}_${i}`),
        ),
      );
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ChunkedSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});
