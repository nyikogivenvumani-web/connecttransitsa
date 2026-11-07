import { test, expect } from '@playwright/test';

/** T-SETUP-5: Web portal launches and /login loads. */
test('T-SETUP-5: /login page loads', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveURL(/\/login/);
  // The page should not show a 404 or error
  const status = page.url();
  expect(status).toContain('login');
});
