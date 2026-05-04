import { defineConfig } from '@playwright/test';

/**
 * Mobile tests share a single Appium session per spec — no parallel workers
 * (one device / emulator at a time) and no project sharding. The test
 * fixture in src/fixtures/screens.fixture.ts owns the driver lifecycle
 * and the on-device screen recording.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 5 * 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    [
      'allure-playwright',
      {
        detail: true,
        suiteTitle: false,
        environmentInfo: {
          framework: 'Appium 2 + WebdriverIO 9 (Playwright runner)',
          platform: 'Android',
          device: process.env.DEVICE_NAME ?? 'Android Emulator',
          os: process.platform,
          node: process.version,
        },
      },
    ],
  ],
});
