import { expect, test } from '@playwright/test';

test('Main page renders title and start button', async ({ page }) => {
  await page.goto('/');

  await page.waitForSelector('h1.intro-title');
  const title = await page.textContent('h1.intro-title');
  expect(title).toBeTruthy();

  const startButton = page.locator('button.intro-button');
  await expect(startButton).toBeVisible();
  await expect(startButton).toHaveText(/(Start Quiz|Quiz starten)/);
});
