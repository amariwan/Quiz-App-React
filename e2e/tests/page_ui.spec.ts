import { expect, test } from '@playwright/test';

test('Main page renders title and start button', async ({ page }) => {
  await page.goto('/');

  await page.waitForSelector('h1.intro-title');
  const title = await page.textContent('h1.intro-title');
  expect(title).toBeTruthy();

  // Start button should be visible (use role-based locator to avoid ambiguous matches)
  await expect(page.getByRole('button', { name: 'Start Quiz', exact: true })).toBeVisible();
});
