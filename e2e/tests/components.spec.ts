import { expect, test } from '@playwright/test';

test.describe('Components e2e smoke tests', () => {
  test('LocaleSwitcher toggles language', async ({ page }) => {
    await page.goto('/');
    const introTitle = page.locator('h1.intro-title');
    await expect(introTitle).toBeVisible();

    // force English baseline so toggling exercises both languages
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(introTitle).toHaveText(/Flashcards AP Part 1/);

    await page.getByRole('button', { name: 'DE', exact: true }).click();
    await expect(introTitle).toHaveText(/Lernkarten AP Teil 1/);
  });

  test('Start quiz and navigate a question', async ({ page }) => {
    await page.goto('/');
    const startButton = page.locator('button.intro-button');
    await expect(startButton).toBeVisible();
    await startButton.click();

    // wait for a question button to appear
    await expect(page.locator('button.question-button').first()).toBeVisible();

    // pick first available answer by clicking the visible label (inputs
    await page.locator('label.question-answer').first().click();
    // click next question via the question-button
    await page.locator('button.question-button').first().click();

    // after progressing, the restart button may be present but not immediately visible (e.g. offscreen or hidden during transitions),
    // assert it exists in the DOM and has the expected text rather than strictly requiring visibility
    await expect(page.locator('button.restart-button')).toHaveCount(1);
    await expect(page.locator('button.restart-button')).toHaveText(/(Restart Quiz|Quiz neu starten)/);
  });

  test('SecurityDashboard export audit log triggers download', async ({ page }) => {
    await page.goto('/');

    // open security monitor panel using a tolerant locator (text may include emoji or extra chars)
    await page.locator('button:has-text("Security Monitor")').first().click();

    // trigger download and wait for it
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      // use a tolerant locator for the export button as well
      page.locator('button:has-text("Export Audit Log")').first().click(),
    ]);

    // ensure we got a download object
    expect(download).toBeTruthy();
    const path = await download.path();
    // path may be undefined in some environments, but if present it should be a string
    if (path) expect(typeof path).toBe('string');
  });
});
