import { expect, test } from '@playwright/test';

test('Locale selection persists in localStorage and survives reload', async ({ page }) => {
  await page.goto('/');

  // ensure EN button visible then click DE
  await page.waitForSelector('text=EN');
  await page.click('text=DE');

  // check localStorage value
  const stored = await page.evaluate(() => localStorage.getItem('locale'));
  expect(stored).toBe('de');

  // reload and ensure heading is German
  await page.reload();
  await page.waitForSelector('h1.intro-title');
  await expect(page.locator('h1.intro-title')).toHaveText(/Lernkarten AP Teil 1/);
});
