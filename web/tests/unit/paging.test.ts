/** T-NFR-5 (client side) – lists ask for 20 rows at a time */
import { fetchAdminCases, PAGE_SIZE } from '../../lib/api/admin';
import { fetchSapsQueue } from '../../lib/api/saps';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({ supabase: { from: jest.fn() } }));

it('admin cases and the SAPS queue ask for 20 rows by default', async () => {
  const limit = jest.fn().mockResolvedValue({ data: [], error: null });
  const chain = { select: () => chain, eq: () => chain, order: () => ({ limit }) };
  (supabase.from as jest.Mock).mockReturnValue(chain);
  expect(PAGE_SIZE).toBe(20);
  await fetchAdminCases();
  expect(limit).toHaveBeenLastCalledWith(20);
  await fetchSapsQueue();
  expect(limit).toHaveBeenLastCalledWith(20);
  await fetchAdminCases(60);
  expect(limit).toHaveBeenLastCalledWith(60);
});
