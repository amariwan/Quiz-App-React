import { expect, test } from '@playwright/test';

test('Layout renders locale switcher and toggles language', async ({ page }) => {
  await page.goto('/');

  // Locale buttons should be visible
  await page.waitForSelector('text=DE');
  await expect(page.locator('text=DE')).toBeVisible();
  await expect(page.locator('text=EN')).toBeVisible();

  // Heading initially English (from locales/en.json)
  await page.waitForSelector('h1.intro-title');
  const titleBefore = await page.textContent('h1.intro-title');
  expect(titleBefore).toBeTruthy();

  // Click DE and expect German title
  await page.click('text=DE');
  await expect(page.locator('h1.intro-title')).toHaveText(/Lernkarten AP Teil 1/);
});
