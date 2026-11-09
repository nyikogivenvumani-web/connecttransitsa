import { test, expect } from '@playwright/test';

/** A4 and P1 (draft, not yet run): needs `supabase start` and the seed data. */
test('P1: an unknown token shows the inactive message', async ({ page }) => {
  await page.goto('/live/not-a-real-token');
  await expect(page.getByText('This link is no longer active.')).toBeVisible();
});

test('A4: SAPS sees the live SOS page', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-email').fill('saps.dispatch@example.co.za');
  await page.getByTestId('login-password').fill(process.env.SEED_TEST_PASSWORD ?? '');
  await page.getByTestId('login-submit').click();
  await page.goto('/saps/sos');
  await expect(page.getByRole('heading', { name: 'Live SOS' })).toBeVisible();
});
