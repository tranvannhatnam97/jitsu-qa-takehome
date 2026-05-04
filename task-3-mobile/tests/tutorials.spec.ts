import { test, expect } from '@fixtures/screens.fixture';

const CREDENTIALS = {
  username: 'auto_244332',
  password: 'Testing1!',
};

test.describe('Jitsu Driver — Tutorials', () => {
  test('login → Profile → Tutorials shows all sections; Assigned Route launches tutorial', async ({
    loginScreen,
    tutorialsScreen,
    activeAssignmentScreen,
  }) => {
    let profileScreen!: Awaited<ReturnType<typeof loginScreen.login>>;

    await test.step('1. log in with test credentials', async () => {
      await loginScreen.waitUntilReady();
      profileScreen = await loginScreen.login(CREDENTIALS.username, CREDENTIALS.password);
    });

    await test.step('2. Profile screen is open; tap Tutorials', async () => {
      await profileScreen.openTutorials();
    });

    await test.step('3. Tutorials screen shows the three sections', async () => {
      await tutorialsScreen.assertAllSectionsVisible();
    });

    await test.step('4. tap Assigned Route', async () => {
      await tutorialsScreen.tapAssignedRoute();
    });

    await test.step('5. Active Assignment screen shows tutorial for Assigned Route', async () => {
      await activeAssignmentScreen.assertTutorialFor('Assigned Route');
    });

    await test.step('6. start tutorial — verify tutorial content loads', async () => {
      const wasActive = await activeAssignmentScreen.isTutorialActive();
      await activeAssignmentScreen.startTutorial();
      await activeAssignmentScreen.assertTutorialContentLoaded();
      expect.soft(wasActive, 'tutorial-active state recorded for diagnostics').toBeDefined();
    });
  });
});
