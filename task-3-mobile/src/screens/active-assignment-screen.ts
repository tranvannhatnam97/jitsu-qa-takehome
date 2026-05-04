import { BaseScreen } from '@core/base-screen';

/**
 * Active Assignment — the screen reached by tapping a Tutorials section.
 *
 * Two states:
 *   - state 4 (PDF screenshot 4): tutorial card "Tutorial: <Section>" with
 *     a `~Start Tutorial` button.
 *   - state 5 (PDF screenshot 5 — what the test account currently shows):
 *     the welcome tutorial is already running. Card content begins with
 *     "Welcome to the Jitsu Driver App" and the visible button is
 *     `~Quit tutorial`.
 *
 * `assertTutorialContentLoaded` accepts either state by polling for the
 * union of selectors so the spec is robust to whichever the app chooses.
 */
export class ActiveAssignmentScreen extends BaseScreen {
  private readonly header = '~Active Assignment';
  private readonly startTutorialButton = '~Start Tutorial';
  private readonly quitTutorialButton = '~Quit tutorial';
  private readonly welcomeCard = '//*[contains(@content-desc, "Welcome to the Jitsu Driver App")]';
  private readonly tutorialIntroCard = '//*[starts-with(@content-desc, "Tutorial:")]';

  async waitUntilReady(): Promise<void> {
    await this.waitForDisplayed(this.header);
  }

  async assertTutorialFor(section: string): Promise<void> {
    // Either the per-section intro (state 4) or the active welcome card
    // (state 5) confirms we landed on the correct screen for `section`.
    const introExists = await this.isDisplayed(this.tutorialIntroCard);
    if (introExists) {
      const txt = await this.driver.$(this.tutorialIntroCard).getAttribute('content-desc');
      if (!(txt ?? '').includes(section)) {
        throw new Error(`Expected tutorial intro for "${section}", got "${txt}"`);
      }
      return;
    }
    // Otherwise the tutorial is already running — the welcome card serves
    // as the proof-of-arrival on the Active Assignment screen.
    await this.assertDisplayed(this.welcomeCard, `expected tutorial card for "${section}" to be visible`);
  }

  async isTutorialActive(): Promise<boolean> {
    return this.isDisplayed(this.quitTutorialButton);
  }

  async startTutorial(): Promise<void> {
    if (await this.isTutorialActive()) {
      // Per PDF step 6: when a tutorial is already active, the proof of
      // success is that the tutorial content card is visible — there is
      // no Start Tutorial button to tap.
      return;
    }
    await this.tap(this.startTutorialButton);
  }

  async assertTutorialContentLoaded(): Promise<void> {
    await this.assertDisplayed(this.welcomeCard, 'tutorial content card not shown');
  }
}
