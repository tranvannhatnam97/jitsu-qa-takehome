import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
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
          framework: 'Playwright (request context)',
          target: 'api.github.com',
          org: process.env.GITHUB_ORG ?? 'SeleniumHQ',
          os: process.platform,
          node: process.version,
        },
      },
    ],
  ],
  use: {
    baseURL: 'https://api.github.com',
    extraHTTPHeaders: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'jitsu-qa-takehome',
    },
  },
});
