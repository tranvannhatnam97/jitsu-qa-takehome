import { test, Page, TestInfo } from '@playwright/test';

/**
 * `test.step` wrapper that screenshots after each step and attaches the
 * image to the test info — Allure (and the Playwright HTML report) pick
 * the attachment up automatically. The screenshot is always full-page so
 * it captures the current state of the result page even after scrolling.
 */
export async function stepWithSnap<T>(
  page: Page,
  name: string,
  body: () => Promise<T>,
): Promise<T> {
  return test.step(name, async () => {
    try {
      return await body();
    } finally {
      const info: TestInfo | undefined = test.info();
      const buf = await page.screenshot({ fullPage: true }).catch(() => null);
      if (buf && info) {
        await info.attach(name, { body: buf, contentType: 'image/png' });
      }
    }
  });
}
