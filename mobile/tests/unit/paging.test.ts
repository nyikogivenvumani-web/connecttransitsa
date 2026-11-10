/** T-NFR-5 (client side) – lists ask for 20 rows at a time */
import { fetchAllMyCases, PAGE_SIZE } from '../../lib/api/cases';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({ supabase: { from: jest.fn() } }));

it('asks for 20 rows by default and more only when told', async () => {
  const limit = jest.fn().mockResolvedValue({ data: [], error: null });
  (supabase.from as jest.Mock).mockReturnValue({ select: () => ({ order: () => ({ limit }) }) });
  expect(PAGE_SIZE).toBe(20);
  await fetchAllMyCases();
  expect(limit).toHaveBeenLastCalledWith(20);
  await fetchAllMyCases(40);
  expect(limit).toHaveBeenLastCalledWith(40);
});
