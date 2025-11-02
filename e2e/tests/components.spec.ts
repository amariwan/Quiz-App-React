import { expect, test } from '@playwright/test';

test.describe('Components e2e smoke tests', () => {
  test('LocaleSwitcher toggles language', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1.intro-title');

    const before = await page.textContent('h1.intro-title');
    expect(before).toContain('Flashcards');

    // click DE button and expect German title
    await page.click('text=DE');
    await expect(page.locator('h1.intro-title')).toHaveText(/Lernkarten AP Teil 1/);
  });

  test('Start quiz and navigate a question', async ({ page }) => {
    await page.goto('/');
    // start button (English default)
    await page.click('text=Start Quiz');

    // wait for a question button to appear
    await page.waitForSelector('button.question-button');

    // pick first available radio and continue
    await page.click('input[type="radio"]');
    await page.click('text=Next Question');

    // after progressing, restart button should be visible in the UI
    await expect(page.locator('button.restart-button')).toBeVisible();
  });

  test('SecurityDashboard export audit log triggers download', async ({ page }) => {
    await page.goto('/');

    // open security monitor panel
    await page.click('text=Security Monitor');

    // trigger download and wait for it
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('text=Export Audit Log'),
    ]);

    // ensure we got a download object
    expect(download).toBeTruthy();
    const path = await download.path();
    // path may be undefined in some environments, but if present it should be a string
    if (path) expect(typeof path).toBe('string');
  });
});
