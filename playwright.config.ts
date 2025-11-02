import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Tests are located under the `e2e/tests` directory in this repo.
  testDir: './e2e/tests',
  timeout: 30_000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  // Put the HTML report inside the `e2e/playwright-report` folder.
  reporter: [['list'], ['html', { outputFolder: 'e2e/playwright-report' }]],
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 5000,
    baseURL: 'http://localhost:3000',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
});
