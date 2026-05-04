import { Page } from '@playwright/test';
import { BasePage } from '@core/base-page';
import { TimeResultPage } from './time-result-page';

/**
 * time.is landing page. Search input is `<input id="q" name="q">` inside
 * `<form id="qbox" action="/" method="get">`. The result page lives at
 * `/<City_With_Underscores>`.
 *
 * CI / region quirks the search method absorbs:
 *   - A consent acknowledgement modal ("We have received your choices…")
 *     pops up on the first load in EU/Frankfurt regions. We register a
 *     Playwright locator handler that auto-dismisses it whenever it
 *     appears during ANY action — survives reappearance, runs without
 *     blocking the calling code.
 *   - Some regions show an autocomplete dropdown (links inside a table)
 *     after typing. Pressing Enter while the dropdown is focused does
 *     not submit the form. We click the first suggestion when present
 *     and fall back to Enter when the dropdown is absent.
 */
export class HomePage extends BasePage {
  private readonly searchInput = '#q';
  // Any anchor whose href starts with "/" inside a table that follows
  // the search input — covers the autocomplete dropdown variants we
  // have observed (no class, no id) without coupling to the markup.
  private readonly suggestionLink = '#qbox table a[href^="/"], table a[href^="/Los_"]';

  constructor(page: Page) {
    super(page, 'https://time.is/');
  }

  /** Override `open()` so the consent handler is wired before the first navigation. */
  async open(timeout = 30_000): Promise<void> {
    await this.installConsentDismisser();
    await super.open(timeout);
  }

  async searchCity(query: string): Promise<TimeResultPage> {
    await this.fill(this.searchInput, query);

    // The autocomplete dropdown (a `<table>` of suggestion links) is the
    // primary entry-point on regions that show it. Read the first
    // suggestion's href — this is the URL the search resolved to — and
    // navigate to it directly. Going through the form / Enter / click
    // path was producing inconsistent navigation events on CI runners
    // because the consent dialog and ad scripts both intercept clicks.
    const suggestion = this.page.locator(this.suggestionLink).first();
    let href: string | null = null;
    try {
      await suggestion.waitFor({ state: 'attached', timeout: 5_000 });
      href = await suggestion.getAttribute('href');
    } catch {
      /* no dropdown — fall back to the slug we expect from the query */
    }

    const slug = query.trim().replace(/\s+/g, '_');
    const target = href ? new URL(href, 'https://time.is').toString() : `https://time.is/${slug}`;
    await this.page.goto(target, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    return new TimeResultPage(this.page);
  }

  /**
   * Register a Playwright locator handler that clicks the consent
   * modal's "OK"/Close button whenever it appears. The handler runs
   * automatically before any action that would otherwise be blocked by
   * the modal — no need to sprinkle dismiss calls through the spec.
   */
  private async installConsentDismisser(): Promise<void> {
    const dialog = this.page.getByRole('dialog').filter({
      hasText: /received your choices|use of cookies|we value your privacy/i,
    });
    await this.page.addLocatorHandler(dialog, async () => {
      const close = dialog.getByRole('button').first();
      await close.click({ timeout: 2_000 }).catch(() => {});
    });
  }
}
