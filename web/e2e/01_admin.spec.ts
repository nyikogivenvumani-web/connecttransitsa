import { test, expect } from '@playwright/test';

/**
 * T-E2E-4 (draft, not yet run): needs `supabase start`, the seed data and SEED_TEST_PASSWORD set.
 * Signs in as sipho, opens the first case, resolves it with a reason, signs out.
 */
test('T-E2E-4: admin resolves a case', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-email').fill('sipho@example.co.za');
  await page.getByTestId('login-password').fill(process.env.SEED_TEST_PASSWORD ?? '');
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByTestId('cell-caseRef').first().click();
  await expect(page.getByText('Anonymized Commuter').first()).toBeVisible();
  await page.getByTestId('status-option-Under Review').click();
  await page.getByTestId('decision-save').click();
  await page.getByTestId('status-option-Resolved').click();
  await page.getByTestId('decision-summary').fill('Operator formally warned');
  await page.getByTestId('decision-reasoning').fill('Evidence confirms the overcharge occurred.');
  await page.getByTestId('decision-save').click();
  await expect(page.getByText('This case has already been decided.')).toBeVisible();
});
