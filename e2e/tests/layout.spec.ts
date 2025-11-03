import { expect, test } from '@playwright/test';

test('Layout renders locale switcher and toggles language', async ({ page }) => {
  await page.goto('/');

  // Locale buttons should be visible (use role-based locators to avoid ambiguous text matches)
  await expect(page.getByRole('button', { name: 'DE', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'EN', exact: true })).toBeVisible();

  const introTitle = page.locator('h1.intro-title');
  await expect(introTitle).toBeVisible();

  // Switch to English first so the toggle path is deterministic
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(introTitle).toHaveText(/Flashcards AP Part 1/);

  // Click DE and expect German title (use role-based click)
  await page.getByRole('button', { name: 'DE', exact: true }).click();
  await expect(introTitle).toHaveText(/Lernkarten AP Teil 1/);
});
