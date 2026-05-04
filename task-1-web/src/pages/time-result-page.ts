import { expect, Page } from '@playwright/test';
import { BasePage } from '@core/base-page';

/**
 * Result page shown for a specific city, e.g. https://time.is/Los_Angeles
 *
 * Selector notes — verified against the live site at the time of writing:
 *   - `#clock` → the live updating clock, text formatted as `HH:MM:SS`
 *   - `#dd`    → the date line ("Sunday, May 3, 2026")
 *   - `h1`     → city heading ("Time in Los Angeles, California, United States now")
 */
export class TimeResultPage extends BasePage {
  private readonly heading = 'h1';
  private readonly dateLabel = '#dd';
  private readonly clock = '#clock';

  constructor(page: Page) {
    super(page);
  }

  // ── Reads ─────────────────────────────────────────────────────────────
  async cityHeading(): Promise<string> {
    return (await this.innerText(this.heading)).trim();
  }

  async dateText(): Promise<string> {
    return (await this.innerText(this.dateLabel)).trim();
  }

  /** Returns the digits-only HH:MM:SS portion of the live clock. */
  async clockTime(): Promise<string> {
    const raw = (await this.innerText(this.clock)).trim();
    const match = raw.match(/\d{1,2}:\d{2}:\d{2}/);
    if (!match) {
      throw new Error(`Clock text "${raw}" does not contain HH:MM:SS`);
    }
    return match[0];
  }

  // ── Assertions ────────────────────────────────────────────────────────
  async assertHeadingContains(city: string): Promise<void> {
    await this.assertContainsText(this.heading, new RegExp(city, 'i'));
  }

  async assertDateVisible(): Promise<void> {
    await this.assertVisible(this.dateLabel);
    await expect(this.locator(this.dateLabel)).not.toHaveText('');
  }

  /**
   * Verify the clock text matches HH:MM:SS and that the seconds value
   * advances inside `windowMs`. Uses `expect.poll` so we never sleep
   * blindly — the moment a different timestamp is observed the check
   * passes.
   */
  async assertClockTicks(windowMs = 3_000): Promise<void> {
    const initial = await this.clockTime();
    expect(initial, 'clock should be HH:MM:SS').toMatch(/^\d{1,2}:\d{2}:\d{2}$/);

    await expect
      .poll(async () => this.clockTime(), {
        message: `clock did not advance within ${windowMs}ms`,
        timeout: windowMs,
        intervals: [250, 500, 750, 1_000],
      })
      .not.toBe(initial);
  }
}
