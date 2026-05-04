import { test as base } from '@playwright/test';
import { HomePage } from '@pages/home-page';
import { TimeResultPage } from '@pages/time-result-page';

/**
 * Custom fixtures so tests can declare which page objects they need
 * instead of constructing them by hand. Each page object is a
 * function-scoped fixture: a fresh instance per test, no leaking state.
 *
 * Usage:
 *   import { test, expect } from '@fixtures/pages.fixture';
 *   test('...', async ({ homePage }) => { ... });
 */
type PageFixtures = {
  homePage: HomePage;
  timeResultPage: TimeResultPage;
};

export const test = base.extend<PageFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  timeResultPage: async ({ page }, use) => {
    await use(new TimeResultPage(page));
  },
});

export { expect } from '@playwright/test';
