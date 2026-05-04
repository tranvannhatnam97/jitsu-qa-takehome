import { defineConfig } from '@playwright/test';

/**
 * Mobile tests share a single Appium session per spec — no parallel workers
 * (one device / emulator at a time) and no project sharding. The test
 * fixture in src/fixtures/screens.fixture.ts owns the driver lifecycle.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 5 * 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
});
