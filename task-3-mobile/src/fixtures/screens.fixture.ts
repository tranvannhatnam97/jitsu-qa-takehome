import { test as base } from '@playwright/test';
import type { Browser } from 'webdriverio';
import { createDriver } from '@core/driver';
import { LoginScreen } from '@screens/login-screen';
import { ProfileScreen } from '@screens/profile-screen';
import { TutorialsScreen } from '@screens/tutorials-screen';
import { ActiveAssignmentScreen } from '@screens/active-assignment-screen';

/**
 * Fixtures wire a fresh Appium session into each spec, plus all four
 * screen objects pre-constructed against that driver.
 *
 * The `driver` fixture is worker-scoped lifecycle: it is created once
 * for the test, deleted on teardown. Screen fixtures are function-scoped
 * but cheap (just `new`), so they do not retain state across tests.
 */
type MobileFixtures = {
  driver: Browser;
  loginScreen: LoginScreen;
  profileScreen: ProfileScreen;
  tutorialsScreen: TutorialsScreen;
  activeAssignmentScreen: ActiveAssignmentScreen;
};

export const test = base.extend<MobileFixtures>({
  driver: async ({}, use) => {
    const driver = await createDriver();
    try {
      await use(driver);
    } finally {
      await driver.deleteSession().catch(() => {});
    }
  },
  loginScreen: async ({ driver }, use) => {
    await use(new LoginScreen(driver));
  },
  profileScreen: async ({ driver }, use) => {
    await use(new ProfileScreen(driver));
  },
  tutorialsScreen: async ({ driver }, use) => {
    await use(new TutorialsScreen(driver));
  },
  activeAssignmentScreen: async ({ driver }, use) => {
    await use(new ActiveAssignmentScreen(driver));
  },
});

export { expect } from '@playwright/test';
