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
      // `commit` resolves as soon as the navigation URL changes — we
      // do not need the load or DOMContentLoaded event because the
      // result-page selectors do their own waitFor downstream. The
      // looser default (`load`) regularly times out on CI because
      // time.is loads dozens of third-party ad scripts.
      this.page.waitForURL(/time\.is\/[^?#]+/, { timeout: 15_000, waitUntil: 'commit' }),
      this.press(this.searchInput, 'Enter'),
    ]);
    return new TimeResultPage(this.page);
  }
}
