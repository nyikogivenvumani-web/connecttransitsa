import { test, expect, type Page } from '@playwright/test';

/**
 * T-E2E-5 (draft, not yet run): needs `supabase start`, the seed data (it contains an escalated report and an
 * oversight report) and SEED_TEST_PASSWORD set.
 */
async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(process.env.SEED_TEST_PASSWORD ?? '');
  await page.getByTestId('login-submit').click();
}

test('T-E2E-5: SAPS acknowledges an escalation', async ({ page }) => {
  await signIn(page, 'saps.dispatch@example.co.za');
  await expect(page).toHaveURL(/\/saps$/);
  await page.locator('[data-testid^="saps-ack-"]').first().click();
  await expect(page.getByText('Acknowledged').first()).toBeVisible();
});

test('T-E2E-5: System Admin tags an oversight report', async ({ page }) => {
  await signIn(page, 'sysadmin@example.co.za');
  await page.goto('/system/oversight');
  const select = page.locator('[data-testid^="tag-org-"]').first();
  await select.selectOption({ label: 'DORLJOTA' });
  await page.locator('[data-testid^="tag-btn-"]').first().click();
  await expect(page.getByTestId('oversight-empty')).toBeVisible();
});
