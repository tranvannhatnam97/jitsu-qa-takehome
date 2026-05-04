import { Page } from '@playwright/test';
import { BaseComponent } from './base-component';

/**
 * Page that knows its own URL and exposes navigation helpers.
 * Domain-specific pages (HomePage, TimeResultPage, ...) extend this.
 *
 * Ported from `automation-test-agent/src/domains/qa/pages/base_page.py`,
 * stripped of the recording/streaming features that aren't needed here.
 */
export abstract class BasePage extends BaseComponent {
  /** Default URL or path for the page. May be undefined for pages reached via navigation only. */
  protected readonly url?: string;

  constructor(page: Page, url?: string) {
    super(page);
    this.url = url;
  }

  /** Navigate to this page's `url`. Throws if no url was provided. */
  async open(timeout = 30_000): Promise<void> {
    if (!this.url) {
      throw new Error(`${this.constructor.name} has no default url; pass one to the constructor.`);
    }
    await this.page.goto(this.url, { timeout, waitUntil: 'domcontentloaded' });
  }

  async reload(timeout = 30_000): Promise<void> {
    await this.page.reload({ timeout });
  }

  async title(): Promise<string> {
    return this.page.title();
  }
}
