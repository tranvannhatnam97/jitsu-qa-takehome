import { Page } from '@playwright/test';
import { BasePage } from '@core/base-page';
import { TimeResultPage } from './time-result-page';

/**
 * time.is landing page. The visible search input lives in `#query_form input[name=query]`;
 * pressing Enter (or selecting the first suggestion) navigates to the city result page.
 */
export class HomePage extends BasePage {
  private readonly searchInput = 'input[name="query"]';
  private readonly searchSuggestion = '#query_results a';

  constructor(page: Page) {
    super(page, 'https://time.is/');
  }

  /**
   * Type a query, wait for the suggestion list, and click the first match.
   * Falls back to pressing Enter if no suggestions appear (some queries
   * resolve directly without the dropdown).
   */
  async searchCity(query: string): Promise<TimeResultPage> {
    await this.fill(this.searchInput, query);
    const suggestion = this.locator(this.searchSuggestion).first();
    try {
      await suggestion.waitFor({ state: 'visible', timeout: 3_000 });
      await Promise.all([
        this.page.waitForURL(/time\.is\/.+/, { timeout: 15_000 }),
        suggestion.click(),
      ]);
    } catch {
      await Promise.all([
        this.page.waitForURL(/time\.is\/.+/, { timeout: 15_000 }),
        this.press(this.searchInput, 'Enter'),
      ]);
    }
    return new TimeResultPage(this.page);
  }
}
