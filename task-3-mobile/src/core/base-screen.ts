import { expect } from '@playwright/test';
import type { Browser, ChainablePromiseElement } from 'webdriverio';

/**
 * Mobile-specific port of the BaseComponent / BasePage pattern from
 * tasks 1 and 2. Wraps a WebdriverIO `Browser` (the Appium session) with
 * the actions, reads, waits, and assertions our Page Objects need.
 *
 * Selector convention used in the screens:
 *   - `~accessibility_id`                            → preferred when ids are stable
 *   - `//android.widget.TextView[@text="..."]`       → text fallback
 *   - `android=new UiSelector().text("...")`         → UiAutomator strategy
 */
export abstract class BaseScreen {
  protected readonly driver: Browser;

  constructor(driver: Browser) {
    this.driver = driver;
  }

  // ── Locators ──────────────────────────────────────────────────────────
  protected $(selector: string): ChainablePromiseElement {
    return this.driver.$(selector);
  }

  /** Convenience: visible Android TextView whose `text` attribute matches. */
  protected byText(text: string): ChainablePromiseElement {
    return this.$(`//android.widget.TextView[@text="${text}"]`);
  }

  // ── Actions ───────────────────────────────────────────────────────────
  async tap(selector: string, timeout = 10_000): Promise<void> {
    const el = this.$(selector);
    await el.waitForDisplayed({ timeout });
    await el.click();
  }

  async type(selector: string, text: string, timeout = 10_000): Promise<void> {
    const el = this.$(selector);
    await el.waitForDisplayed({ timeout });
    await el.setValue(text);
  }

  // ── Reads / state ─────────────────────────────────────────────────────
  async textOf(selector: string, timeout = 10_000): Promise<string> {
    const el = this.$(selector);
    await el.waitForDisplayed({ timeout });
    return el.getText();
  }

  async isDisplayed(selector: string): Promise<boolean> {
    return this.$(selector).isDisplayed();
  }

  // ── Waits ─────────────────────────────────────────────────────────────
  async waitForDisplayed(selector: string, timeout = 15_000): Promise<void> {
    await this.$(selector).waitForDisplayed({ timeout });
  }

  // ── Assertions (using Playwright's expect) ────────────────────────────
  async assertDisplayed(selector: string, message?: string): Promise<void> {
    await expect.poll(async () => this.isDisplayed(selector), {
      message: message ?? `expected "${selector}" to be displayed`,
      timeout: 15_000,
      intervals: [250, 500, 1_000],
    }).toBe(true);
  }

  async assertText(selector: string, expected: string | RegExp, message?: string): Promise<void> {
    await expect.poll(async () => this.textOf(selector).catch(() => ''), {
      message,
      timeout: 15_000,
      intervals: [250, 500, 1_000],
    }).toMatch(expected instanceof RegExp ? expected : new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
}
