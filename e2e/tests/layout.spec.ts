import { expect, test } from '@playwright/test';

test('Layout renders locale switcher and toggles language', async ({ page }) => {
  await page.goto('/');

  // Locale buttons should be visible (use role-based locators to avoid ambiguous text matches)
  await expect(page.getByRole('button', { name: 'DE', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'EN', exact: true })).toBeVisible();

  // Heading initially English (from locales/en.json)
  await page.waitForSelector('h1.intro-title');
  const titleBefore = await page.textContent('h1.intro-title');
  expect(titleBefore).toBeTruthy();

  // Click DE and expect German title (use role-based click)
  await page.getByRole('button', { name: 'DE', exact: true }).click();
  await expect(page.locator('h1.intro-title')).toHaveText(/Lernkarten AP Teil 1/);
});
