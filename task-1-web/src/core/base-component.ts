import { expect, Locator, Page } from '@playwright/test';

/**
 * Thin wrapper around a Playwright Page that provides ergonomic action,
 * read, wait, and assertion helpers. Page Objects (and reusable widgets)
 * extend this class so they share a consistent surface.
 *
 * Ported from `automation-test-agent/src/domains/qa/pages/base_component.py`.
 */
export class BaseComponent {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Action helpers ────────────────────────────────────────────────────
  async click(selector: string | Locator, options?: { timeout?: number; force?: boolean }) {
    await this.locator(selector).click(options);
  }

  async fill(selector: string | Locator, value: string, options?: { timeout?: number }) {
    await this.locator(selector).fill(value, options);
  }

  async type(selector: string | Locator, value: string, options?: { delay?: number; timeout?: number }) {
    await this.locator(selector).pressSequentially(value, options);
  }

  async press(selector: string | Locator, key: string, options?: { timeout?: number }) {
    await this.locator(selector).press(key, options);
  }

  async hover(selector: string | Locator, options?: { timeout?: number }) {
    await this.locator(selector).hover(options);
  }

  // ── Read helpers ──────────────────────────────────────────────────────
  async innerText(selector: string | Locator, options?: { timeout?: number }): Promise<string> {
    return this.locator(selector).innerText(options);
  }

  async textContent(selector: string | Locator, options?: { timeout?: number }): Promise<string | null> {
    return this.locator(selector).textContent(options);
  }

  async getAttribute(selector: string | Locator, name: string, options?: { timeout?: number }): Promise<string | null> {
    return this.locator(selector).getAttribute(name, options);
  }

  async count(selector: string | Locator): Promise<number> {
    return this.locator(selector).count();
  }

  // ── Locator + wait helpers ────────────────────────────────────────────
  locator(selector: string | Locator): Locator {
    return typeof selector === 'string' ? this.page.locator(selector) : selector;
  }

  async waitForVisible(selector: string | Locator, timeout = 10_000): Promise<void> {
    await this.locator(selector).waitFor({ state: 'visible', timeout });
  }

  async waitForHidden(selector: string | Locator, timeout = 10_000): Promise<void> {
    await this.locator(selector).waitFor({ state: 'hidden', timeout });
  }

  // ── Assertions (use Playwright's auto-retrying matchers) ──────────────
  async assertVisible(selector: string | Locator, message?: string): Promise<void> {
    await expect(this.locator(selector), message).toBeVisible();
  }

  async assertText(selector: string | Locator, expected: string | RegExp, message?: string): Promise<void> {
    await expect(this.locator(selector), message).toHaveText(expected);
  }

  async assertContainsText(selector: string | Locator, expected: string | RegExp, message?: string): Promise<void> {
    await expect(this.locator(selector), message).toContainText(expected);
  }
}
