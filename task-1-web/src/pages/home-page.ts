import { Page } from '@playwright/test';
import { BasePage } from '@core/base-page';
import { TimeResultPage } from './time-result-page';

/**
 * time.is landing page. The search box is `<input id="q" name="q">` inside
 * `<form id="qbox" action="/" method="get">`. Submitting the form (Enter
 * or click submit) navigates to `/<City_With_Underscores>` for a known
 * place — no autocomplete suggestions are rendered.
 */
export class HomePage extends BasePage {
  private readonly searchInput = '#q';

  constructor(page: Page) {
    super(page, 'https://time.is/');
  }

  /**
   * Type the query, submit the form, and wait for the result-page URL.
   * We use `waitForURL(/time\.is\/.+/)` rather than asserting an exact
   * slug — different queries can resolve to different paths (e.g.
   * "Los Angeles" → /Los_Angeles, "London" → /London).
   */
  async searchCity(query: string): Promise<TimeResultPage> {
    await this.fill(this.searchInput, query);
    await Promise.all([
      // The result page loads dozens of third-party ad scripts that can
      // delay the `load` event well past 30 s. We only need the result
      // markup, so wait for `domcontentloaded` (or just the URL change).
      this.page.waitForURL(/time\.is\/[^?#]+/, { timeout: 15_000, waitUntil: 'domcontentloaded' }),
      this.press(this.searchInput, 'Enter'),
    ]);
    return new TimeResultPage(this.page);
  }
}
