import { BaseScreen } from '@core/base-screen';
import { TutorialsScreen } from './tutorials-screen';

/**
 * Profile tab — reached via the rightmost bottom-nav icon.
 *
 * Verified selectors:
 *   - bottom-nav profile tab: content-desc starts with "Profile" and
 *     contains "Tab 5 of 5"; we match on partial content-desc to avoid
 *     hard-coding the embedded newline.
 *   - "Tutorials" row: a clickable View whose content-desc is exactly
 *     "Tutorials". Its bounding box overlaps the bottom-nav, so we tap
 *     in the upper quarter to keep the click off the Messenger icon.
 */
export class ProfileScreen extends BaseScreen {
  private readonly profileTab =
    '//*[contains(@content-desc, "Profile") and contains(@content-desc, "Tab")]';
  private readonly tutorialsRow = '//*[@content-desc="Tutorials"]';
  private readonly accountInformation = '~Account Information';

  /**
   * After login, the Instabug onboarding card overlays the home. The
   * fastest dismissal we found in probing is a single tap at the top of
   * the screen — outside the centred dialog — which collapses it.
   */
  async dismissInstabugOverlay(): Promise<void> {
    await this.driver.pause(2000);
    const { width } = await this.driver.getWindowSize();
    await this.driver
      .action('pointer')
      .move({ x: Math.round(width / 2), y: 100 })
      .down()
      .pause(40)
      .up()
      .perform();
    await this.driver.pause(500);
  }

  async waitUntilReady(): Promise<void> {
    // Open the Profile tab first (we may land on Routes by default).
    await this.openProfileTab();
    await this.waitForDisplayed(this.tutorialsRow);
  }

  async openProfileTab(): Promise<void> {
    const tab = this.$(this.profileTab);
    await tab.waitForDisplayed({ timeout: 15_000 });
    await tab.click();
    await this.waitForDisplayed(this.accountInformation);
  }

  async openTutorials(): Promise<TutorialsScreen> {
    const row = this.$(this.tutorialsRow);
    await row.waitForDisplayed({ timeout: 10_000 });

    // Tap upper-quarter of the row to avoid the Messenger tab whose
    // bounds overlap with the row's lower edge.
    const loc = await row.getLocation();
    const size = await row.getSize();
    await this.driver
      .action('pointer')
      .move({ x: Math.round(loc.x + size.width / 2), y: Math.round(loc.y + size.height / 4) })
      .down()
      .pause(40)
      .up()
      .perform();

    const tutorials = new TutorialsScreen(this.driver);
    await tutorials.waitUntilReady();
    return tutorials;
  }
}
