import { Page } from '@playwright/test';
import { BasePage } from '@core/base-page';
import { TimeResultPage } from './time-result-page';

/**
 * time.is landing page. Search input is `<input id="q" name="q">` inside
 * `<form id="qbox" action="/" method="get">`. The result page lives at
 * `/<City_With_Underscores>`.
 *
 * Two CI/region quirks that the search method has to absorb:
 *   - A one-time GDPR consent modal can appear on first load (text:
 *     "We have received your choices…"). We dismiss it if present.
 *   - On some regions an autocomplete dropdown appears after typing —
 *     pressing Enter then targets the suggestion list rather than the
 *     form, so we try clicking the first suggestion link first and fall
 *     back to Enter if no suggestions render.
 */
export class HomePage extends BasePage {
  private readonly searchInput = '#q';
  private readonly suggestionLink = '#query_results a, #q + .qboxlist a, table.suggest_table a';
  private readonly consentModalClose = 'button:has-text("OK"), button[aria-label*="Close"]';

  constructor(page: Page) {
    super(page, 'https://time.is/');
  }

  async searchCity(query: string): Promise<TimeResultPage> {
    await this.dismissConsentIfPresent();
    await this.fill(this.searchInput, query);

    const suggestion = this.page.locator(this.suggestionLink).first();
    let suggestionClicked = false;
    try {
      await suggestion.waitFor({ state: 'visible', timeout: 2_500 });
      suggestionClicked = true;
    } catch {
      // No autocomplete on this region — fall through to form submit.
    }

    await Promise.all([
      // `commit` resolves as soon as the navigation URL changes; we do
      // not depend on `load` because time.is loads dozens of ad scripts
      // that delay it past 30 s on CI.
      this.page.waitForURL(/time\.is\/[^?#]+/, { timeout: 20_000, waitUntil: 'commit' }),
      suggestionClicked ? suggestion.click() : this.press(this.searchInput, 'Enter'),
    ]);

    return new TimeResultPage(this.page);
  }

  private async dismissConsentIfPresent(): Promise<void> {
    const close = this.page.locator(this.consentModalClose).first();
    if (await close.isVisible().catch(() => false)) {
      await close.click().catch(() => {});
      await this.page.waitForTimeout(300);
    }
  }
}
