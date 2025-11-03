import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env.CI;
const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e/tests',
  timeout: 45_000,

  expect: {
    timeout: 7_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
    toMatchSnapshot: { maxDiffPixelRatio: 0.02 },
  },

  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 2 : undefined,

  reporter: CI
    ? [
        ['github'],
        ['junit', { outputFile: 'results/junit.xml' }],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['blob'],
      ]
    : [['list'], ['html', { outputFolder: 'playwright-report', open: 'on-failure' }]],

  use: {
    baseURL: BASE_URL,
    headless: true,
    viewport: { width: 1366, height: 900 },
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: CI ? 'retain-on-failure' : 'off',
    testIdAttribute: 'data-testid',
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    colorScheme: 'light',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, grepInvert: /@no-firefox/ },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, grepInvert: /@no-webkit/ },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] }, grep: /@mobile/ },
    { name: 'chromium-dark', use: { ...devices['Desktop Chrome'], colorScheme: 'dark' } },
  ],

  outputDir: 'test-results',

  webServer: [
    {
      command: CI ? `pnpm build && pnpm preview --port ${PORT}` : `pnpm dev --port ${PORT}`,
      url: BASE_URL,
      reuseExistingServer: !CI,
      timeout: 120_000,
    },
  ],
});
